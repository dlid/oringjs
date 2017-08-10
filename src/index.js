var OringServer = require("./lib/Server/Oring.Server.js"),
		WebsocketProtocol = require('./lib/Server/Oring.Server.Websocket.js');

module.exports = {
		createServer : function(options) {
			var newServer = new OringServer([WebsocketProtocol],options);
		return newServer;
		}
}