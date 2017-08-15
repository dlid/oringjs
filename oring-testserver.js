var server = require("./index.js").createServer({
	port : 1234
});


// A new user is connected
server.on('connected', function(eventArgs) {
	var resolve = this.resolve,
		reject = this.reject,
		send = this.send;

	console.log("A user connected", JSON.stringify(eventArgs));
	this.Connections.getAll().done(function(r) {
		resolve();
		send(null, "connectionCount", r.length);
	});

});

server.setShared('setUserContext', server.requestResponse(function() {

}));

/**
 * Long running operation
 * For time consuming operations, define them as long running - requestResponse(<callback>, true)
 * - for websockets this does not matter much
 * - for SSE and LongPolling the POST message will immediatly return a response instead of waiting for the result
 *   The result will then instead be sent via the polling/sse events
 */
server.setShared('broadcast', server.requestResponse(function(message) {
	var resolve = this.resolve,
		reject = this.reject;
	

	// send a chat message to everyone
	this.send(null, "onChatMessage", {message : message, user : "Unknown"});

	setTimeout(function() {
		// After 15 seconds, return the result of this method
		resolve("Your message was sent to 500 people");
	}, 15000);

}, true));

server.createHub("scrapboard", {
	'refreshBook' : server.requestResponse(function() {

		this.Deferred();


		//return this.promise(); // meaning that a response will be sent back!
	}),
	'getOnlineUsers' : function() {
		// mysql get online users...


		return this.promise();
	}
});


/*server.set('spelaihopnotes', 'test', function() {

})*/

server.start();