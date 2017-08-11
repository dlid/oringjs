"use strict";

var OringServer = require("./src/lib/Server/Oring.Server.js");
var WebsocketProtocol = require("./src/lib/Server/Oring.Server.Websocket.js");
var LongPollingProtocol = require("./src/lib/Server/Oring.Server.LongPolling.js");

module.exports = {
    createServer: function (options) {
        var newServer = new OringServer([WebsocketProtocol, LongPollingProtocol], options);
        return newServer;
    }
};