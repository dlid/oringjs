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


  function parseUrl(url) {
      var parser = document.createElement('a');
      parser.href = url;
      return {
          schema : parser.protocol,
          host : parser.hostname,
          port : parser.port,
          path : parser.pathname,
          querystring : parseQuerystring(parser.search)
      };
  }

  function logInfo() {
      
  }

  function combineUrl(uri1, uri2) {
      var uri = _core.extend({}, uri1, uri2);
      if (uri1.schema && uri2.schema) {
          if (isSecureProtocol(uri1.schema)) {
              uri.schema = toSecureProtocol(uri.schema);
          } else {
              uri.schema = toUnsecureProtocol(uri.schema);
          }
      }

      return uri;
  }


  function createUrl(uri) {
      var url = "";
      if (uri.schema)
          url = uri.schema + "://";
      if (uri.host)
          url += uri.host;
      if (uri.port)
          url += ":" + uri.port;
      if (uri.path)
          url += uri.path;
      if (uri.querystring) {
          var keys = getKeys(uri.querystring),
              qs = [];

          for (var i=0; i < keys.length; i+=1) {
              qs.push(encodeURIComponent(keys[i]) + "=" + encodeURIComponent(uri.querystring[keys[i]]));
          }

          if (qs.length > 0 ) url += "?" + qs.join('&');
      }

      return url;


  }

  function isSecureProtocol(str) {
      return str == "https" || str == "wss";
  }

  function toSecureProtocol(str) {
      if (isSecureProtocol(str))
          return str;
      else 
          return str + "s";
  }

  function toUnsecureProtocol(str) {
      if (isSecureProtocol(str))
          return str.substr(0, str.length-1);
      else 
          return str;
  }

  function parseQuerystring(url) {
      var i,
      properties = {},
      search,
      d;

      if (url) {
          i = url.indexOf('?');
          if (i>-1) {
              search = url.substr(i+1).split('&');
          } else {
              search = url.split('&');
          }
          for( i=0; i < search.length; i+=1) {
              d = search[i].split('=');
              if (d.length == 2) {
                  properties[d[0]] = decodeURIComponent(d[1]);
              }
          }
          
      } 
      return properties;
  }

  window.parseQuerystring = parseQuerystring;
  window.parseUrl = parseUrl;
  window.combineUrl = combineUrl;
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
          method : "get",
          url : null,
          headers : {},
          data : null
      }, options),
    	http = createXMLHttp();

      http.open(settings.method, settings.url, true);
      var dataToSend = null,
          headerKeys = getKeys(settings.headers);

      for (i = 0; i < headerKeys.length; i+=1) {
        http.setRequestHeader(headerKeys[i], settings.headers[headerKeys[i]]);
      }

      if (settings.method.toLowerCase() == "post" ) {
        dataToSend = settings.data;
      }

      http.send(dataToSend);
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
      var ieXMLHttpVersions = ["MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp", "Microsoft.XMLHttp"],
          xmlHttp;
      for (var i = 0; i < ieXMLHttpVersions.length; i++) {
        try {
          xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
          return xmlHttp;
        } catch (e) {}
      }
    }
  }


  function LongPollingClient(name) {

  	var _ws,
  		self = this,
  		_connectionId,
  		_sendUrl,
  		_opt,
  		_pollTimer = null

  	this.name = name;
  	this.onclose = null;
  	this.onmessage = null;
  	this.stop = function() {
  		if(_pollTimer) {
  			console.warn("Stopping poll timer");
  			clearTimeout(_pollTimer);
  		}
  	};

  	this.send = function(message) {
  		if (message.__proto__ == Request) {
  			if (_connectionId) {
  				console.warn("queue message for polling", _connectionId, message);
  				//_ws.send(message.toJSON());
  				ajax({
  					method : 'post',
  					url : _sendUrl,
  					headers : {
  						"X-Oring-Request" : _connectionId,
  						"Content-Type" : "application/json"
  					},
  					data : message.toJSON()
  				}, 
  				function(responseBody) {
  					var msg = _opt.parseMessage(responseBody);
  					if (msg) {
  						self.onmessage(msg);
  					}
  				},
  				function(r) {
  					console.warn("FAILED",r);
  				});
  			}
  		} else {
  			logError("That's no request");
  		}
  	} 

  	this.start = function(uri, hubs, opt) {
  		_opt = opt;
  		var deferred = _core.Deferred(),
  			qs = { '__oringprotocol' : 'longPolling' };

  		_sendUrl = createUrl(combineUrl(uri, {
  			schema : "http",
  			querystring : qs
  		}));

  		if (hubs && hubs.length > 0) {
  			qs['__oringhubs'] = encodeURIComponent(hubs.join(','));
  		}

  		url = createUrl(combineUrl(uri, {
  			schema : "http",
  			querystring : qs
  		}));


  	
  		ajax({
  			url : url
  		}, function(r) {
  			// We pass the message immediatly since the onmessage is not hooked up until the connection is created
  			
  			// We need the connection id
  			var message = _opt.parseMessage(r),
  				failedPollAttempts = 0;
  			if (message) {
  				if (message.data.id) {
  					_connectionId = message.data.id;
  					

  					function pollTick() {
  						ajax({
  							url : _sendUrl + "&ping",
  							headers : {
  								"X-Oring-Request" : _connectionId,
  								"Content-Type" : "application/json"
  							}
  						}, function(r) {
  							var o;
  							try {o = JSON.parse(r);} catch(e) {}
  							if (typeof o == "object" && o.length > 0) {
  								for (var i=0; i < o.length; i+=1) {
  									var m = _opt.parseMessage(o[i]);
  									if(m) {
  										failedPollAttempts = 0;
  										self.onmessage(m);
  									}
  								}
  								_pollTimer = setTimeout(pollTick, 10000);
  							}

  							// We received something strange. A fail this is!
  							if (failedPollAttempts >= 3) {
  								if (typeof self.onclose == "function") {
  									if (typeof self.onopen == "function") {
  										logInfo("longPolling unexpected response (attempt "+failedPollAttempts+")");
  										self.onopen();
  									}
  								}
  							} else {
  								failedPollAttempts+=1;
  							}

  						}, function(r) {
  							if (failedPollAttempts >= 3) {
  								if (typeof self.onclose == "function") {
  									self.onclose(r);
  								}
  							} else {
  								logInfo("longPolling failed (attempt "+failedPollAttempts+")");
  								failedPollAttempts+=1;
  							}
  						});
  					}

  					_pollTimer = setTimeout(pollTick, 10000);

  					deferred.resolve({
  						message : message
  					});

  				}
  			} else {
  				deferred.reject("Invalid message");
  			}
  		}, function() {
  			deferred.reject();
  		})


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
  /**
   * A message received from the server
   */
   var OringConnection = {
     
     // Client object (websocket / long polling etc)
     c : null, 

     // The id of the established connection
     id : null,

     // Requests that are waiting for response
     _pr : {},

     handshakeComplete : false,

     await : function(name, object) {
      this._pr[name] = object;
     },

     onmessage : function(msg) {
      if (this.c)
          this.c.onmessage(msg);
     },

     // Initialize
     start : function(currentClient, handshakeCompleteCallback) {
      var self = this,
          pendingRequests = this._pr;
      
      this.c = currentClient;

          currentClient.onclose = function() {
              console.error(currentClient.name, "closed");
          }

          currentClient.onopen = function() {
              console.error(currentClient.name, "opened");
          }

          currentClient.onmessage = function(m) {

              if (!this.handshakeComplete) {
                  if (m.getType() == "oring:handshake") {
                      

                      var connectionContext = Object.create(ConnectionContext);

                      if (connectionContext.setupContext(m, self)) {
                          this.handshakeComplete = true;
                          connectionContext.oring = {
                              transferProtocol : currentClient.name
                          };
                          console.warn("CONTEXT IS SETUP", connectionContext);
                          handshakeCompleteCallback(connectionContext);
                      }

                  
                  } else {
                      console.warn("Message received without handshake...", m);
                  }
              } else {

                   if (m.getType() == "oring:reacquaint") {
                      console.error("WOA! SEND HANDSHAKE AGAIN!");
                      currentClient.stop();
                   } else if (typeof pendingRequests[m.getType()] != "undefined") {
                      pendingRequests[m.getType()]._def.resolve(m.getData());
                      return;
                  } else if (m.getType() == "oring:event") {
                      console.warn("EVENT RECEIVED", m.getData().name, m.getData().eventData);
                  }
              }
          };
      }
  };

  // The connection Context is the interface that can be used to invoke methods
  // and listen to events
  var ConnectionContext = {
      
      /**
       * Listen for a serverside event
       *
       * @param      {<string>}  eventName         The event name
       * @param      {<function>}  callbackFunction  The callback function
       */
      on : function(eventName, callbackFunction) {

      },

      /**
       * Invoke a serverside method
       *
       * @param      {<type>}  hub           The hub
       * @param      {<type>}  methodName    The method name
       * @param      {string}  invocationId  The invocation identifier
       * @param      {<type>}  arguments     The arguments
       * @return     {<type>}  { description_of_the_return_value }
       */
      _invokeMethod : function(conn, hub, methodName, invocationId, arguments) {
          var invokeDeferred = _core.Deferred(),
              pendingRequests = this._pr;
          var msg = createMessage("oring:invoke", {hub : hub, name : methodName, args : arguments}, invocationId);

          if (invocationId) {
              // Setup so we wait for a response
              conn.await("oring:response__" + invocationId, {
                  _created : (new Date()).getTime(),
                  _def : invokeDeferred
              });
          }

          conn.c.send(msg);

          if (!invocationId) {
              invokeDeferred.resolve();
          }

          return invokeDeferred.promise();
      },

      setupContext : function(handshakeMessage, conn) {
          var invokeMethod = this._invokeMethod;
          if (handshakeMessage.__proto__ == ServerMessage) {
              var methods = handshakeMessage.getData().methods,
                  i,
                  context = {},
                  methodName;

              if (!methods) return true;

              var name ;
              for (i = 0; i < methods.length; i++) {
                  name =  methods[i].n;
                  
                  if (name.indexOf('.') === -1) {
                      methodName = name;
                      hub = "*";
                  } else {
                      var d = name.split('.');
                      hub = d[0];
                      methodName = d[1];
                  }

                  var fn =function(hub, name, hasResponse) {
                      return function() {
                          console.warn("CALL", hub, name);
                          var _i = null;
                          if (hasResponse) {_i = createInvocationId();}
                          return invokeMethod(conn, hub, name,  _i, argumentsToArray(arguments));
                      }
                      
                  }(hub, methodName, methods[i].r);

                  if(hub!= "*") {
                      if (!this[hub]) this[hub] = {};
                      this[hub][methodName] = fn;
                  } else {
                      this[methodName] = fn;
                  }

              }
              return true;
          }
      }
  };
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
      },
      logInfo = function() {
          if (console && console.log) {
              var params = argumentsToArray(arguments);
              params.unshift(logPrefix)
              console.log.apply(console, params);
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


  function WebSocketClient(name) {

  	var _ws,
  			self = this;

  	this.name = name;
  	this.onclose = null;
  	this.onmessage = null;
  	this.stop = function() {
  		if (_ws) {
  			console.warn("CLOSE WEBSOCKET");
  			_ws.close();
  		}
  	}
  	this.send = function(message) {
  		if (message.__proto__ == Request) {
  			if (_ws) {
  				_ws.send(message.toJSON());
  			}
  		} else {
  			logError("That's no request");
  		}
  	}

  	this.start = function(uri, hubs, opt) {
  		var deferred = _core.Deferred(),
  		qs = {};

  		if (hubs && hubs.length > 0) {
  			qs['__oringhubs'] = encodeURIComponent(hubs.join(','));
  		}

  		url = createUrl(combineUrl(uri, {
  			schema : "ws",
  			querystring : qs
  		}));


  		_ws = new WebSocket(url, "oringserver");
  		_ws.onopen = function(e) {
  			if (typeof self.onopen == "function") {
  				self.onopen();
  			}
  			deferred.resolve({});
  		}

  		_ws.onclose = function(e) {
  			if (typeof self.onclose == "function") {
  				self.onclose(e);
  			}
  		}

  		_ws.onerror = function(e) {
  			if(deferred) {
  				deferred.reject(e);
  			}
  		}

  		_ws.onmessage = function(msg) {
  			if (msg && msg.data) {
  				self.onmessage(opt.parseMessage(msg.data));
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
  	}, options),
  	_preferredClients  = [],
  	ix,
  	_protocolNotFound = false,
  	_connection;

  	if (options.transferProtocols)
  		settings.transferProtocols = options.transferProtocols;

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

  	console.warn("SETTINGS", settings);

  	var _uri = parseUrl(options.url);

  	// Loop through the protocols and connect to the first one possible
  	function connect() {
  			var deferred = _core.Deferred();

  			var c = null,
  				ix = -1,
  				handshakeComplete = false;

  			function tryNext() {
  				ix+=1;
  				if (ix < _preferredClients.length) {

  					c = new _preferredClients[ix].class(_preferredClients[ix].name);
  					c.onclose = function() {
  						console.error("Connection was lost!!!! NOOOO!");
  					};
  					
  					c.start(_uri, settings.hubs, {parseMessage : parseMessage})
  						.done(function(e) {

  							if (_connection) {
  								console.warn("[OOAOAAO] An existing connection exists! MÖÖÖRGE!");
  							}

  							/// Connection successful.
  							/// Hand over the connection lifecycle to a new OringConnection
  							_connection = Object.create(OringConnection);
  							_connection.start(c, function(context) {
  								deferred.resolve(context);
  							});	

  							if (e.message) {
  								_connection.onmessage(e.message);
  							}

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


  	this.start = function() {
  		return connect();
  	}


  	if (!options.url) {
  		logError("URL was not provided"); 
  	}


  }
  win.oring = new Oring(_core);  
  }(window));
