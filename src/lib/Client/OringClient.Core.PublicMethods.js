/**
 * These are the public methods available inside the "Core" part of the script
 */

/**
 * Used to open a connection to a oring server
 */
var publicCreateConnectionFn = function(urlString, options) {

	var settings = _core.extend({
		url : urlString,
		hubs : []
	}, options);

	console.warn("options", settings);

	var connection = new OringClient(settings);

	return connection;
}