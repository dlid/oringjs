var ServerProtocolBase = {
	setOringServerInstance : function(instance) {
		this.oringServer = instance;
		this._log = this.oringServer.createLogger(this.name);
	},
	getName : function() {
		return this.name;
	},
	getDefaultOptions : function() {
		return this.defaultOptions;
	},
	start : function() {
		throw  "Override start in your protocol implementation";
	},
	send : function() {
		throw  "Override send in your protocol implementation";
	},
	name : "no",
	defaultOptions : {},
	oringServer : null
};
module.exports = ServerProtocolBase;