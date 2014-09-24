#!/usr/bin/env node
'use strict';

var config = require('./config')
  , http = require('http')
  , server
  ;

config.port = process.argv[2] || config.port;

function serveInsecure() {
  server = http.createServer(require('./server')).listen(config.port, function () {
    console.log('Listening on ' + config.protocol + '://127.0.0.1:' + server.address().port);
    console.log('Listening on ' + config.protocol + '://' + server.address().address + ':' + server.address().port);
    console.log('Listening on ' + config.href);
  });
}

if ('http' === config.protocol) {
  serveInsecure();
} else {
  // serve();
}
