(function() {
  var wavedox = angular.module('wavedox');

  // Nav Ctrl

  NavCtrl.$inject = ['$scope', 'ProfileService'];
  wavedox.controller('NavCtrl', NavCtrl);

  function NavCtrl($scope, ProfileService) {
    $scope.hasProfile = function(type) {
      return ProfileService.hasProfile(type);
    };

    $scope.profileUrl = function(type) {
      return ProfileService.profileUrl(type);
    };
  }

  // Close nav on click Directive

  closeNavOnClick.$inject = [];
  wavedox.directive('wdCloseNavOnClick', closeNavOnClick);

  function closeNavOnClick() {
    return function (scope, element, attrs) {
      $(document).on('click', function(e) {
      });
    };
  }

})();
