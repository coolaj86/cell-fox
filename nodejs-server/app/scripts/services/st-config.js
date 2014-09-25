'use strict';

angular.module('steve', [])
  .service('StConfig', function StConfig() {
    var me = this
      ;

    me.apiPrefix = '/api';
  });
