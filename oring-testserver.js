var server = require("./index.js").createServer();


var DJUR = {
	namn : "Okänt djur",
	setName : function(n) {
		this.namn = n;
	}
};




// A new user is connected
server.on('connected', function(eventArgs) {
	var resolve = this.resolve,
		reject = this.reject;
	// Add the connection to a group
//	this.Groups.Add(eventArgs.client.connectionId, "en grupp");

	console.log("A user connected", JSON.stringify(eventArgs));

	this.Connections.getAll().done(function(r) {
		resolve();
		console.log("CURRENT CONNECTION COUNT: " + r.length)
	})

//	this.Connection.SetProperty('something', 'yes');
//  this.Connection.close()
//  this.Connection.reconnect();
//	this.getConnectionsByProperty('something', 'yes');
//	this.ServerProperties.set('connectionCount', ) / get

//	this.send( null, 'connected', { users : 0 } );


//	this.resolve(); // Accept connection
	                // this.reject() // Deny connection

	// If we do not have the required parameters, deny the connection
	//eventArgs.cancel("because?");

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