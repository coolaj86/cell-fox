'use strict';

angular.module('yololiumApp', [
  'ngCookies'
, 'ngResource'
, 'ngSanitize'
, 'ui.router'
, 'ui.bootstrap'
, 'ui.select'
, 'steve'
])
  .config([
    '$stateProvider'
  , '$urlRouterProvider'
  , '$httpProvider'
  , 'uiSelectConfig'
  , function (
      $stateProvider
    , $urlRouterProvider
    , $httpProvider
    , uiSelectConfig
  ) {
    var nav
      , footer
      ;

    uiSelectConfig.theme = 'bootstrap';

    // This identifies your website in the createToken call
    //window.Stripe.setPublishableKey(StApi.stripe.publicKey);

    // IMPORTANT: (Issue #4)
    // These funny arrays (in resolve) are neccessary because ui.router
    // doesn't get properly mangled by ng-min
    // See https://github.com/yeoman/generator-angular#minification-safe
    nav = {
      templateUrl: '/views/nav.html'
    , controller: 'NavCtrl as N'
    /*
    , resolve: {
        mySession: ['StSession', function (StSession) {
          return StSession.get();
        }]
      }
    */
    };

    footer = {
      templateUrl: '/views/footer.html'
    , controller: 'FooterCtrl as F'
    };

    //$locationProvider.html5Mode(true);

    // Deal with missing trailing slash
    $urlRouterProvider.rule(function($injector, $location) {
      var path = $location.path(), search = $location.search()
        ;

      if (path[path.length - 1] === '/') {
        return;
      }

      if (Object.keys(search).length === 0) {
        return path + '/';
      }

      var params = []
        ;

      angular.forEach(search, function(v, k){
        params.push(k + '=' + v);
      });

      return path + '/?' + params.join('&');
    });
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('root', {
        url: '/'
      , views: {
          nav: nav
        , body: {
            templateUrl: 'views/main.html'
          , controller: 'MainCtrl as M'
          /*
          , resolve: {
              mySession: ['StSession', function (StSession) {
                console.log('hello world');
                return StSession.get();
              }]
            }
          */
          }
        , footer: footer
        }
      })
      ;

    // alternatively, register the interceptor via an anonymous factory
    $httpProvider.interceptors.push(function(/*$q*/) {
      var recase = window.Recase.create({ exceptions: {} })
        ;

      return {
        'request': function (config) {
          /*
          if (!/.html/.test(config.url)) {
            console.log('[$http] request');
            console.log(config);
            //console.log(config.method, config.url);
          }
          */
          if (config.data
              && !/^https?:\/\//.test(config.url)
              && /json/.test(config.headers['Content-Type'])
          ) {
            config.data = recase.snakeCopy(config.data);
          }
          return config;
        }
      , 'requestError': function (rejection) {
          //console.log('[$http] requestError');
          //console.log(rejection);
          return rejection;
        }
      , 'response': function (response) {
          var config = response.config
            ;

          // our own API is snake_case (to match webApi / ruby convention)
          // but we convert to camelCase for javascript convention
          if (!/^https?:\/\//.test(config.url) && /json/.test(response.headers('Content-Type'))) {
            response.data = recase.camelCopy(response.data);
          }
          return response;
        }
      , 'responseError': function (rejection) {
          //console.log('[$http] responseError');
          //console.log(rejection);
          return rejection;
        }

      };
    });
  }])
  .run([function () {
    console.log('Hello World');
  }])
  ;
