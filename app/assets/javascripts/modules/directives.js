(function() {
  var wavedox = angular.module('wavedox');

  // Infinite scroll

  wavedox.directive('wdInfiniteScroll', function() {
    return function(scope, element, attrs){
      var doc = $(document);
      var win = $(window);
      var throttler;

      win.off('scroll').on('scroll', function() {
        clearTimeout(throttler);

        throttler = setTimeout(function() {
          if (win.height() + win.scrollTop() >= doc.height() - 500) {
            scope.$apply(function() {
              scope.$eval(attrs.wdInfiniteScroll);
            });
          }

        }, 500);

      });
    };
  });

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
