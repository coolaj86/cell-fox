'use strict';

// in-memory store
var Promise = require('bluebird')
  , _p
  ;

function Poor(opts) {
  var me = this
    ;

  if (!(me instanceof Poor)) {
    return new Poor(opts);
  }

  me._data = {};

  setTimeout(function () {
    var now = Date.now()
      ;

    Object.keys(me._data).forEach(function (k) {
      if (now - me._data.touched > 4 * 60 * 60 * 100) {
        delete me._data[k];
      }
    });
  }, 1 * 60 * 60 * 1000);
}
Poor.create = Poor;

_p = Poor.prototype;

_p.put = function (k, data) {
  var me = this
    ;

  me._data[k] = { touched: Date.now(), data: data };

  return Promise.resolve();
};

_p.get = function (key) {
  var me = this
    ;

  if (me._data[key]) {
    me._data[key].touched = Date.now();
    return Promise.resolve(me._data[key].data);
  }

  return Promise.resolve(null);
};

module.exports.Poor = Poor;
