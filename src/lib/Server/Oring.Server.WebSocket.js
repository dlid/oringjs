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
					
						this._ws = new WebsocketServer({
						      httpServer: oringServer.getWebServer(),
						      autoAcceptConnections: false
						});

						this._ws.on('request', function(request) {
							console.warn("connection requested", request.requestedProtocols);
							var conn = null;
							_log.info("Connection request", request.requestedProtocols);
							if (request.requestedProtocols.indexOf(options.protocolName) !== -1) {
								_log.info("Connection request", request.requestedProtocols);
								
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
								console.warn("connection requested", client.getConnectionId());
								//_log.info(client.id);

								console.log("triggerConnectingEvent websocket");
								var eventResult = oringServer.triggerConnectingEvent(client, parameters)
									.done(function() {
										conn = request.accept(options.protocolName, request.origin);

										oringServer.addConnection(client)
											.done(function() {

												oringServer.triggerConnectedEvent(client);
												var handshakeResponse = oringServer.createMessage("oring:handshake", 
													{ id : client.getConnectionId(), methods : oringServer.getMethodsForClient(client)} );

												client.send(handshakeResponse);

												conn.on('close', function() {
													oringServer.lostConnection(client.getConnectionId()).done(function() {
														oringServer.triggerDisconnectedEvent(client);
													});

												});

												conn.on('message', function(e) {
													if (e.type == 'utf8') {
														var msg = oringServer.parseIncomingMessage(e.utf8Data);
														if(msg) {
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
										console.log("kom hit iaf");
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
