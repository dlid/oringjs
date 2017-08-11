var protocolBase = require('./Oring.Server.ProtocolBase.js'),
    serverUtilities = require('./Oring.Server.Utilities.js');

var create = function() {
	var protocolName = "longPolling";

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


							var client = oringServer.createConnection({
									send : function(name, data) {
										if (conn) {
											var message = oringServer.createMessage(name, data);
											console.warn("[SAVE FOR NEXT POLL]" + this.getConnectionId());
										}
									}
								});


							if (!e.request.headers["x-oring-connection"]) {
								// The handshake yo
								var message = oringServer.createMessage("oring:handshake", {id : client.getConnectionId(), params : params});
			 					e.response.writeHead(200, {
					              'Content-type': 'application/json',
					              'Access-Control-Allow-Origin' : '*'
					          	});
				  	        	e.response.write(message);
				  	        	e.response.end();
								e.cancel();
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
