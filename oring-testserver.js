var server = require("./src/index.js").createServer({
});


// A new user is connected
server.on('connected', function(eventArgs) {

	// Add the connection to a group
//	this.Groups.Add(eventArgs.client.connectionId, "en grupp");

console.log("PARAMS", JSON.stringify(eventArgs));

	// If we do not have the required parameters, deny the connection
	//eventArgs.cancel("because?");

});

server.setShared('setUserContext', function() {

});

server.createHub("scrapboard", {
	refreshBook : function() {


		//return this.promise(); // meaning that a response will be sent back!
	},
	getOnlineUsers : function() {
		// mysql get online users...


		return this.promise();
	}
});


/*server.set('spelaihopnotes', 'test', function() {

})*/

server.start();