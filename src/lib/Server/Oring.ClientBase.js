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
	getConnectionId : function(){
		return this.connectionId;
	}
};
module.exports = ClientBase;