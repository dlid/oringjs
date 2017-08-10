
function OringClient(options) {

	function parseUrl(url) {
		var i = url.indexOf('?'),
				querystring = null;
		if (i!=-1) {
			querystring = url.substring(i+1);
			url = url.substring(0, i);
		}

		var m = url.match(/((?:http|ws|)s?:\/\/|^)([^:]+?)(?::(\d+)|$)/);
		if (m) {
			var schema = m[1],
					path = m[2],
					port = m[3] ? m[3] : null;



			return {
				schema : schema ? schema.replace(/:\/\/$/, '') : "http",
				path : path,
				port : port,
				querystring : querystring
			};
		}
	}


	var _uri = parseUrl(options.url);


	this.start = function() {
			console.warn("Start connection");

			var c = null;

			for (var i=0; i < _clients.length; i++){
				c = new _clients[i]();
				c.start(_uri);
			}



	}



	if (!options.url) {
		logError("URL was not provided"); 
	}


}