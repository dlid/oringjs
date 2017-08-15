var Deferred = require('deferred-js');

module.exports = {

    parseQuerystring : function(url) {
        var i,
            properties = {},
            search,
            d;

        if (url) {
            i = url.indexOf('?');
            if (i>-1) {
                search = url.substr(i+1).split('&');
                for( i=0; i < search.length; i+=1) {
                    d = search[i].split('=');
                    if (d.length == 2) {
                        properties[d[0]] = decodeURIComponent(d[1]);
                    }
                }
            }
        } 
        return properties;
    },

    /**
     * Invoke a number of deferred methods in a chain.
     * If one is rejected the following ones are not invoked
     *
     * @param      {<type>}  arrayOfMethods     The array of methods
     * @param      {<type>}  context            The context
     * @param      {<type>}  eventArgs  The array of parameters
     */
    deferredWait : function(arrayOfMethods, context, eventArgs) {
        var d = new Deferred(), 
            ix = -1,
            result = [],
            invoke = function() {
                ix += 1;
                if (ix < arrayOfMethods.length) {
                    var def = new Deferred();

                    context.resolve = def.resolve;
                    context.reject = def.reject;

                    def.promise().done(function(r) {
                        console.log("DONE " + ix);
                        result.push({success : true, result : r});
                        invoke();
                    })
                    .fail(function() {
                        console.log("FAILED " + ix);
                        result.push({success : false, result : r});
                        d.reject(result);
                    });
                    console.log("INVOKING " + ix);
                    arrayOfMethods[ix].call(context, eventArgs);                        
                    
                } else {
                    d.resolve(result);
                }
            };

        console.log("");
        console.log("");
        console.log(" about to invoke " + arrayOfMethods.length + " deferred methods");

        invoke();
        return d.promise();

    },

    /**
     * Makes sure the provided object is within an array
     */
    toArray : function(object) {
        if (object == null || object.__proto__ == Array.prototype) {
            return object;
        }
        return [object];
    },

    readRequestBody : function(request, readyCallback) {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) { 
                request.connection.destroy();
                readyCallback(null);
            }
        });
        request.on('end', function () {
            readyCallback(body);          
        });
    },
    createHttpResponse : function(response, code, headers, content) {
        response.writeHead(code, {
          'Content-type': 'application/json',
          'Access-Control-Allow-Origin' : '*'
        });
        response.write(content);
        response.end();
    }

};