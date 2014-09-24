'use strict';
var config
  ;

config = {
  protocol: 'http'
, hostname: 'localhost'
, port: 8080
, get host() {
    return config.hostname + ':' + config.port;
  }
, get href() {
    return config.protocol + '://' + config.host;
  }
};

module.exports = config;
