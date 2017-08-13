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