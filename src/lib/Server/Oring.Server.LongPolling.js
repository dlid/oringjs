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
										var id = this.getConnectionId();
											if (msg.__proto__ == OutgoingMessageBase) {
												console.warn(id + " longpolling send " + msg.toJSON());
												if (!_messageQueue[id]) _messageQueue[id] = [];
												_messageQueue[id].push({
													d : (new Date()).getTime(),
													m : msg.toJSON()
												});
											} else {
												console.warn("MESSAGE WAS NOT OutgoingMessageBase");
											}
									}
								});


								var parameters = serverUtilities.parseQuerystring(e.request.url);

								var eventResult = oringServer.triggerConnectedEvent(client, parameters);
								if (eventResult.cancel) {
									var message = oringServer.createMessage("oring:connection-refused");
									serverUtilities.createHttpResponse(e.response, 500, null, message.toJSON())
									e.cancel();
									return;
								}

								oringServer.addConnection(client);
								console.log("  >ping client " + client.getConnectionId() + " longpolling.webrequest");
								client.seen(new Date());

								function checkIfSeen(connectionId) {
									oringServer.getConnectionById(connectionId).done(function(c) {
										var now = new Date(),
											seen = c.seen();
										if (seen) {
											var diff = now.getTime() - seen.getTime();
											if (diff > 20000) {
												console.log("["+connectionId+"] Connection timed out" );
												oringServer.lostConnection(connectionId);
												return;
											}
											setTimeout(function() {checkIfSeen(connectionId);}, 5000);
										} else {
											console.warn("["+connectionId+"] Could not get __seen value");
										}
									})
									.fail(function() {
										console.log("["+connectionId+"] Connection disappeared" );
										oringServer.lostConnection(connectionId);
									});
									
								}

								console.warn("["+client.getConnectionId()+"] Start check...");
								setTimeout(function() {checkIfSeen(client.getConnectionId())}, 5000);

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
								
								oringServer.getConnectionById(e.request.headers["x-oring-request"])	
									.done(function(client) {
										e.cancel();	
										client.seen(new Date());
										console.log("  >ping client " + client.getConnectionId() + " longpolling.get latest");
										var messageJson = "",
											connectionID = client.getConnectionId();

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
									})
									.fail(function() {
										e.cancel();
										/// Server does not have the client specified. Tell client to shake hands
										var message = oringServer.createMessage("oring:reacquaint");
					 					e.response.writeHead(200, {
							              'Content-type': 'application/json',
							              'Access-Control-Allow-Origin' : '*'
							          	});
						  	        	e.response.write(message.toJSON());
						  	        	e.response.end();
										
									});
								}
								
							}
					});
					return true;
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
