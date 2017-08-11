
function OringClient(options) {

	var defaultClients = ['webSocket', 'longPolling'];

	var settings = _core.extend({
		url : null,
		hubs : [],
		transferProtocols : defaultClients
	}, options);

	if (options.transferProtocols)
		settings.transferProtocols = options.transferProtocols;

	console.warn("SETTINGS", settings);

	function parseUrl(url) {
		var i = url.indexOf('?'),
				querystring = null;
		if (i!=-1) {
			querystring = url.substring(i+1);
			url = url.substring(0, i);
		}

		var m = url.match(/((?:http|ws|)s?:\/\/|^)([^:]+?)(?::(\d+)|$)/);
		if (m) {
			var schema = m[1],
					path = m[2],
					port = m[3] ? m[3] : null;



			return {
				schema : schema ? schema.replace(/:\/\/$/, '') : "http",
				path : path,
				port : port,
				querystring : querystring
			};
		}
	}


	var _uri = parseUrl(options.url);

	function handleHandshake(handshakeMessage, methodInvocationCallback) {

		if (handshakeMessage.__proto__ == ServerMessage) {
			var methods = handshakeMessage.getData().methods,
				i,
				context = {},
				methodName;

            if (!methods) return null;

            var name ;
			for (i = 0; i < methods.length; i++) {
				name =  methods[i].n;
				
                if (name.indexOf('.') === -1) {
                    methodName = name;
                    hub = "*";
                } else {
                    var d = name.split('.');
                    hub = d[0];
                    methodName = d[1];
                }

				context[methodName] = function(hub, name, hasResponse) {
                    return function() {
                        console.warn("CALL", hub, name);
                        var _i = null;
                        if (hasResponse) {_i = createInvocationId();}
                        return methodInvocationCallback(hub, name,  _i, argumentsToArray(arguments));
                    }
                }(hub, methodName, methods[i].r);
				
			}
			return context;
		}

		return null;

	}


	this.start = function() {
			var deferred = _core.Deferred();

			var c = null,
					ix = -1,
					handshakeComplete = false,
					_preferredClients  = [],
					_protocolNotFound = false;

			for (ix = 0; ix < settings.transferProtocols.length; ix++) {
				_protocolNotFound = true;
				for (c = 0; c < _clients.length; c++) {
					if (settings.transferProtocols[ix] == _clients[c].name) {
						_preferredClients.push(_clients[c]);
						_protocolNotFound = false;
						break;
					}
 				}
 				if (_protocolNotFound) {
 					logError("Unknown transferProtcol", settings.transferProtocols[ix]);
 				}
			}
			ix = -1; c = null;

            var _pendingRequests = {};

			function tryNext() {
				ix+=1;
				if (ix < _preferredClients.length) {

					c = new _preferredClients[ix].class();
					c.onclose = function() {
						console.warn("Connection was lost");
					};
					
					c.start(_uri, settings.hubs, {
                        parseMessage : parseMessage
                    })
						.done(function(e) {
							var initialMessage = null;
                            if (e.message)
                                initialMessage = e.message;

							c.onmessage = function(m) {
								
								if (!handshakeComplete) {
									if (m.getType() == "oring:handshake") {
										handshakeComplete = true;
										var h = handleHandshake(m, function(hub, methodName, invocationId, arguments) {
											var invokeDeferred = _core.Deferred();

											var msg = createMessage("oring:invoke", {hub : hub, name : methodName, args : arguments}, invocationId);

    											if (invocationId) {

                                                    _pendingRequests["oring:response__" + invocationId] = {
                                                        _created : (new Date()).getTime(),
                                                        _def : invokeDeferred
                                                    };

    												console.warn("WOA! Listen for", "oring:response__" + invocationId);
                                                }

    											c.send(msg);

    											if (!invocationId) {
    												invokeDeferred.resolve();
    											}

											return invokeDeferred.promise();
										});
										if (h) {
											h.transferProtocol = _preferredClients[ix].name;
											deferred.resolve(h);
										}
										console.warn("handskahe complete");
									} else {
										console.warn("Message received without handshake...", m);
									}
								} else {
									console.warn("[incoming] ", m);
                                    if (typeof _pendingRequests[m.getType()] != "undefined") {
                                        _pendingRequests[m.getType()]._def.resolve(m.getData());
                                        return;
                                    }
								}
							};
                            console.warn("Alright, " + _preferredClients[ix].name + " succeeded");
                            if (initialMessage) {
                                c.onmessage(initialMessage);
                            }


						})
						.fail(function() {
							console.warn("Noo, " + _preferredClients[ix].name + " failed");
							tryNext();
						});

				} else {
					logError("No protocol could connect ("+settings.transferProtocols.join(',')+")");
					deferred.reject();
				}
			}

			tryNext();

			return deferred.promise();
	}



	if (!options.url) {
		logError("URL was not provided"); 
	}


}