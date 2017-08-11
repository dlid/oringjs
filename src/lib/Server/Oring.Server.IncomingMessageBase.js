var IncomingMessageBase = {
    _t : null,
    _d : null,
    _c : null,
    _i : null,
    _w : null,
    getData : function() {
        return this._d;
    },
	getType : function() {
		return this._t;
	},
    getInvocationID : function() {
        return this._i;
    },
    expectingResponse : function() {
        return this._i ? true : false;
    }
};

IncomingMessageBase.__proto__.parse = function(jsonMessage) {
    console.warn("PARSE", jsonMessage);
    var o = null;
    try { o = JSON.parse(jsonMessage); } catch(e) {}
    if (o && o._t && o._d && o._c) {
        return Object.create(IncomingMessageBase, {
            _t : {
                value : o._t,
                enumerable : true
            },
            _d : {
                value : o._d,
                enumerable : true
            },
            _i : {
                value : o._i ? o._i : null,
                enumerable : true
            }
        });
    }

};

module.exports = IncomingMessageBase;