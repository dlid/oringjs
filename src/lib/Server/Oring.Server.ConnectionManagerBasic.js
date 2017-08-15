var Deferred = require('deferred-js'),
    ConnectionBase = require('./Oring.Server.ConnectionBase.js');


/**
 * A basic connection manager storing connections in memory only
 */
var ConnectionManagerBasic = function() {

    /**
     * An object to store our connections in
     */
    var _connections = {},
        _s = {};

    function removeAll() {
        var d = new Deferred();
        _connections = {};
        this._s = {};
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
        console.warn("ADD CONNECTION", connectionBase);
        if (connectionBase.__proto__ == ConnectionBase) {
            if (!_connections[connectionBase.getConnectionId()]) {
                _connections[connectionBase.getConnectionId()] = connectionBase;
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
            if (_connections[connectionId]) {
                delete _connections[connectionId];
            }
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
                delete _connections[connectionId];
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
                delete _s[connectionId];
                d.resolve();
            } else {
                d.reject();
            }
        }

        if (!d.isResolved()) d.reject();

        return d.promise();
    };

    return {
        getById : getById,
        getAll : getAll,
        findByProperty : findByProperty,
        add : add,
        remove : remove,
        resume : resume,
        suspend : suspend
    };

};

module.exports = ConnectionManagerBasic;
