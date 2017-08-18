var Deferred = require('deferred-js'),
    ConnectionBase = require('./Oring.Server.ConnectionBase.js'),
    extend  = require("extend"),
    fs = require('fs');


/**
 * A basic connection manager storing connections in memory only
 */
var ConnectionManagerBasic = function(log4js) {



    /**
     * An object to store our connections in
     */
    var _connections = {},
        _s = {},
        _log = log4js.getLogger('connectionManagerBasic'),
        _readyDeferred = new Deferred(),
        _readyPromise = _readyDeferred.promise(),
        _settings = {
            filename : '_connections.json'
        }

        /**
         * { function_description }
         */
        function load(){
            if (fs.existsSync(_settings.filename)) {
                fs.readFile(_settings.filename, function read(err, data) {
                    if (err) {
                        _log.error("Could not read connections file");
                    } else {
                        var jsonData = data.toString(),
                            connectionArray;
                        try {connectionArray = JSON.parse(jsonData);} catch(e) {}
                        if (connectionArray) {
                            var connectionIds = Object.keys(connectionArray);

                            for (var i=0; i < connectionIds.length; i+=1) {
                                var c = ConnectionBase._fromObject(connectionArray[connectionIds[i]]);
                                if (c) {
                                    if (!c.getProperty('__suspended'))
                                        c.setProperty('__suspended', (new Date()).getTime());
                                    _log.info("Add suspended: ", c.toJSON());
                                }
                            }

                        }
                    }
                    _readyDeferred.resolve();
                });
            } else {
                _readyDeferred.resolve();
            }
        }

        function ready(callback) {
            _log.info("readycallback");
            if (_readyDeferred.isResolved()) {
                _log.info("is resolved");
                callback();
            } else {
             _log.info("add to done");
                _readyPromise.done(callback);
            }
        }

        function save(){
            if (!_readyDeferred.isResolved()) {
                // Never save while we're starting up
                return;
            }


            _log.info("Saving connections...");
            // Save everything. All will be restored as "suspended"
            var all = extend({}, _connections, _s);
            fs.writeFile(_settings.filename, JSON.stringify(all) , function(err) {
                if(err) {
                    return console.log(err);
                }
            }); 
        }

    function removeAll() {
        var d = new Deferred();
        _connections = {};
        this._s = {};
        save();
        d.resolve();
        return d.promise();
    }

    /**
     * Add a new connection
     *
     * @param      {<type>}  connectionBase  The connection base
     */
    function add(connectionBase) {
        var d = new Deferred();
        _log.debug("Add connection", connectionBase);
        if (connectionBase.__proto__ == ConnectionBase) {
            if (!_connections[connectionBase.getConnectionId()]) {
                _connections[connectionBase.getConnectionId()] = connectionBase;

                if (!connectionBase.getProperty('__connected'))
                    connectionBase.setProperty('__connected', (new Date()).getTime());

                connectionBase.onUpdated = function() {
                    save();
                };
                save();
                d.resolve();
            }
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    }

    /**
     * Remove an existing connection
     *
     * @param      {<type>}  connectionId  The connection identifier
     */
    function remove(connectionId) {
        var d = new Deferred();
        if (!_connections) _connections = {};
        
        if (typeof connectionId == "string") {
                _log.debug("Remove connection", connectionId);
            if (_connections[connectionId]) {
                delete _connections[connectionId];
            }
            save();
            d.resolve();
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    }

    /**
     * Get a connection by its ID
     *
     * @param      {<type>}  connectionId  The connection identifier
     */
    function getById(connectionId) {
        var d = new Deferred();
        
        if (typeof connectionId == "string") {
            if (_connections[connectionId]) {
                d.resolve(_connections[connectionId]);
            }
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    }

    /**
     * Get all current connections
     *
     * @param      {<type>}  filterCallbackFunction  The optional filter callback function to filter out connections
     */
    function getAll(filterCallbackFunction) {
        var d = new Deferred();
        
        var connectionIds = _connections ? Object.keys(_connections) : [],
            result = [];
        for (i=0; i < connectionIds.length; i+=1) {
            if (typeof filterCallbackFunction == "function") {
                if (filterCallbackFunction(_connections[connectionIds[i]]) == true) {
                    result.push(_connections[connectionIds[i]]);
                }
            } else {
                result.push(_connections[connectionIds[i]]);
            }
        }
        d.resolve(result);
        

        if (!d.isResolved()) d.reject();

        return d.promise();
    }

    /**
     * Find conncetions by their properties
     *
     * @param      {string|RegEx}  propertyName   The property name
     * @param      {string|RegEx}  propertyValue  The property value
     */
    function findByProperty(propertyName, propertyValue) {
        var d = new Deferred(),
            result = [];
            
        if (typeof propertyName == "string" || propertyName.__proto__ == RegExp.prototype) {
            this.getAll().done(function(connections) {
                for (var i=0; i < connections.length; i+=1) {
                    if (connections[i].hasProperty(propertyName, propertyValue)) {
                        result.push(connections[i]);
                    }
                }
                d.resolve(result);
            }).fail(d.reject);
        }

        return d.promise();
    }

    /**
     * Suspend a lost connection, giving it a chance to resume
     *
     * @param      {<type>}  connectionId  The connection identifier
     */
    function suspend(connectionId) {
         var d = new Deferred();

         console.log("Suspending connection " + connectionId);

        if (typeof connectionId == "string") {
            if (_connections[connectionId]) {
                _s[connectionId] = _connections[connectionId];
                _s[connectionId].setProperty('__suspended', (new Date()).getTime());
                delete _connections[connectionId];
                save();
                d.resolve();
            } else {
                d.reject();
            }
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    }

    /**
     * Resume a suspended connection
     *
     * @param      {<type>}  connectionId  The connection identifier
     */
    function resume(connectionId) {
        var d = new Deferred();

         console.log("Resuming connection "+ connectionId);
        if (typeof connectionId == "string") {
            if (_s[connectionId]) {
                _connections[connectionId] = _s[connectionId];
                _s[connectionId].removeProperty('__suspended');
                delete _s[connectionId];
                d.resolve();
            } else {
                d.reject();
            }
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    };

    load();

    return {
        getById : getById,
        getAll : getAll,
        findByProperty : findByProperty,
        add : add,
        remove : remove,
        resume : resume,
        suspend : suspend,

        ready : ready
    };

};

module.exports = ConnectionManagerBasic;
