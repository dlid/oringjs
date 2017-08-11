
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