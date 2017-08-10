var OringServer = require("./lib/Oring.Server.js"),
		WebsocketProtocol = require('./lib/Oring.Server.Websocket.js');

module.exports = {
		createServer : function(options) {
			var newServer = new OringServer([WebsocketProtocol],options);
		return newServer;
		}
}