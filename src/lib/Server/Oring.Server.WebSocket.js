var protocolBase = require('./Oring.Server.ProtocolBase.js'),
		WebsocketServer = require('websocket').server;

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
									send : function(name, data) {
										if (conn) {
											var message = oringServer.createMessage(name, data);
											console.warn("SEND to " + this.getConnectionId());
											conn.send(message);
										}
									}
								}),
										parameters = oringServer.getParametersFromURL(request.resource);

								_log.info(client.id);

								var eventResult = oringServer.triggerConnectedEvent(client, parameters);
								if (!eventResult.cancel) {
									console.log("GROUPS " + JSON.stringify(eventResult.groups) )
									conn = request.accept(options.protocolName, request.origin);
									client.send("oring:handshake", { methods : oringServer.getMethodsForClient(client)});

									
								} else {
									request.reject(403, eventResult.reason);
								}
								
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
