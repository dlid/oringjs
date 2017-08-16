    WARNING
    This package is not ready for use just yet. Too many things are not completed.
    Please try it out if you want, but I would not recommend using it just yet.

# oringjs
Nodejs server and client side script for client/server communications.

OringJS currently support WebSocket, EventSource and Long Polling connections.

# Introduction

I've had multiple projects where I've needed to setup a websocket server, and every time I'v been thinking to create a re-usable library for it.

OringJS is intended to be a nodejs server that is quick to setup and easy to use.

Although my main focus was the websocket part, I decided to implement eventsource and long polling since I was building the library anyway.

# Basic Setup

    npm install oringjs

Create server.js with the following content:

    var oring = require('oringjs').createServer({ port : 1234});
    oring.start();

Now you have a basic server that you can connect to using the clientside oring.js script. You can find the oring.js file in the build folder of the npm package, or on GitHub in the [build](https://github.com/dlid/oringjs/tree/master/build) folder.

    <!DOCTYPE html>
    <head>
     <script src="oring.js"></script>
     <script>
      // Even though it's http, a websocket connection will be attempted
      var oring = oring.create("http://localhost:1234");

      oring.start(function(oringContext) {
       // ...
      });
     </script>

## Continuing

- Read up on [OringServer](https://github.com/dlid/oringjs/wiki/OringServer) to find out how you  create methods that the clients can invoke. 
- And read about the [OringClient](https://github.com/dlid/oringjs/wiki/OringClient) client you can listen to messages that are sent from the server.

