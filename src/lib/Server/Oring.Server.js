var extend  = require("extend"),
		http = require('http'),
		winston = require('winston'),
		uuid = require('uuid'),
		ConnectionBase = require('./Oring.Server.ConnectionBase.js'),
    OringWebMethod = require('./Oring.Server.WebMethodBase.js'),
    serverUtilities = require('./Oring.Server.Utilities.js'),
    IncomingMessageBase = require('./Oring.Server.IncomingMessageBase.js'),
    OutgoingMessageBase = require('./Oring.Server.OutgoingMessageBase.js'),
    Deferred = require('deferred-js'),
    ConnectionManagerBasic = require('./Oring.Server.ConnectionManagerBasic.js');

var OringServer = function(protocolArray, options) {

	var _self = this,
			_methods = { '*' : {}},
			_eventhandlers = {},
			_protocols = [],
			_webServer, 
			_logger = null,
			_eventNames = ['connecting', 'connected', 'disconnected', 'webRequest'],
			settings = extend({
				port : 1234,
        enum : {
          seenPropertyKey : '_seen'
        }
			}, options),
      _clients = {},
      _clientCount = 0,
      _disconnectedClients = {},
      _connectionManager;

      //if (!settings.connectionManager || (settings.connectionManager && settings.connectionManager.__proto__ == ConnectionManagerBasic) ) {
        settings.connectionManager = new ConnectionManagerBasic();
      //}

      _connectionManager = settings.connectionManager;

		this.getWebServer = function() {
	  	return _webServer;
	  }


    function createMessage(messageType, messageData, invocationId) {
        return OutgoingMessageBase.create(messageType, messageData, invocationId);
      }

    function getConnectionById(id) {
      if (_clients[id]) 
        return _clients[id];
      return null;
    }


  var EventCallingObject = {
    _currentConnection : null,
    getConnectionId : function() {
      if (this._currentConnection)
        return this._currentConnection.getConnectionId();
      return null;
    },
    Hubs : {
      get : function(name) {},
      getNames : function() {},
      getConnections : function(hubName) {}
    },
    
    Connections : {
      getAll : _connectionManager.getAll,
      getByProperty : _connectionManager.findByProperty,
      getById : _connectionManager.getById
    },

    /**
     * Send an event to specified clients
     *
     * @param      {string|string[]}  target  The target id or ids to send to
     * @param      {<type>}  name    The event name
     * @param      {<type>}  data    The event data
     */
    send : function(target, name, data) {
      target = serverUtilities.toArray(target);

      _connectionManager.getAll(function(c) {
        if ( target == null || target.indexOf(c.getConnectionId()) != -1 ) {
          c.send( OutgoingMessageBase.create("oring:event", {
            name : name,
            eventData : data
          }));
        };
      })

    }

  };

  // Utilities for the protocols to use
  function _internalServerInstance(protocolInstance) {
  	return {
  		getWebServer : _self.getWebServer,
  		createConnection : function(options) {
  			if (!options.send) {
  				throw "createConnection options was missing send method";
  			}
        return ConnectionBase.create(protocolInstance.getName(), options.send);
  		},
      getConnectionById : _connectionManager.getById,
      lostConnection : _connectionManager.suspend,
      addConnection : _connectionManager.add,
      on : _self.on,
  		getMethodsForClient : function(client) {
  			var result = [];
  			for(var hub in _methods) {
  				if(_methods.hasOwnProperty(hub)) {
	  				var namespace = (hub == "*") ? "" : hub + ".";
	  				for (var methodName in _methods[hub]) {
	  					if (_methods[hub].hasOwnProperty(methodName)) {

	  						result.push({
                  n : namespace + methodName,
                  r : _methods[hub][methodName].hasResponse()
                });
	  					}
	  				}
	  			}
  			}
  			return result;

  		},
      parseIncomingMessage : IncomingMessageBase.parse,
  		triggerConnectedEvent : function(client) {
        if (_eventhandlers['connected']) {
          for (var i=0; i < _eventhandlers['connected'].length; i+=1) {
            var m = _eventhandlers['connected'][i];
            setTimeout(function() {
              m.call(Object.create(EventCallingObject, {
                _currentConnection : {value : client }
              }), client.getConnectionId() );
            }, 1);
          }
        }
      },
      triggerDisconnectedEvent : function(client) {
        if (_eventhandlers['disconnected']) {
          for (var i=0; i < _eventhandlers['disconnected'].length; i+=1) {
            var m = _eventhandlers['disconnected'][i];
            setTimeout(function() {
              m.call(Object.create(EventCallingObject), client.getConnectionId() );
            }, 1);
          }
        }
      },
      triggerConnectingEvent : function(client, parameters) {
        var d = new Deferred();

  			if (_eventhandlers['connecting']) {
          serverUtilities.deferredWait(_eventhandlers['connecting'],  
            Object.create(EventCallingObject), { 
              parameters : parameters,
              _currentConnection : {value : client }
            })
            .done(d.resolve)
            .fail(function() {
              console.warn("TRIGGERFAILE");
              d.reject();
            });
  			} else {
          d.resolve();
        }
        return d.promise();
  		},
  		getParametersFromURL : serverUtilities.parseQuerystring,
  		createLogger : createLogger,
  		getOptions : function(name, defaults) {
		  	if (!name) return settings;
		  	if (typeof settings[name] !== "undefined") return settings[name];
		  	return defaults;
		  },
		  createMessage : OutgoingMessageBase.create,
      messageReceived : function(connectionID, incomingMessage) {
        var deferred  = new Deferred();

        if (incomingMessage.getType() == "oring:invoke") {
          var hub = incomingMessage.getData().hub,
              method = incomingMessage.getData().name,
              args = incomingMessage.getData().args;

            if (_methods[hub] && _methods[hub][method]) {

              _connectionManager.getById(connectionID).done(function(client) {

                console.log(" ");
                console.warn("INVOKE " + hub + "." + method );
                console.warn(" hasResponse " + _methods[hub][method].hasResponse() );
                console.warn(" isLongRunning " + _methods[hub][method].isLongRunning() );

                if (_methods[hub][method].hasResponse()) {
                  var invokationDeferred  = new Deferred();

                  invokationDeferred.promise().done(function(result) {

                    console.warn("OK, promise resolved for " + connectionID);
                    if (!_methods[hub][method].isLongRunning()) {
                      deferred.resolve(OutgoingMessageBase.create("oring:response__" + incomingMessage.getInvocationID(), result));
                    } else {
                      var c = getConnectionById(connectionID);

                      _connectionManager.getById(connectionID).done(function(c) {
                          console.warn("Send long running response to " + connectionID);
                          c.send(OutgoingMessageBase.create("oring:response__" + incomingMessage.getInvocationID(), result));
                      });

                    }
                  }).fail(function() {
                    console.warn("Hm, rejected yeah? " + connectionID);
                    if (!_methods[hub][method].isLongRunning()) {
                      deferred.reject();
                    }
                  });

                  setTimeout(function() {
                    _methods[hub][method].invoke(Object.create(EventCallingObject, {
                      _currentConnection : {value : client }, 
                      resolve : {
                        value : function(r) {
                          invokationDeferred.resolve(r);
                        }
                      },
                      reject : {
                        value : function(r) {
                          invokationDeferred.reject(r);
                        }
                      }
                    }), args);
                  }, 10);
                } else {
                  setTimeout(function() {
                    _methods[hub][method].invoke(Object.create(EventCallingObject, {
                      _currentConnection : {value : client }
                    }), args);
                  }, 10);
                }
                console.log(" ");
                console.log(" ");
                console.log(" ");

                 if (_methods[hub][method].isLongRunning() || !_methods[hub][method].hasResponse()) {
                  // For long polling this will return a response immediatly and the response
                  // will be sent later via the polling
                  deferred.resolve(null);
                }
              });

            }
           

        }

        if (!incomingMessage.expectingResponse()) {
          console.log("Not expecting response");
          deferred.resolve(null);
        } else {
          
         /* console.warn("RECEIVED", incomingMessage);
          setTimeout(function() {
            deferred.resolve(OutgoingMessageBase.create("oring:response__" + incomingMessage.getInvocationID(), {
              data : 5,
              something : 'apa'
            }));
          },1500);*/
        }
        return deferred.promise();
      }

  	}
  }


  function triggerWebRequestEvent(request, response) {
    if (_eventhandlers['webRequest']) {
          for (var i=0; i < _eventhandlers['webRequest'].length; i++) {
            var cancelReason = null,
                cancelled = false,
                eventArgs = {
                  request : request,
                  response : response,
                  cancel : function(reason) {
                    cancelReason = reason;
                    cancelled = true;
                  }
                };

            _eventhandlers['webRequest'][i].call({
              
            }, eventArgs);

            if (cancelled) {
              return {
                cancel : true,
                reason : cancelReason
              };
            }
          }
        }
        return {
          cancel : false
        };
  }

  function createLogger(name) {
  	return {
  		debug : function(message, data) {
  			winston.debug('debug', '[' + name + '] ' + (typeof message == "string" ? message : ""), {  
			  	someKey: 'some-value'
				});
  		},
  		silly : function(message, data) {
  			winston.debug('silly', '[' + name + '] ' + (typeof message == "string" ? message : ""), {  
			  	someKey: 'some-value'
				});
  		},
  		info : function(message, data) {
			//	winston.log('info', '[' + name + '] ' + (typeof message == "string" ? message : ""));
  		},
  		warn :function(message, data) {
  			winston.debug('warn', '[' + name + '] ' + (typeof message == "string" ? message : ""), {  
			  	someKey: 'some-value'
				});
  		},
  		error : function(message, data) {
  			winston.debug('error', '[' + name + '] ' + (typeof message == "string" ? message : ""), {  
			  	someKey: 'some-value'
				});
  		}
  	};
  }

  this.createHub = function(hubName, hubObject) {

  	if (!_methods[hubName]) {
  		_methods[hubName] = {};

  		for (var methodName in hubObject) {
  			if (hubObject.hasOwnProperty(methodName)) {
          var o = createWebMethod(methodName, hubObject[methodName]);
          if (o) {
            _methods[hubName][methodName] = o;
          }
  			}
  		}

  	}

  }
  this.requestResponse = function(callback, isLongRunning) {
    return Object.create(OringWebMethod, {
      _hasResponse : {value : true},
      _callback : {value : callback},
      _isLongRunning : {value : isLongRunning ? true : false}
    });
  }

  this.on = function(eventName, callback){

  	if (_eventNames.indexOf(eventName) === -1) {
  		_logger.warn("Event does not exist", eventName);
  		return;
  	}
  	if(!_eventhandlers[eventName]) _eventhandlers[eventName] = [];
  	_eventhandlers[eventName].push(callback);
  }

  _logger = createLogger('oring.server');

  function createWebMethod(functionName, callback) {
      var method;

    if (typeof callback == "undefined") return;

    if (callback.__proto__ == OringWebMethod) {
      method = callback;
      method.setName(functionName);
    } else if (typeof callback == "function") {
      method = Object.create(OringWebMethod, {
        _callback : {value : callback},
        _name : {value : functionName}
      });
    } else {
      _logger.warn("Bad parameters");
      return;
    }

    return method;
  }

  this.setShared = function(functionName, callback) {
    var method = createWebMethod(functionName, callback);
    if (method) {
    	if (!_methods['*'][functionName]) {
    		_methods['*'][functionName] = method;
    	} else {
    		_logger.warn("Shared function already defined " + functionName);
    	}
    }
  }

	// Create the protocols
	for( var i = 0; i < protocolArray.length; i+=1) {
		var p = protocolArray[i].create();
		p.setOringServerInstance(_internalServerInstance(p));
		_protocols.push(p);
	}

	// make sure protocol have defaults and are extended
	for( var i = 0; i < _protocols.length; i+=1) {
		var protocolName = _protocols[i].getName();
		settings[protocolName] = extend(_protocols[i].getDefaultOptions(), settings[protocolName]);
	}

	this.start = function() {
		_webServer = http.createServer(function (request, response) {

        if (request.method == "OPTIONS") {
          response.writeHead(200, {
              'Access-Control-Allow-Origin' : request.headers["Origin"] ? request.headers["Origin"] : '*',
              'Access-Control-Allow-Methods' : 'POST,GET',
              'Access-Control-Allow-Headers' : 'content-type,x-oring-request'
            });
          response.end()
          return;
        }

	        _logger.info('HTTP Request Received ' + request.url + " " + request.method);
	        
          var e = triggerWebRequestEvent(request, response, null);

          if (!e.cancel) {
            response.writeHead(404, {
              'Content-type': 'text/plain',
              'Access-Control-Allow-Origin' : '*'});
  	        _logger.info('HTTP Request Received ' + request.url)
  	        response.write("[oring] Resource not found");
  	        response.end();
          }
		});

	  _webServer.listen(settings.port, function () {
				_logger.info('listening on port ' + settings.port)

		    // Setup our protocols
				for( var i = 0; i < _protocols.length; i+=1) {
					if (_protocols[i].start()) {
						console.log("["+_protocols[i].getName()+"] protocol started");
					}
				}

		});
	}


}


module.exports = OringServer;