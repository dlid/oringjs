var WebMethodBase = {
	_name : null,
	_callback : null,
	_hasResponse : false,
	_isLongRunning : false,
	setName : function(val) {
		this._name = val;
	},
	hasResponse : function() {
		return this._hasResponse;
	},
	isLongRunning : function() {
		return this._isLongRunning;
	},
	invoke : function(context, arguments) {
		if (typeof this._callback == "function") {
			return this._callback.apply(context, arguments);
		}
	}
};
module.exports = WebMethodBase;