var protocolBase = require('./Oring.Server.ProtocolBase.js'),
    serverUtilities = require('./Oring.Server.Utilities.js'),
    	OutgoingMessageBase = require('./Oring.Server.OutgoingMessageBase.js');

var create = function() {
	var protocolName = "longPolling",
		_messageQueue = {},
		_clientSeen = {};

	protocol = Object.create(protocolBase, {
			name : { 
				value : protocolName,
				enumerable: false
			},
			defaultOptions : {
				value : {
					protocolName : 'oringserver'
				},
				enumerable : false
			},
			start : {
				value : function() {

				var oringServer = this.oringServer,
					webServer = oringServer.getWebServer(),
					options = oringServer.getOptions(protocolName, this.defaultOptions),
					_log = this._log;
				
					oringServer.on('webRequest', function(e) {
						
						var params = serverUtilities.parseQuerystring(e.request.url);

						if (params['__oringprotocol'] == protocolName) {
							var connectionID = e.request.headers["x-oring-connection"];
							if (e.request.method.toLowerCase() == "get" && !e.request.headers["x-oring-request"]) {

								var client = oringServer.createConnection({
									send : function(msg) {
											if (msg.__proto__ == OutgoingMessageBase) {
												if (!_messageQueue[this.getConnectionId()]) _messageQueue[this.getConnectionId()] = [];
												_messageQueue[this.getConnectionId()].push({
													d : (new Date()).getTime(),
													m : msg.toJSON()
												});
											} else {
												console.warn("MESSAGE WAS NOT OutgoingMessageBase");
											}
									}
								});


								oringServer.addConnection(client);
								_clientSeen[client.getConnectionId()] = new Date();

								function checkIfSeen(c) {
									var now = new Date();
									if (_clientSeen[c.getConnectionId()] ) {
										var diff = now.getTime() - _clientSeen[c.getConnectionId()].getTime();
										console.warn("diff", diff);
										if (diff > 10000) {
											console.log("Connection timed out" );
											oringServer.lostConnection(c);
											delete _clientSeen[c.getConnectionId()];
											return;
										}
										setTimeout(function() {checkIfSeen(c);}, 5000);
									} else {
										console.warn("No " + c.getConnectionId());
									}
								}

								console.warn("Start check...");
								setTimeout(function() {checkIfSeen(client);}, 5000);

								// The handshake yo
								var message = oringServer.createMessage("oring:handshake", {id : client.getConnectionId(), methods : oringServer.getMethodsForClient(client) });
			 					e.response.writeHead(200, {
					              'Content-type': 'application/json',
					              'Access-Control-Allow-Origin' : '*'
					          	});
				  	        	e.response.write(message.toJSON());
				  	        	e.response.end();
								e.cancel();


							} else if (e.request.method.toLowerCase() == "get" && e.request.headers["x-oring-request"]) {
								// Polling
								e.cancel();
								var messageJson = "";
								var connectionID = e.request.headers["x-oring-request"];
								_clientSeen[connectionID] = new Date();

								if (_messageQueue[connectionID]) {
									var _itemsToSend = _messageQueue[connectionID].slice();
									_messageQueue[connectionID] = [];
									for (var i=0; i < _itemsToSend.length; i++) {
										if (messageJson.length > 0) messageJson += ",";
										messageJson+=_itemsToSend[i].m;
									}
								}
								e.response.setHeader('Access-Control-Allow-Origin', '*');
								e.response.setHeader('Content-Type', 'application/json');
								e.response.writeHead(200);
				  	        	e.response.write("["+messageJson+"]");
				  	        	e.response.end();
							} else if (e.request.method.toLowerCase() == "post" && e.request.headers["x-oring-request"]) {
								e.cancel();
								_clientSeen[e.request.headers["x-oring-request"]] = new Date();
								var body = '';
						        e.request.on('data', function (data) {
						            body += data;
						            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
						            if (body.length > 1e6) { 
						                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
						                e.request.connection.destroy();
						            }
						        });
						        e.request.on('end', function () {
						            // use POST
						            
						            var msg = oringServer.parseIncomingMessage(body);
						            if (msg) {
							            oringServer.messageReceived(msg)
							            	.done(function(responseMessage) {
									          	console.warn("RESPONSE:" + responseMessage);
												e.response.setHeader('Access-Control-Allow-Origin', '*');
												e.response.setHeader('Content-Type', 'application/json');
												e.response.writeHead(200);
								  	        	e.response.write(responseMessage.toJSON());
								  	        	e.response.end();
							            	})
							            	.fail(function() {
							            		e.response.writeHead(500, {
									              'Content-Type': 'application/json',
									              'Access-Control-Allow-Origin' : '*'
									          	});
								  	        	e.response.write(JSON.stringify({
								  	        		status: "error",
								  	        		message: "An error occured processing the message"
								  	        	}));
								  	        	e.response.end();
							            	});
					 					
						  	        } else {
						  	        	e.response.writeHead(500, {
							              'Content-type': 'application/json',
									              'Access-Control-Allow-Origin' : '*'
							          	});
						  	        	e.response.write(JSON.stringify({
						  	        		status: "error",
						  	        		message: "Bad request"
						  	        	}));
						  	        	e.response.end();
						  	        }

						        });

								
								
							}
						}
					});

				}
			},
			send : {
				value : function() {

				}
			}
		});



	return protocol;
}

module.exports = {create : create};
