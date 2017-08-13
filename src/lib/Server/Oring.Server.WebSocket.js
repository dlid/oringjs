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

							var conn = null;

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

								_log.info(client.id);

								var eventResult = oringServer.triggerConnectedEvent(client, parameters);
								if (!eventResult.cancel) {
									console.log("GROUPS " + JSON.stringify(eventResult.groups) )
									conn = request.accept(options.protocolName, request.origin);
									
									var handshakeResponse = oringServer.createMessage("oring:handshake", 
										{ id : client.getConnectionId(), methods : oringServer.getMethodsForClient(client)});

									client.send(handshakeResponse);

									conn.on('close', function() {
										oringServer.lostConnection(client);
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
								            	})
											}
										}
									});
  
									
								} else {
									request.reject(403, eventResult.reason);
								}
								
								oringServer.addConnection(client);

								// Create the client object
								
								//oringServer.addConnection(client);

								



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
