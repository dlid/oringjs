var extend  = require("extend");

var ClientBase = {
	connectionId : null,
	protocolName : null,
	properties : {},
	send : null,
	setProperty : function(name, value) {
		this.properties[name] = value;
	},
	getProperty : function(name, defaultValue) {
		if(typeof this.properties[name] !== "undefined") return this.properties[name];
		return defaultValue;
	},
	getProperties : function() {
		return extend({}, this.properties);
	},
	getConnectionId : function(){
		return this.connectionId;
	},
	seen : function(newValue) {

		if (newValue) {
			console.warn("set seen", this.getConnectionId(), newValue);
			this.setProperty('__seen', newValue);
		}
		else  {
			console.warn("get seen", this.getConnectionId(), this.getProperty('__seen', null));
			return this.getProperty('__seen', null);
		}
	}
};
module.exports = ClientBase;