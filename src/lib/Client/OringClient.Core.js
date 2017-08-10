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