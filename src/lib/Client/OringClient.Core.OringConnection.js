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