var server = require("./index.js").createServer();


// A new user is connected
server.on('connected', function(eventArgs) {

	// Add the connection to a group
//	this.Groups.Add(eventArgs.client.connectionId, "en grupp");

console.log("PARAMS", JSON.stringify(eventArgs));

	// If we do not have the required parameters, deny the connection
	//eventArgs.cancel("because?");

});

server.setShared('setUserContext', server.requestResponse(function() {

}));

server.setShared('broadcast', server.requestResponse(function(message) {
	var resolve = this.resolve,
		reject = this.reject;
	
	console.warn("BROADCAST MESSAGE! ", message, " processing...");

	this.send(null, "onChatMessage", {message : message, user : "Unknown"});

	setTimeout(function() {
		resolve("Your message was sent to 500 people");
	}, 13000);

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