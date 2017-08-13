var _core = this,
		_clients = [];

function argumentsToArray(arg) {
	return Array.prototype.slice.call(arg);
}

function getKeys(o) {
	var keys = [];
	for(var key in o) {
		if (Object.prototype.hasOwnProperty.call(o,key)) {
			keys.push(key);
		}
	}
	return keys;
}


var _invocationIds = -1;

/**
 * Creates an invocation identifier that is used to identify a response for a request
 *
 * @return     {string}  A unique string
 */
function createInvocationId() {
	_invocationIds++;
	return _invocationIds + "" + (new Date()).getTime();
}


function parseUrl(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return {
        schema : parser.protocol,
        host : parser.hostname,
        port : parser.port,
        path : parser.pathname,
        querystring : parseQuerystring(parser.search)
    };
}

function logInfo() {
    
}

function combineUrl(uri1, uri2) {
    var uri = _core.extend({}, uri1, uri2);
    if (uri1.schema && uri2.schema) {
        if (isSecureProtocol(uri1.schema)) {
            uri.schema = toSecureProtocol(uri.schema);
        } else {
            uri.schema = toUnsecureProtocol(uri.schema);
        }
    }

    return uri;
}


function createUrl(uri) {
    var url = "";
    if (uri.schema)
        url = uri.schema + "://";
    if (uri.host)
        url += uri.host;
    if (uri.port)
        url += ":" + uri.port;
    if (uri.path)
        url += uri.path;
    if (uri.querystring) {
        var keys = getKeys(uri.querystring),
            qs = [];

        for (var i=0; i < keys.length; i+=1) {
            qs.push(encodeURIComponent(keys[i]) + "=" + encodeURIComponent(uri.querystring[keys[i]]));
        }

        if (qs.length > 0 ) url += "?" + qs.join('&');
    }

    return url;


}

function isSecureProtocol(str) {
    return str == "https" || str == "wss";
}

function toSecureProtocol(str) {
    if (isSecureProtocol(str))
        return str;
    else 
        return str + "s";
}

function toUnsecureProtocol(str) {
    if (isSecureProtocol(str))
        return str.substr(0, str.length-1);
    else 
        return str;
}

function parseQuerystring(url) {
    var i,
    properties = {},
    search,
    d;

    if (url) {
        i = url.indexOf('?');
        if (i>-1) {
            search = url.substr(i+1).split('&');
        } else {
            search = url.split('&');
        }
        for( i=0; i < search.length; i+=1) {
            d = search[i].split('=');
            if (d.length == 2) {
                properties[d[0]] = decodeURIComponent(d[1]);
            }
        }
        
    } 
    return properties;
}

window.parseQuerystring = parseQuerystring;
window.parseUrl = parseUrl;
window.combineUrl = combineUrl;