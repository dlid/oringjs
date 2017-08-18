var extend  = require("extend");
var uuid = require('uuid');

var ConnectionBase = {
	connectionId : null,
	protocolName : null,
	properties : {},
	send : null,
	onUpdated : function() {},
	toJSON : function() {
		return { 
			"connectionId" : this.connectionId,
			"properties" : this.getProperties(),
			"protocolName" : this.protocolName
		};
	},
	setProperty : function(name, value) {
		this.properties[name] = value;
		if(this.onUpdated) this.onUpdated();
	},
	removeProperty : function(name) {
		if(this.properties[name]) {
			delete this.properties[name];
			if(this.onUpdated) this.onUpdated();
		}
	},
	getProperty : function(name, defaultValue) {
		if(typeof this.properties[name] !== "undefined") return this.properties[name];
		return defaultValue;
	},
	getProperties : function() {
		return extend({}, this.properties);
	},
	/**
	 * Determines if it has a property matching name and/or value.
	 *
	 * @param      {<type>}   nameOrRegex   The name or regular expression to match the name
	 * @param      {<type>}   valueOrRegex  The value or regular expression to match the value
	 * @return     {boolean}  True if has property, False otherwise.
	 */
	hasProperty : function(nameOrRegex, valueOrRegex) {
		var keys = Object.keys(this.properties),
			isMatch = false,
			value = null;
		if (nameOrRegex) {
			for (var i=0; i < keys.length; i+=1) {
				if (typeof nameOrRegex == "string" ) {
					if (keys[i] == nameOrRegex) {
						isMatch = true;
					}
				} else if (nameOrRegex.__proto__ == RegExp.prototype ) {
					if (nameOrRegex.isMatch(keys[i])) {
						isMatch = true;
					}
				}

				if (isMatch) {
					if (valueOrRegex) {
						value = this.properties[keys[i]];
						if (typeof value == "string") {
							if (typeof nameOrRegex == "string" ) {
								if (keys[i] == nameOrRegex) {
									return true;
								}
							} else if (nameOrRegex.__proto__ == RegExp.prototype ) {
								if (nameOrRegex.isMatch(keys[i])) {
									return true;
								}
							}
						} else if (valueOrRegex == value) {
							return truE;
						}
					} else {
						return true;
					}
				}
			}
		}
		return false;
	},
	getConnectionId : function(){
		return this.connectionId;
	},
	seen : function(newValue) {
		if (newValue) {
			if (newValue.__proto__ == Date.prototype)
				newValue = newValue.getTime();
			this.setProperty('__seen', newValue);
		} else  {
			return this.getProperty('__seen', null);
		}
	},

	create : function(protocolName, sendCallback) {
		var o = Object.create(ConnectionBase, {
			connectionId : {value : uuid.v4()},
			protocolName : {value : protocolName},
			created : {value : new Date()},
			send : {value : sendCallback },
			properties : {value : {}}
		});
		return o;
	}
};

ConnectionBase.__proto__._fromObject = function(o) {
	
	if (o.properties && o.connectionId && o.protocolName) {
		return Object.create(ConnectionBase, {
			properties: {value: o.properties},
			connectionId: {value: o.connectionId},
			protocolName: {value: o.protocolName}
		});
	} 
	return null;


}

module.exports = ConnectionBase;