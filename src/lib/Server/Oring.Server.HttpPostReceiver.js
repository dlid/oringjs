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

											var msg = oringServer.parseIncomingMessage(body);

											if(msg) {
												oringServer.messageReceived(client.getConnectionId(), msg)
								            	.done(function(responseMessage) {
								            		if (responseMessage) {
									            		console.log("responseMessage", responseMessage);
											          	client.send(responseMessage);
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
					
/*
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
							            oringServer.messageReceived(e.request.headers["x-oring-request"], msg)
							            	.done(function(responseMessage) {
							            		var output = null;
							            		if (responseMessage){
							            			output = responseMessage.toJSON();
							            		} else {
							            			output = JSON.stringify({status : "success"});
							            		}
									          	console.warn("RESPONSE:" + output);
												e.response.setHeader('Access-Control-Allow-Origin', '*');
												e.response.setHeader('Content-Type', 'application/json');
												e.response.writeHead(200);
								  	        	e.response.write(output);
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
							}*/
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
