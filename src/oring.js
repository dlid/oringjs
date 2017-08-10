var oringClient = oring.connection("https://localhost:1234", ["scrapbook"]);

oringClient.open(function(client) {

	// Subscribe to events that are sent from the server
	client.scrapbook.on('bookRefreshed', function(u, name, args) {

	});


	// Invoke a server method
	client.scrapbook.refreshBook();

});

