'use strict';

angular.module('yololiumApp')
  .filter('phoneNumFilter', function() {
    return function(items, filterArg) {
      var out = []
        , num = filterArg.replace(/\D/g, '')
        ;

      if (!num) {
        return out;
      }

      out = items.filter(function (item) {
        return item.raw.match(num);
      });

      return out;
    };
  })
  .controller('MainCtrl', [
    '$scope'
  , '$http'
  , 'StConfig'
  , function (
      $scope
    , $http
    , stConfig
  ) {
    var scope = this
      , numbersMap = {}
      ;

    $scope.foo = 'bar';

    scope.phones = [
      { number: '+1 (801) 471-3042', raw: '+18014713042', comment: 'FxOS T-Mobile' }
    , { number: '+1 (385) 207-3300', raw: '+13852073300', comment: 'Moto X AT&T' }
    ];
    scope.newMsg = {};
    scope.selectedNumber = null;
    scope.numbers = [{
      number: '+1 (801) 360-4427'
    , raw: '+18013604427'
    , terms: ['801','360','4427']
    }];

    scope.searchNumber = function (term) {
      console.log('sub search', term);
      var formatted
        , re = /(?=^|\D)(\+?1)?\s*[\-\.]?\s*\(?\s*(\d{3})\s*\)?\s*[\-\.]?\s*(\d{3})\s*[\-\.]?\s*(\d{4})(?=\D|$)/
        , result
        , raw
        ;

      if (!re.test(term)) {
        return;
      }
        scope.numbers = [];

      result = re.exec(term);
      console.log(result);
      formatted = '+1 (' + result[2] + ') ' + result[3] + '-' + result[4];
      raw = '+1' + result[2] + result[3] + result[4];

      numbersMap[formatted] = numbersMap[formatted] || {
        number: formatted
      , terms: [result[2], result[3], result[4]]
      , raw: raw
      };
      //numbersMap[formatted].terms[term] = term;

      scope.numbers = [numbersMap[formatted]];
      console.log('sub search', formatted, scope.numbers);
    };

    scope.sendMessage = function () {
      var msg = scope.newMsg
        ;

      console.log(scope.newMsg);
      $http.post(stConfig.apiPrefix + '/accounts/undefined/sms', {
        from: msg.from.raw
      , to: msg.to.map(function (n) { return n.raw; })
      , body: msg.body
      }).then(function (resp) {
        console.log('send message response:');
        console.log(resp);
        if (!resp.data.error) {
          scope.newMsg.body += ' 1';
        }
      });
    };
  }]);
