'use strict';

angular.module('yololiumApp')
  .controller('NavCtrl', [
    '$scope'
  , function (
      $scope
  ) {
    var scope = this
      ;

    $scope.foo = 'bar';
    scope.foo = 'baz';
  }]);
