(function() {
  var wavedox = angular.module('wavedox', ['ngRoute', 'camelizeHttp']);

  WavedoxConfig.$inject = ['$locationProvider', '$routeProvider'];
  wavedox.config(WavedoxConfig);

  function WavedoxConfig($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider

      .when('/', {
        templateUrl: '/templates/home.html'
      })

    .otherwise({ redirectTo: '/' });
  }

})();
