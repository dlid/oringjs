var extend  = require("extend"),
		http = require('http'),
		winston = require('winston'),
		uuid = require('uuid'),
		OringClientBase = require('./Oring.ClientBase.js'),
    OringWebMethod = require('./Oring.Server.WebMethodBase.js'),
    serverUtilities = require('./Oring.Server.Utilities.js'),
    IncomingMessageBase = require('./Oring.Server.IncomingMessageBase.js'),
    OutgoingMessageBase = require('./Oring.Server.OutgoingMessageBase.js'),
    Deferred = require('deferred-js');

var OringServer = function(protocolArray, options) {

	var _self = this,
			_methods = { '*' : {}},
			_eventhandlers = {},
			_protocols = [],
			_webServer, 
			_logger = null,
			_eventNames = ['connected', 'webRequest'],
			settings = extend({
				port : 1234
			}, options),
      _clients = {},
      _clientCount = 0,
      _disconnectedClients = {};

		this.getWebServer = function() {
	  	return _webServer;
	  }


    function createMessage(messageType, messageData, invocationId) {
        return OutgoingMessageBase
      }

  // Utilities for the protocols to use
  function _internalServerInstance(protocolInstance) {
  	return {
  		getWebServer : _self.getWebServer,
  		createConnection : function(options) {
  			if (!options.send) {
  				throw "createConnection options was missing send method";
  			}

  			return Object.create(OringClientBase, {
  				connectionId : {value : uuid.v4()},
  				protocolName : {value : protocolInstance.getName()},
  				created : {value : new Date()},
  				send : {value : options.send }
  			});

  		},
      getConnectionById : function(id) {
        if (_clients[id]) 
          return _clients[id];
        return null;
      },
      lostConnection : function(client) {
        // Connection was lost, but we will give the user some time to re-connect
        _disconnectedClients[client.getConnectionId()] = client;
        delete _clients[client.getConnectionId()];
        _clientCount--;
        
        var clientKeys = Object.keys(_clients);

        for(var i = 0; i < clientKeys.length; i++) {
          if (clientKeys[i] != client.getConnectionId()) {
            _clients[clientKeys[i]].send( OutgoingMessageBase.create("connection-removed", { count : _clientCount }) );
          }
        }

      },
      addConnection : function(client) {
        _clients[client.getConnectionId()] = client;
        _clientCount++;

        var clientKeys = Object.keys(_clients);
        for(var i = 0; i < clientKeys.length; i++) {
          if (clientKeys[i] != client.getConnectionId()) {
            _clients[clientKeys[i]].send( OutgoingMessageBase.create("connection-added", { count : _clientCount }) );
          }
        }

      },
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
  		triggerConnectedEvent : function(client, parameters) {
  			if (_eventhandlers['connected']) {
  				for (var i=0; i < _eventhandlers['connected'].length; i++) {
  					var cancelReason = null,
  							cancelled = false,
  							addToGroups = [],
	  						eventArgs = {
		  						client : client,
		  						param : parameters,
		  						cancel : function(reason) {
		  							cancelReason = reason;
		  							cancelled = true;
		  						}
		  					};

  					_eventhandlers['connected'][i].call({
  						Groups : {
  							Add : function(connectionId, groupName) {
	  							console.warn("Add " + connectionId + " to group '"+groupName+"'");
	  							addToGroups.push(groupName);
	  						}
  						}
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
					cancel : false,
					client : client,
					groups : addToGroups
				};
  		},
  		getParametersFromURL : serverUtilities.parseQuerystring,
  		createLogger : createLogger,
  		getOptions : function(name, defaults) {
		  	if (!name) return settings;
		  	if (typeof settings[name] !== "undefined") return settings[name];
		  	return defaults;
		  },
		  createMessage : OutgoingMessageBase.create,
      messageReceived : function(incomingMessage) {
        var deferred  = new Deferred();

        if (incomingMessage.getType() == "oring:invoke") {
          var hub = incomingMessage.getData().hub,
              method = incomingMessage.getData().name,
              args = incomingMessage.getData().args;

            if (_methods[hub] && _methods[hub][method]) {
              console.warn("---- invoke" + hub + "." + method );
            }
        }

        if (!incomingMessage.expectingResponse()) {
          deferred.resolve(OutgoingMessageBase.create("oring:ack"));
        } else {
          
          console.warn("RECEIVED", incomingMessage);
          setTimeout(function() {
            deferred.resolve(OutgoingMessageBase.create("oring:response__" + incomingMessage.getInvocationID(), {
              data : 5,
              something : 'apa'
            }));
          },1500);
        }
        return deferred.promise();
      }

  	}
  }


  function triggerWebRequestEvent(request, response) {
    console.warn("webrequests", _eventhandlers['webRequest'].length);
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
  this.requestResponse = function(callback) {
    return Object.create(OringWebMethod, {
      _hasResponse : {value : true},
      _callback : {value : callback}
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

    if (typeof callback == "function") {
      method = Object.create(OringWebMethod, {
        _callback : {value : callback},
        _name : {value : functionName}
      });
    } else if (typeof callback.hasResponse === "function") {
      method = callback;
      method.setName(functionName);
      _logger.info("jaha, en funktion");
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
        console.log("har", method.hasResponse() ? "1" : "0");
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