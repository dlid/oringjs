

function WebSocketClient() {

	var _ws;

	this.start = function(uri) {
		console.warn("start websocket", uri);

		var url = "";
		if (uri.schema == "https"||uri.schema == "wss")
			url = "wss://";
		else 
			url = "ws://";

		url += uri.path;

		if (uri.port) url += ":" + uri.port;
		if (uri.querystring) url += "?" + uri.querystring;

		_ws = new WebSocket(url, "oringserver");
		_ws.onopen = function(e) {
			console.warn("Connection opened",e);
		}
		_ws.onclose = function(e) {
			console.warn("Connection closed",e);
		}
		_ws.onerror = function(e) {
			console.warn("Connection error", e);
		}
		_ws.onmessage = function(msg) {
			console.warn("RECEIVED", msg.data)
		}

	}

}


_clients.push(WebSocketClient);