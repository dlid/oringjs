/**
 * These are the public methods available inside the "Core" part of the script
 */

/**
 * Used to open a connection to a oring server
 */
var publicCreateConnectionFn = function(urlString, hubArray) {
	hubArray = hubArray || [];

	var options = {
		url : urlString,
		hubs : hubArray
	};

	console.warn("options", options);

	var connection = new OringClient(options);

	return connection;
}