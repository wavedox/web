(function() {
  var wavedox = angular.module('wavedox');

  // Welcome Ctrl

  WelcomeCtrl.$inject = ['$scope', 'ProfileService'];
  wavedox.controller('WelcomeCtrl', WelcomeCtrl);

  function WelcomeCtrl($scope, ProfileService) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.hasProfile = function(type) {
      return ProfileService.hasProfile(type);
    };

    $scope.profileUrl = function(type) {
      return ProfileService.profileUrl(type);
    };
  }

})();
