
function OringClient(options) {

	var defaultClients = ['webSocket', 'longPolling'];

	var settings = _core.extend({
		url : null,
		hubs : [],
		transferProtocols : defaultClients
	}, options),
	_preferredClients  = [],
	ix,
	_protocolNotFound = false,
	_connection,
	_isEnabled = false,
	_connectCallback;

	if (options.transferProtocols)
		settings.transferProtocols = options.transferProtocols;

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

	console.warn("SETTINGS", settings);

	var _uri = parseUrl(options.url);

	// Loop through the protocols and connect to the first one possible
	function connect() {
			var deferred = _core.Deferred();

			var c = null,
				ix = -1,
				handshakeComplete = false;

			function tryNext() {
				ix+=1;
				if (ix < _preferredClients.length) {

					c = new _preferredClients[ix].class(_preferredClients[ix].name);
					
					
					c.start(_uri, settings.hubs, {parseMessage : parseMessage})
						.done(function(e) {

							c.onclose = function() {
								console.error("Connection was lost!!!! NOOOO!");
							};

							if (_connection) {
								console.warn("[OOAOAAO] An existing connection exists! MÖÖÖRGE!");
							}

							/// Connection successful.
							/// Hand over the connection lifecycle to a new OringConnection
							_connection = Object.create(OringConnection);
							_connection.start(c, function(context) {
								deferred.resolve(context);
							});	

							if (e.message) {
								_connection.onmessage(e.message);
							}

						})
						.fail(function() {
							console.warn("Noo, " + _preferredClients[ix].name + " failed");
							tryNext();
						});

				} else {
					deferred.reject();
					setTimeout(function() {
						deferred.reject();
					})
				}
			}

			tryNext();

			return deferred.promise();
	}


	this.start = function(connectCallback) {
		connectCallback = connectCallback;
		_isEnabled = true;
		logInfo("Attempting to connect...");
		var attemptConnect = function() {
			connect()
			.done(function(connectionContext) {
				connectCallback(connectionContext);
			})
			.fail(function() {
				if (_isEnabled) {
					logInfo("Could not connect. Waiting to retry...");
					setTimeout(attemptConnect, 5000);
				}
			})
		}
		attemptConnect();

	}

	this.stop = function() {
		if (_connection) {
			_connection.stop();
		}
		_isEnabled = false;
	}


	if (!options.url) {
		logError("URL was not provided"); 
	}


}