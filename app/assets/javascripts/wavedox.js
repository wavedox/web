(function() {
  var wavedox = angular.module('wavedox', ['ngRoute']);

  WavedoxConfig.$inject = ['$locationProvider', '$routeProvider'];
  wavedox.config(WavedoxConfig);

  function WavedoxConfig($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider

      .when('/', {
        redirectTo: '/top-leagues'
      })

      .when('/top-leagues', {
        templateUrl: '/templates/leaderboards/top-leagues.html'
      })

      .when('/top-characters', {
        templateUrl: '/templates/leaderboards/top-characters.html'
      })

      .when('/worlds/:world/characters', {
        templateUrl: '/templates/characters/index.html'
      })

      .when('/worlds/:world/characters/:name', {
        templateUrl: '/templates/characters/show.html'
      })

      .when('/worlds/:world/characters/:name/suggested-feats', {
        templateUrl: '/templates/characters/suggested-feats.html'
      })

      .when('/worlds/:world/leagues', {
        templateUrl: '/templates/leagues/index.html'
      })

      .when('/worlds/:world/leagues/:name', {
        templateUrl: '/templates/leagues/show.html'
      })

      .when('/faq', {
        templateUrl: '/templates/faq.html'
      })

    .otherwise({ redirectTo: '/' });
  }

})();
