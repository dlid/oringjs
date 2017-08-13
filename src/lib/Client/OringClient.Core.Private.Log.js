/**
 * These are the public methods available inside the "Core" part of the script
 */

var logPrefix = "[oring] ",
    logError = function() {
    	if (console && console.error) {
    		var params = argumentsToArray(arguments);
    		params.unshift(logPrefix)
    		console.error.apply(console, params);
    	}
    },
    logInfo = function() {
        if (console && console.log) {
            var params = argumentsToArray(arguments);
            params.unshift(logPrefix)
            console.log.apply(console, params);
        }
    }