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
					
						_log.debug("options", options ? options : '(None)');

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
								e.cancel();
								oringServer.triggerConnectingEvent(client, parameters)
									.done(function() {
										oringServer.addConnection(client).done(function() {
											_log.log("["+client.getConnectionId()+"] Client connected");
											client.seen(new Date());
											oringServer.triggerConnectedEvent(client);

											function checkIfSeen(connectionId) {
												oringServer.getConnectionById(connectionId).done(function(c) {
													var now = new Date(),
														seen = c.seen();
													if (seen) {
														var diff = now.getTime() - seen.getTime();
														if (diff > 20000) {
															_log.debug("["+client.getConnectionId()+"] Client timed out");
															oringServer.lostConnection(connectionId).done(function() {
																oringServer.triggerDisconnectedEvent(c);
															});
															return;
														}
														setTimeout(function() {checkIfSeen(connectionId);}, 5000);
													} else {
														_log.debug("["+client.getConnectionId()+"] Could not get 'seen' value. Removing client.");
														oringServer.lostConnection(connectionId).done(function() {
															oringServer.triggerDisconnectedEvent(c);
														});
													}
												})
												.fail(function() {
													_log.debug("["+connectionId+"] Could not find client");
													oringServer.lostConnection(connectionId);
												});
												
											}

											setTimeout(function() {checkIfSeen(client.getConnectionId())}, 5000);

											_log.debug("["+client.getConnectionId()+"] Sending handshake");
											// The handshake yo
											var message = oringServer.createMessage("oring:handshake", {id : client.getConnectionId(), methods : oringServer.getMethodsForClient(client) });
						 					e.response.writeHead(200, {
								              'Content-type': 'application/json',
								              'Access-Control-Allow-Origin' : '*'
								          	});
							  	        	e.response.write(message.toJSON());
							  	        	e.response.end();
										})
										.fail(function() {
											// Somehow the connection failed
											var message = oringServer.createMessage("oring:connection-failed");
											serverUtilities.createHttpResponse(e.response, 500, null, message.toJSON())
											
										});
										
									})
									.fail(function() {
										e.cancel();
										_log.debug("["+client.getConnectionId()+"] Connection was refused by 'connecting' event");
										console.warn("naea");
										var message = oringServer.createMessage("oring:connection-refused");
										serverUtilities.createHttpResponse(e.response, 500, null, message.toJSON())
										
									});

								


							} else if (e.request.method.toLowerCase() == "get" && e.request.headers["x-oring-request"]) {
								// Polling
								
								_log.debug("["+e.request.headers["x-oring-request"]+"] Is polling for events");

								oringServer.getConnectionById(e.request.headers["x-oring-request"])	
									.done(function(client) {
										e.cancel();	
										client.seen(new Date());
										var messageJson = "",
											connectionID = client.getConnectionId();

										if (_messageQueue[connectionID]) {
											var _itemsToSend = _messageQueue[connectionID].slice();
											_messageQueue[connectionID] = [];
											for (var i=0; i < _itemsToSend.length; i++) {
												if (messageJson.length > 0) messageJson += ",";
												messageJson+=_itemsToSend[i].m;
											}
											_log.debug("["+e.request.headers["x-oring-request"]+"] Returned " + _itemsToSend.length + " event(s)");
										}

										e.response.setHeader('Access-Control-Allow-Origin', '*');
										e.response.setHeader('Content-Type', 'application/json');
										e.response.writeHead(200);
						  	        	e.response.write("["+messageJson+"]");
						  	        	e.response.end();
									})
									.fail(function() {
										_log.debug("["+e.request.headers["x-oring-request"]+"] Connection was not found");
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
