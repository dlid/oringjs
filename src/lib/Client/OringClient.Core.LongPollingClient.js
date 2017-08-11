

function LongPollingClient() {

	var _ws,
		self = this,
		_connectionId,
		_sendUrl,
		_opt;

	this.onclose = null;
	this.onmessage = null;

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
					self.onmessage(_opt.parseMessage(responseBody));
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
		var deferred = _core.Deferred();
		var url = "";
		if (uri.schema == "https"|| uri.schema == "wss")
			url = "https://";
		else 
			url = "http://";

		url += uri.path;

		if (uri.port) url += ":" + uri.port;
		if (uri.querystring) url += "?" + uri.querystring;

		if (uri.querystring) url += "&"; else url +="?";
		url += "__oringprotocol=longPolling";
		_sendUrl = url;
		if (hubs && hubs.length > 0)  {
			if (uri.querystring) url += "&";
			url += "__oringhubs=" + encodeURIComponent(hubs.join(','));
		}

	


		ajax({
			url : url
		}, function(r) {
			// We pass the message immediatly since the onmessage is not hooked up until the connection is created
			
			// We need the connection id
			var message = _opt.parseMessage(r);
			if (message) {
				if (message.data.id) {
					_connectionId = message.data.id;
					deferred.resolve({
						message : message
					});

					setInterval(function() {
						ajax({
							url : _sendUrl + "&ping",
							headers : {
								"X-Oring-Request" : _connectionId,
								"Content-Type" : "application/json"
							}
						}, function(r) {
							var o;
							try {o = JSON.parse(r);} catch(e) {}
							if (typeof o == "object" && o.length > 0) {
								for (var i=0; i < o.length; i+=1) {
									var m = _opt.parseMessage(o[i]);
									if(m) {
										self.onmessage(m);
									}
								}
							}
						}, function() {
							console.warn("longPolling ping failed...");
						});
					}, 10000)

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