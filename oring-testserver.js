var server = require("./index.js").createServer({
	port : 1234
});


// A new user is connected
server.on('connecting', function(eventArgs) {
	this.resolve();
});

server.on('connected', function(connectionId) {
	sendUpdatedUserlist(this);
});

server.on('disconnected', function(connectionId) {
	sendUpdatedUserlist(this);
});

server.setShared('setAlias', function(name) {
	var context = this;

	this.Connections.getById(this.getConnectionId()).done(function(c) {
		c.setProperty('alias', name);
		sendUpdatedUserlist(context);
	});

});

function sendUpdatedUserlist(context) {
	context.Connections.getAll().done(function(connections) {
		var users = []
		for (var i=0; i < connections.length; i++)
			users.push({id : connections[i].getConnectionId(), alias : connections[i].getProperty('alias', 'Unknown')});
		context.send(null, 'connections', { count : connections.length, users : users });
	});
}

server.setShared('broadcast', server.requestResponse(function(message) {
	var resolve = this.resolve,
		reject = this.reject,
		send = this.send;
	
	this.Connections.getById(this.getConnectionId())
		.done(function(c) {
			send(null, "onChatMessage", {message : message, user : c.getProperty('alias', 'Unknown')});
			resolve({message : message, user : c.getProperty('alias', 'Unknown')});
		});

}));

server.start();

/*
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


server.set('spelaihopnotes', 'test', function() {

})*/

