

function LongPollingClient(name) {

	var _ws,
		self = this,
		_connectionId,
		_sendUrl,
		_opt,
		_pollTimer = null

	this.name = name;
	this.onclose = null;
	this.onmessage = null;
	this.stop = function() {
		if(_pollTimer) {
			console.warn("Stopping poll timer");
			clearTimeout(_pollTimer);
		}
	};

	this.send = function(message) {
		if (message.__proto__ == Request) {
			if (_connectionId) {
				console.warn("queue message for polling", _connectionId, message);
				//_ws.send(message.toJSON());
				ajax({
					method : 'post',
					url : _sendUrl,
					headers : {
						"X-Oring-Request" : _connectionId,
						"Content-Type" : "application/json"
					},
					data : message.toJSON()
				}, 
				function(responseBody) {
					var msg = _opt.parseMessage(responseBody);
					if (msg) {
						self.onmessage(msg);
					}
				},
				function(r) {
					console.warn("FAILED",r);
				});
			}
		} else {
			logError("That's no request");
		}
	} 

	this.start = function(uri, hubs, opt) {
		_opt = opt;
		var deferred = _core.Deferred(),
			qs = { '__oringprotocol' : 'longPolling' };

		_sendUrl = createUrl(combineUrl(uri, {
			schema : "http",
			querystring : qs
		}));

		if (hubs && hubs.length > 0) {
			qs['__oringhubs'] = encodeURIComponent(hubs.join(','));
		}

		if (opt.connectionId) {
			qs['__reconnect'] = opt.connectionId;
		}

		url = createUrl(combineUrl(uri, {
			schema : "http",
			querystring : qs
		}));

	
		ajax({
			url : url
		}, function(r) {
			// We pass the message immediatly since the onmessage is not hooked up until the connection is created
			
			// We need the connection id
			var message = _opt.parseMessage(r),
				failedPollAttempts = 0;
			if (message) {
				if (message.data.id) {
					_connectionId = message.data.id;
					

					function pollTick() {
						ajax({
							url : _sendUrl + "&ping",
							headers : {
								"X-Oring-Request" : _connectionId,
								"Content-Type" : "application/json"
							}
						}, function(r) {
							var o;
							try {o = JSON.parse(r);} catch(e) {}

							console.warn("POLL RECEIVED", r);

							if (typeof o == "object" && o.length >= 0) {
								for (var i=0; i < o.length; i+=1) {
									console.warn(" poll message ["+i+"]", o[i]);
									var m = _opt.parseMessage(o[i]);
									if(m) {
										failedPollAttempts = 0;
										self.onmessage(m);
									}
								}
								_pollTimer = setTimeout(pollTick, 10000);
								return;
							}

							// We received something strange. A fail this is!
							if (failedPollAttempts >= 3) {
								if (typeof self.onclose == "function") {
									if (typeof self.onopen == "function") {
										logInfo("longPolling unexpected response (attempt "+failedPollAttempts+")");
										self.onclose();
									}
								}
							} else {
								failedPollAttempts+=1;
							}

						}, function(r) {
							if (failedPollAttempts >= 3) {
								if (typeof self.onclose == "function") {
									self.onclose(r);
								}
							} else {
								logInfo("longPolling failed (attempt "+failedPollAttempts+")");
								failedPollAttempts+=1;
								_pollTimer = setTimeout(pollTick, 5000);
							}
						});
					}

					_pollTimer = setTimeout(pollTick, 10000);

					deferred.resolve({
						message : message
					});

				}
			} else {
				deferred.reject("Invalid message");
			}
		}, function() {
			deferred.reject();
		})


		return deferred.promise();

	}

}


_clients.push({name : "longPolling", class : LongPollingClient});