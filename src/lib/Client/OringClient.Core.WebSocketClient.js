

function WebSocketClient(name) {

	var _ws,
			self = this;

	this.name = name;
	this.onclose = null;
	this.onmessage = null;
	this.stop = function() {
		if (_ws) {
			console.warn("CLOSE WEBSOCKET");
			_ws.close();
		}
	}
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
		var deferred = _core.Deferred(),
		qs = {};

		console.log("start",uri,hubs,opt);

		if (hubs && hubs.length > 0) {
			qs['__oringhubs'] = encodeURIComponent(hubs.join(','));
		}

		if (opt.connectionId) {
			qs['__reconnect'] = opt.connectionId;
		}

		url = createUrl(combineUrl(uri, {
			schema : "ws",
			querystring : qs
		}));


		_ws = new WebSocket(url, "oringserver");
		_ws.onopen = function(e) {
			if (typeof self.onopen == "function") {
				self.onopen();
			}
			deferred.resolve({});
		}

		_ws.onclose = function(e) {
			if (typeof self.onclose == "function") {
				self.onclose(e);
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