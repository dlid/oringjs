/**
 * This Protocol will only take care of HTTP POST messages sent to the server
 * and parse them as an Oring message if possible
 *
 */
var protocolBase = require('./Oring.Server.ProtocolBase.js'),
    serverUtilities = require('./Oring.Server.Utilities.js'),
    	OutgoingMessageBase = require('./Oring.Server.OutgoingMessageBase.js');

var create = function() {
	var protocolName = "httpPostReceiver";

	protocol = Object.create(protocolBase, {
			name : { 
				value : protocolName,
				enumerable: false
			},
			defaultOptions : {
				value : {
					protocolName : 'httpPostReceiver'
				},
				enumerable : false
			},
			start : {
				value : function() {

				var oringServer = this.oringServer,
					webServer = oringServer.getWebServer(),
					options = oringServer.getOptions(protocolName, this.defaultOptions),
					enums = oringServer.getOptions().enum;
					_log = this._log;
				
					oringServer.on('webRequest', function(e) {
						
						var params = serverUtilities.parseQuerystring(e.request.url);

						if (e.request.method.toLowerCase() == "post" && e.request.headers["x-oring-request"]) {

								var showError = null;
								
								oringServer.getConnectionById(e.request.headers["x-oring-request"])
									.done(function(client) {
										console.log("**** CLIENT " + client.getConnectionId());
										client.seen(new Date());

										console.log("  >ping client " + client.getConnectionId() + " httpPostReceiver.post");

										serverUtilities.readRequestBody(e.request, function(body) {
											e.cancel();
											var msg = oringServer.parseIncomingMessage(body);

											if(msg) {
												oringServer.messageReceived(client.getConnectionId(), msg)
								            	.done(function(responseMessage) {
								            		if (responseMessage) {
									            		console.log("responseMessage", responseMessage);
											          	serverUtilities.createHttpResponse(e.response, 200, {}, responseMessage.toJSON());
											         } else {
											          	serverUtilities.createHttpResponse(e.response, 200, {}, "no response");
											         }
								            	})
								            	.fail(function(r) {
								            		serverUtilities.createHttpResponse(e.response, 200, {}, "failed (HttpPostReceiver)");
								            	});
											} else {
												var m = oringServer.createMessage('oring:invalid-msg');
								            	serverUtilities.createHttpResponse(e.response, 200, {}, m.toJSON());
											}

										});

										//client.setProperty(enums.seenPropertyKey, new Date());
										e.cancel();
									})
									.fail(function() {
										serverUtilities.createHttpResponse(e.response, 500, {}, 'Unkown connection ');
									});
					
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
