var protocolBase = require('./Oring.Server.ProtocolBase.js'),
		WebsocketServer = require('websocket').server,
    	OringWebMethod = require('./Oring.Server.WebMethodBase.js'),
    	OutgoingMessageBase = require('./Oring.Server.OutgoingMessageBase.js');

var create = function() {
	var protocolName = "webSocket";

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
					

						_log.info("options", options);

						/// Setup the websocket server using the webserver
						this._ws = new WebsocketServer({
						      httpServer: oringServer.getWebServer(),
						      autoAcceptConnections: false
						});

						/// Handle connection attempts
						this._ws.on('request', function(request) {

							var conn = null;
							_log.info("Connection request", request.requestedProtocols);
							if (request.requestedProtocols.indexOf(options.protocolName) !== -1) {
								
								var client = oringServer.createConnection({
									send : function(msg) {
										var id = this.getConnectionId();
										if (conn) {
											if (msg.__proto__ == OutgoingMessageBase) {
												var str = msg.toJSON();
												console.warn(id + " ws.send " + str);
												conn.send(str);
											}
										}
									}
								}),
								parameters = oringServer.getParametersFromURL(request.resource);
								
								_log.info("["+client.getConnectionId()+"] Client created");

								//_log.info(client.id);

								var eventResult = oringServer.triggerConnectingEvent(client, parameters)
									.done(function() {
										conn = request.accept(options.protocolName, request.origin);
										_log.info("["+client.getConnectionId()+"] WebSocket connection accepted", options.protocolName, request.origin);

										oringServer.addConnection(client)
											.done(function() {
												_log.debug("["+client.getConnectionId()+"] Connection added");

												oringServer.triggerConnectedEvent(client);
												var handshakeResponse = oringServer.createMessage("oring:handshake", 
													{ id : client.getConnectionId(), methods : oringServer.getMethodsForClient(client)} );

												_log.debug("["+client.getConnectionId()+"] Sending handshake");
												client.send(handshakeResponse);

												conn.on('close', function() {
													_log.debug("["+client.getConnectionId()+"] Websocket connection was lost");
													oringServer.lostConnection(client.getConnectionId()).done(function() {
														oringServer.triggerDisconnectedEvent(client);
													});

												});

												conn.on('message', function(e) {
													if (e.type == 'utf8') {
														var msg = oringServer.parseIncomingMessage(e.utf8Data);
														if(msg) {
															_log.debug("["+client.getConnectionId()+"] Message received", msg);
															oringServer.messageReceived(client.getConnectionId(), msg)
											            	.done(function(responseMessage) {
											            		if (responseMessage) {
												            		console.log("responseMessage", responseMessage);
														          	client.send(responseMessage);
														         }
											            	})
											            	.fail(function() {
											            		console.warn("FAIL");
											            	});
														}
													}
												});

											})
											.fail(function() {
												var handshakeResponse = oringServer.createMessage("oring:connection-failed");
												client.send(handshakeResponse);
												conn.close();
											});
										
									})
									.fail(function() {
										_log.info("["+client.getConnectionId()+"] Client refused by 'connecting' event");
										var handshakeResponse = oringServer.createMessage("oring:connection-rejected");
										request.reject(403, "nej");
									});
								} else {
									request.reject(403, "Bad protocol for oringserver");
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
