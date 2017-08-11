
/**
 * A message received from the server
 */
var ServerMessage = {
	data : null,
	sent : null,
	invocationId : null,
	type : null,
	getType : function() {
		return this.type;
	},
	getData : function() {
		return this.data;
	}
};

/**
 * A message sent to the server
 */
var Request = {
	data : null,
	created : null,
	invocationId : null,
	type : null,
	getType : function() {
		return this.type;
	},
	getData : function() {
		return this.data;
	},
	getInvocationID : function() {
		return this._i;
	},
	toJSON : function() {
		return JSON.stringify({
			_t : this.type,
			_d : this.data,
			_c : this.created,
			_i : this.invocationId
		});
	}
};


/**
 * Parse the raw JSON data string from the server into a ServerMessage
 *
 * @param      string  msg     The message
 * @return     <ServerMessage>  The ServerMessage object
 */
function parseMessage(msg) {
	var o;

	if (typeof msg === "string") {
		try { o = JSON.parse(msg) } catch(e) { o = null;}
	} else if (typeof msg === "object") {
		o = msg;
	}
	if (typeof o === "object") {
		if (typeof o._d !== "undefined" && typeof o._t !== "undefined" && typeof o._w !== "undefined") {
			var m = Object.create(ServerMessage, {
				data : {
					value : o._d,
					enumerable : false
				},
				type : {
					value : o._t
				},
				invocationId : {
					value : o._i ? o._i : null
				}
			});
		}
		return m;
	}
}

/**
 * Creates a message to send to the server
 *
 * @param      {<type>}  name          The message name/type
 * @param      {<type>}  data          The data to send
 * @param      {<type>}  invocationId  The invocation identifier to correlate a request/response
 * @return     {<Request>}  { description_of_the_return_value }
 */
function createMessage(name, data, invocationId) {
	var msg = Object.create(Request, {
		type : {
			value : name
		},
		data : {
			value : data
		},
		created : {
			value : (new Date()).getTime()
		},
		invocationId : {
			value : invocationId || null
		}
	})
	return msg;
}