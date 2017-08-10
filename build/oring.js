;  /*! OringJS v0.0.1 © 2017 undefined.  License: MIT */
  (new function(win) { 
  function Oring() { 
  	
  	// Setup the public method(s)
  	this.create = function() {
  		return publicCreateConnectionFn.apply(this, argumentsToArray(arguments));
  	};

  	this._core = _core;
  	console.warn("CORE", _core);
  }

  var _core = this,
  		_clients = [];

  function argumentsToArray(arg) {
  	return Array.prototype.slice.call(arg);
  }

  function getKeys(o) {
  	var keys = [];
  	for(var key in o) {
  		if (Object.prototype.hasOwnProperty.call(o,key)) {
  			keys.push(key);
  		}
  	}
  	return keys;
  }


  var _invocationIds = -1;

  /**
   * Creates an invocation identifier that is used to identify a response for a request
   *
   * @return     {string}  A unique string
   */
  function createInvocationId() {
  	_invocationIds++;
  	return _invocationIds + "" + (new Date()).getTime();
  }
  (function(factory) {
    if(typeof exports === 'object') {
      factory(exports);
    } else {
      factory(this);
    }
  }).call(this, function(root) { 

    var slice   = Array.prototype.slice,
        each    = Array.prototype.forEach;

    var extend = function(obj) {
      if(typeof obj !== 'object') throw obj + ' is not an object' ;

      var sources = slice.call(arguments, 1); 

      each.call(sources, function(source) {
        if(source) {
          for(var prop in source) {
            if(typeof source[prop] === 'object' && obj[prop]) {
              extend.call(obj, obj[prop], source[prop]);
            } else {
              obj[prop] = source[prop];
            }
          } 
        }
      });

      return obj;
    }

    root.extend = extend;
  });

  (function(global) {
  	function isArray(arr) {
  		return Object.prototype.toString.call(arr) === '[object Array]';
  	}

  	function foreach(arr, handler) {
  		if (isArray(arr)) {
  			for (var i = 0; i < arr.length; i++) {
  				handler(arr[i]);
  			}
  		}
  		else
  			handler(arr);
  	}

  	function D(fn) {
  		var status = 'pending',
  			doneFuncs = [],
  			failFuncs = [],
  			progressFuncs = [],
  			resultArgs = null,

  		promise = {
  			done: function() {
  				for (var i = 0; i < arguments.length; i++) {
  					// skip any undefined or null arguments
  					if (!arguments[i]) {
  						continue;
  					}

  					if (isArray(arguments[i])) {
  						var arr = arguments[i];
  						for (var j = 0; j < arr.length; j++) {
  							// immediately call the function if the deferred has been resolved
  							if (status === 'resolved') {
  								arr[j].apply(this, resultArgs);
  							}

  							doneFuncs.push(arr[j]);
  						}
  					}
  					else {
  						// immediately call the function if the deferred has been resolved
  						if (status === 'resolved') {
  							arguments[i].apply(this, resultArgs);
  						}

  						doneFuncs.push(arguments[i]);
  					}
  				}
  				
  				return this;
  			},

  			fail: function() {
  				for (var i = 0; i < arguments.length; i++) {
  					// skip any undefined or null arguments
  					if (!arguments[i]) {
  						continue;
  					}

  					if (isArray(arguments[i])) {
  						var arr = arguments[i];
  						for (var j = 0; j < arr.length; j++) {
  							// immediately call the function if the deferred has been resolved
  							if (status === 'rejected') {
  								arr[j].apply(this, resultArgs);
  							}

  							failFuncs.push(arr[j]);
  						}
  					}
  					else {
  						// immediately call the function if the deferred has been resolved
  						if (status === 'rejected') {
  							arguments[i].apply(this, resultArgs);
  						}

  						failFuncs.push(arguments[i]);
  					}
  				}
  				
  				return this;
  			},

  			always: function() {
  				return this.done.apply(this, arguments).fail.apply(this, arguments);
  			},

  			progress: function() {
  				for (var i = 0; i < arguments.length; i++) {
  					// skip any undefined or null arguments
  					if (!arguments[i]) {
  						continue;
  					}

  					if (isArray(arguments[i])) {
  						var arr = arguments[i];
  						for (var j = 0; j < arr.length; j++) {
  							// immediately call the function if the deferred has been resolved
  							if (status === 'pending') {
  								progressFuncs.push(arr[j]);
  							}
  						}
  					}
  					else {
  						// immediately call the function if the deferred has been resolved
  						if (status === 'pending') {
  							progressFuncs.push(arguments[i]);
  						}
  					}
  				}
  				
  				return this;
  			},

  			then: function() {
  				// fail callbacks
  				if (arguments.length > 1 && arguments[1]) {
  					this.fail(arguments[1]);
  				}

  				// done callbacks
  				if (arguments.length > 0 && arguments[0]) {
  					this.done(arguments[0]);
  				}

  				// notify callbacks
  				if (arguments.length > 2 && arguments[2]) {
  					this.progress(arguments[2]);
  				}
  			},

  			promise: function(obj) {
  				if (obj == null) {
  					return promise;
  				} else {
  					for (var i in promise) {
  						obj[i] = promise[i];
  					}
  					return obj;
  				}
  			},

  			state: function() {
  				return status;
  			},

  			debug: function() {
  				console.log('[debug]', doneFuncs, failFuncs, status);
  			},

  			isRejected: function() {
  				return status === 'rejected';
  			},

  			isResolved: function() {
  				return status === 'resolved';
  			},

  			pipe: function(done, fail, progress) {
  				return D(function(def) {
  					foreach(done, function(func) {
  						// filter function
  						if (typeof func === 'function') {
  							deferred.done(function() {
  								var returnval = func.apply(this, arguments);
  								// if a new deferred/promise is returned, its state is passed to the current deferred/promise
  								if (returnval && typeof returnval === 'function') {
  									returnval.promise().then(def.resolve, def.reject, def.notify);
  								}
  								else {	// if new return val is passed, it is passed to the piped done
  									def.resolve(returnval);
  								}
  							});
  						}
  						else {
  							deferred.done(def.resolve);
  						}
  					});

  					foreach(fail, function(func) {
  						if (typeof func === 'function') {
  							deferred.fail(function() {
  								var returnval = func.apply(this, arguments);
  								
  								if (returnval && typeof returnval === 'function') {
  									returnval.promise().then(def.resolve, def.reject, def.notify);
  								} else {
  									def.reject(returnval);
  								}
  							});
  						}
  						else {
  							deferred.fail(def.reject);
  						}
  					});
  				}).promise();
  			}
  		},

  		deferred = {
  			resolveWith: function(context) {
  				if (status === 'pending') {
  					status = 'resolved';
  					var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
  					for (var i = 0; i < doneFuncs.length; i++) {
  						doneFuncs[i].apply(context, args);
  					}
  				}
  				return this;
  			},

  			rejectWith: function(context) {
  				if (status === 'pending') {
  					status = 'rejected';
  					var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
  					for (var i = 0; i < failFuncs.length; i++) {
  						failFuncs[i].apply(context, args);
  					}
  				}
  				return this;
  			},

  			notifyWith: function(context) {
  				if (status === 'pending') {
  					var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
  					for (var i = 0; i < progressFuncs.length; i++) {
  						progressFuncs[i].apply(context, args);
  					}
  				}
  				return this;
  			},

  			resolve: function() {
  				return this.resolveWith(this, arguments);
  			},

  			reject: function() {
  				return this.rejectWith(this, arguments);
  			},

  			notify: function() {
  				return this.notifyWith(this, arguments);
  			}
  		}

  		var obj = promise.promise(deferred);

  		if (fn) {
  			fn.apply(obj, [obj]);
  		}

  		return obj;
  	}

  	D.when = function() {
  		if (arguments.length < 2) {
  			var obj = arguments.length ? arguments[0] : undefined;
  			if (obj && (typeof obj.isResolved === 'function' && typeof obj.isRejected === 'function')) {
  				return obj.promise();			
  			}
  			else {
  				return D().resolve(obj).promise();
  			}
  		}
  		else {
  			return (function(args){
  				var df = D(),
  					size = args.length,
  					done = 0,
  					rp = new Array(size);	// resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

  				for (var i = 0; i < args.length; i++) {
  					(function(j) {
                          var obj = null;
                          
                          if (args[j].done) {
                              args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                              .fail(function() { df.reject(arguments); });
                          } else {
                              obj = args[j];
                              args[j] = new Deferred();
                              
                              args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                              .fail(function() { df.reject(arguments); }).resolve(obj);
                          }
  					})(i);
  				}

  				return df.promise();
  			})(arguments);
  		}
  	}

  	global.Deferred = D;
  })(_core);

  /**
   * Make an ajax request
   *
   * @param      {object}    options  The options
   * @param      {function}  success  The success callback
   * @param      {function}  error    The error callback
   */
  var ajax = function(options, success, error) {

  	var settings = _core.extend({
  		method : 'get',
  		url : null
  	}, options),
  	http = createXMLHttp();
    http.open('get', settings.url, true);
    http.send(null);
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        if (http.status === 200) {
          success.call(null, http.responseText);
        } else {
          error.call(null, http.responseText);
        }
      }
    };
  },
  	/**
  	 * Creates a xml http request
  	 *
  	 * @return     {(ActiveXObject|XMLHttpRequest)}  { description_of_the_return_value }
  	 */
  	createXMLHttp = function () {
  	  if (typeof XMLHttpRequest !== undefined) {
  	    return new XMLHttpRequest;
  	  } else if (window.ActiveXObject) {
  	    var ieXMLHttpVersions = ['MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'],
  	        xmlHttp;
  	    for (var i = 0; i < ieXMLHttpVersions.length; i++) {
  	      try {
  	        xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
  	        return xmlHttp;
  	      } catch (e) {}
  	    }
  	  }
  	}


  function LongPollingClient() {

  	var _ws,
  			self = this;

  	this.onclose = null;
  	this.onmessage = null;

  	this.send = function(message) {
  		if (message.__proto__ == Request) {
  			if (_ws) {
  				console.warn("SEND", message);
  				_ws.send(message.toJSON());
  			}
  		} else {
  			logError("That's no request");
  		}
  	}

  	this.start = function(uri, hubs) {
  		var deferred = _core.Deferred();


  		var url = "";
  		if (uri.schema == "https"|| uri.schema == "wss")
  			url = "https://";
  		else 
  			url = "http://";

  		url += uri.path;

  		if (uri.port) url += ":" + uri.port;
  		if (uri.querystring) url += "?" + uri.querystring;

  		if (uri.querystring) url += "&"; else url +="?";
  		url += "__oringprotocol=longPolling";
  		if (hubs && hubs.length > 0)  {
  			if (uri.querystring) url += "&";
  			url += "__oringhubs=" + encodeURIComponent(hubs.join(','));
  		}

  		console.warn("longPolling", url)
  		ajax({
  			url : url
  		}, function() {}, function() {
  			
  		})

  		setTimeout(function() {
  			deferred.reject();
  		}, 1500);

  		return deferred.promise();

  	}

  }


  _clients.push({name : "longPolling", class : LongPollingClient});

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

  	try { o = JSON.parse(msg) } catch(e) { o = null;}
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
  /**
   * These are the public methods available inside the "Core" part of the script
   */

  var logPrefix = "[oring] ",
  	  logError = function() {
  	if (console && console.error) {
  		var params = argumentsToArray(arguments);
  		params.unshift(logPrefix)
  		console.error.apply(console, params);
  	}
  }
  /**
   * These are the public methods available inside the "Core" part of the script
   */

  /**
   * Used to open a connection to a oring server
   */
  var publicCreateConnectionFn = function(urlString, options) {

  	var settings = _core.extend({
  		url : urlString,
  		hubs : []
  	}, options);

  	console.warn("options", settings);

  	var connection = new OringClient(settings);

  	return connection;
  }


  function WebSocketClient() {

  	var _ws,
  			self = this;

  	this.onclose = null;
  	this.onmessage = null;

  	this.send = function(message) {
  		if (message.__proto__ == Request) {
  			if (_ws) {
  				console.warn("SEND", message);
  				_ws.send(message.toJSON());
  			}
  		} else {
  			logError("That's no request");
  		}
  	}

  	this.start = function(uri, hubs) {
  		var deferred = _core.Deferred();


  		var url = "";
  		if (uri.schema == "https"||uri.schema == "wss")
  			url = "wss://";
  		else 
  			url = "ws://";

  		url += uri.path;

  		if (uri.port) url += ":" + uri.port;
  		if (uri.querystring) url += "?" + uri.querystring;
  		if (hubs && hubs.length > 0)  {
  			if (uri.querystring) url += "&";
  			url += "__oringhubs=" + encodeURIComponent(hubs.join(','));
  		}


  		_ws = new WebSocket(url, "oringserver");
  		_ws.onopen = function(e) {
  			deferred.resolve();
  		}

  		_ws.onclose = function(e) {
  			logError("Connection closed",e);
  			// Try a few times? Then let go and attempt again...
  			if (typeof self.onclose == "function") {
  				self.onclose();
  			}
  		}

  		_ws.onerror = function(e) {
  			if(deferred) {
  				deferred.reject(e);
  			}
  		}

  		_ws.onmessage = function(msg) {
  			if (msg && msg.data) {
  				self.onmessage(msg.data);
  			}
  		}

  		return deferred.promise();

  	}

  }


  _clients.push( {name : "webSocket", class : WebSocketClient});

  function OringClient(options) {

  	var defaultClients = ['webSocket', 'longPolling'];

  	var settings = _core.extend({
  		url : null,
  		hubs : [],
  		transferProtocols : defaultClients
  	}, options);

  	if (options.transferProtocols)
  		settings.transferProtocols = options.transferProtocols;

  	console.warn("SETTINGS", settings);

  	function parseUrl(url) {
  		var i = url.indexOf('?'),
  				querystring = null;
  		if (i!=-1) {
  			querystring = url.substring(i+1);
  			url = url.substring(0, i);
  		}

  		var m = url.match(/((?:http|ws|)s?:\/\/|^)([^:]+?)(?::(\d+)|$)/);
  		if (m) {
  			var schema = m[1],
  					path = m[2],
  					port = m[3] ? m[3] : null;



  			return {
  				schema : schema ? schema.replace(/:\/\/$/, '') : "http",
  				path : path,
  				port : port,
  				querystring : querystring
  			};
  		}
  	}


  	var _uri = parseUrl(options.url);

  	function handleHandshake(handshakeMessage, methodInvocationCallback) {

  		if (handshakeMessage.__proto__ == ServerMessage) {
  			var methods = handshakeMessage.getData().methods,
  				i,
  				context = {},
  				methodName;

  			for (i = 0; i < methods.length; i++) {
  				var name = methods[i].n;
  				if (name.indexOf('.') == -1) {
  					var methodName = methods[i].n,
  							hasResponse = methods[i].r;
  					context[methods[i].n] = function() {
  						var _i = null;
  						if (hasResponse) {_i = createInvocationId();}
  						return methodInvocationCallback('*', methodName,  _i, argumentsToArray(arguments));
  					}
  				}
  			}
  			console.warn("context", context);

  			return context;

  		}

  		return null;

  	}


  	this.start = function() {
  			var deferred = _core.Deferred();

  			var c = null,
  					ix = -1,
  					handshakeComplete = false,
  					_preferredClients  = [],
  					_protocolNotFound = false;

  			for (ix = 0; ix < settings.transferProtocols.length; ix++) {
  				_protocolNotFound = true;
  				for (c = 0; c < _clients.length; c++) {
  					if (settings.transferProtocols[ix] == _clients[c].name) {
  						_preferredClients.push(_clients[c]);
  						_protocolNotFound = false;
  						break;
  					}
   				}
   				if (_protocolNotFound) {
   					logError("Unknown transferProtcol", settings.transferProtocols[ix]);
   				}
  			}
  			ix = -1; c = null;

  			function tryNext() {
  				ix+=1;
  				if (ix < _preferredClients.length) {

  					c = new _preferredClients[ix].class();
  					c.onclose = function() {
  						console.warn("Connection was lost");
  					};
  					
  					c.start(_uri, settings.hubs)
  						.done(function() {
  							
  							c.onmessage = function(message) {
  								var m = parseMessage(message);
  								console.warn("MSG", m);
  								if (!handshakeComplete) {
  									if (m.getType() == "oring:handshake") {
  										handshakeComplete = true;
  										var h = handleHandshake(m, function(hub, methodName, invocationId, arguments) {
  											var invokeDeferred = _core.Deferred();

  											var msg = createMessage("oring:invoke", {hub : hub, name : methodName, args : arguments}, invocationId);

  											if (invocationId) {
  												console.warn("WOA! Listen for", "oring:response__" + invocationId);
  												setTimeout(function() {
  													invokeDeferred.resolve();
  												}, 2000);
  											}

  											c.send(msg);

  											if (!invocationId) {
  												invokeDeferred.resolve();
  											}

  											return invokeDeferred.promise();
  										});
  										if (h) {
  											h.transferProtocol = _preferredClients[ix].name;
  											deferred.resolve(h);
  										}
  										console.warn("handskahe complete");
  									} else {
  										console.warn("Message received without handshake...", m);
  									}
  								} else {
  									console.warn("Ok, we're cool. Message is ", m);
  								}
  							};

  							console.warn("Alright, " + _preferredClients[ix].name + " succeeded");


  						})
  						.fail(function() {
  							console.warn("Noo, " + _preferredClients[ix].name + " failed");
  							tryNext();
  						});

  				} else {
  					logError("No protocol could connect ("+settings.transferProtocols.join(',')+")");
  					deferred.reject();
  				}
  			}

  			tryNext();

  			return deferred.promise();
  	}



  	if (!options.url) {
  		logError("URL was not provided"); 
  	}


  }
  win.oring = new Oring(_core);  
  }(window));
