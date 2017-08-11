

function WebSocketClient() {

	var _ws,
			self = this;

	this.onclose = null;
	this.onmessage = null;

	this.send = function(message) {
		if (message.__proto__ == Request) {
			if (_ws) {
				_ws.send(message.toJSON());
			}
		} else {
			logError("That's no request");
		}
	}

	this.start = function(uri, hubs, opt) {
		var deferred = _core.Deferred();


		var url = "";
		if (uri.schema == "https"||uri.schema == "wss")
			url = "wss://";
		else 
			url = "ws://";

		url += uri.path;

		if (uri.port) url += ":" + uri.port;
		if (uri.querystring) url += "?" + uri.querystring;
		if (hubs && hubs.length > 0)  {
			if (uri.querystring) url += "&";
			url += "__oringhubs=" + encodeURIComponent(hubs.join(','));
		}


		_ws = new WebSocket(url, "oringserver");
		_ws.onopen = function(e) {
			deferred.resolve({});
		}

		_ws.onclose = function(e) {
			logError("Connection closed",e);
			// Try a few times? Then let go and attempt again...
			if (typeof self.onclose == "function") {
				self.onclose();
			}
		}

		_ws.onerror = function(e) {
			if(deferred) {
				deferred.reject(e);
			}
		}

		_ws.onmessage = function(msg) {
			if (msg && msg.data) {
				self.onmessage(opt.parseMessage(msg.data));
			}
		}

		return deferred.promise();

	}

}


_clients.push( {name : "webSocket", class : WebSocketClient});