

function LongPollingClient() {

	var _ws,
			self = this;

	this.onclose = null;
	this.onmessage = null;

	this.send = function(message) {
		if (message.__proto__ == Request) {
			if (_ws) {
				console.warn("SEND", message);
				_ws.send(message.toJSON());
			}
		} else {
			logError("That's no request");
		}
	}

	this.start = function(uri, hubs) {
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
		if (hubs && hubs.length > 0)  {
			if (uri.querystring) url += "&";
			url += "__oringhubs=" + encodeURIComponent(hubs.join(','));
		}

		console.warn("longPolling", url)
		ajax({
			url : url
		}, function() {
			deferred.resolve();
		}, function() {
			deferred.reject();

		})


		return deferred.promise();

	}

}


_clients.push({name : "longPolling", class : LongPollingClient});