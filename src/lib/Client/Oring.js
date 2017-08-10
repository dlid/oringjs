function Oring() { 
	
	// Setup the public method(s)
	this.create = function() {
		return publicCreateConnectionFn.apply(this, argumentsToArray(arguments));
	};

	this._core = _core;
	console.warn("CORE", _core);
}
