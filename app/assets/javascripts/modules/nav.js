(function() {
  var wavedox = angular.module('wavedox');

  // Nav Ctrl

  NavCtrl.$inject = ['$scope'];
  wavedox.controller('NavCtrl', NavCtrl);

  function NavCtrl($scope) {
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
