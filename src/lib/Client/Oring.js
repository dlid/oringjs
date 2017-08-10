function Oring() { 
	
	// Setup the public method(s)
	this.create = function() {
		console.warn("CRAETE", argumentsToArray(arguments));
		return publicCreateConnectionFn.apply(this, argumentsToArray(arguments));
	};

	this._core = _core;

}
