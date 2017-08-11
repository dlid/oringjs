var OutgoingMessageBase = {
    _t : null,
    _d : null,
    _i : null,
    _w : null,
	getType : function() {
		return this._t;
	},
    getInvocationID : function() {
        return this._i;
    },
    expectingResponse : function() {
        return this._i ? true : false;
    },
    toJSON : function() {
        return JSON.stringify({
            _t : this._t,
            _d : this._d,
            _i : this._i,
            _w : this._w
        });
    }
};

OutgoingMessageBase.__proto__.create = function(messageType, messageData, invocationId) {
    return Object.create(OutgoingMessageBase, {
        _t : {
            value : messageType
        },
        _d : {
            value : messageData
        },
        _i : {
            value : invocationId ? invocationId : null
        },
        _w : {
            value : new Date()
        }
    });

};

module.exports = OutgoingMessageBase;