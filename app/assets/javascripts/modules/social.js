(function() {
  var wavedox = angular.module('wavedox');

  // Social Ctrl

  SocialCtrl.$inject = ['$scope', 'Alert'];
  wavedox.controller('SocialCtrl', SocialCtrl);

  function SocialCtrl($scope, Alert) {
    $scope.getAlert = function() {
      return Alert.alerts[0];
    };
  }

})();
