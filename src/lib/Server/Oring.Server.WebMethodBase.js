var WebMethodBase = {
	_name : null,
	_callback : null,
	_hasResponse : false,
	setName : function(val) {
		this._name = val;
	},
	hasResponse : function() {
		return this._hasResponse;
	}
};
module.exports = WebMethodBase;