(function() {
  var wavedox = angular.module('wavedox');

  // Nav Ctrl

  NavCtrl.$inject = ['$scope', 'NavService'];
  wavedox.controller('NavCtrl', NavCtrl);

  function NavCtrl($scope, NavService) {
    $scope.showSubnav = function() {
      return NavService.showSubnav;
    }

    $scope.toggleNav = function() {
      NavService.toggleSubnav();
    };
  }

  // Nav Service

  NavService.$inject = [];
  wavedox.service('NavService', NavService);

  function NavService() {
    return {
      showSubnav: false,

      toggleSubnav: function() {
        this.showSubnav = !this.showSubnav;
      }
    };
  }

  // Close nav on click Directive

  closeNavOnClick.$inject = ['NavService'];
  wavedox.directive('wdCloseNavOnClick', closeNavOnClick);

  function closeNavOnClick(NavService) {
    return function (scope, element, attrs) {
      $(document).on('click', function(e) {
        var a = $(e.target).closest('a');

        if (NavService.showSubnav && !a.hasClass('nav-toggle')) {
          NavService.toggleSubnav();
          scope.$apply();
        }
      });
    };
  }

})();
