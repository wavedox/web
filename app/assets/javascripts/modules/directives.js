(function() {
  var wavedox = angular.module('wavedox');

  // Enter key

  wavedox.directive('wdEnterKey', function() {
    return function (scope, element, attrs) {
      element.keydown(function(e) {
        if (e.keyCode === 13) {

          scope.$apply(function() {
            scope.$eval(attrs.wdEnterKey);
          });

          e.preventDefault();
        }
      });
    };
  });

  // Tooltip

  wavedox.directive('wdTooltip', function() {
    return function(scope, element, attrs){

      var title = scope.$eval(attrs.wdTooltip);
      element.attr('title', title).tooltip();
    };
  });

})();
