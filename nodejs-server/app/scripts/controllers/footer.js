'use strict';

angular.module('yololiumApp')
  .controller('FooterCtrl', [
    '$scope'
  , function (
      $scope
  ) {
    var scope = this
      ;

    $scope.foo = 'bar';
    scope.foo = 'baz';
  }]);
