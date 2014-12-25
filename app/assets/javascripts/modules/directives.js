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

        }, 100);

      });
    };
  });

  // Close nav on click

  wavedox.directive('wdCloseNavOnClick', function() {
    return function (scope, element, attrs) {
      element.on('click', 'a', function() {
        var toggle = element.find('.navbar-toggle');
        var collapse = element.find('.navbar-collapse');
        if (toggle.is(':visible') && collapse.is(':visible')) {
          element.find('.navbar-toggle').click();
        }
      });
    };
  });

  // Enter key

  wavedox.directive('wdEnterKey', function() {
    return function (scope, element, attrs) {
      element.keydown(function(e) {
        if (e.keyCode === 13) {
          e.preventDefault();

          scope.$apply(function() {
            scope.$eval(attrs.wdEnterKey);
          });
        }
      });
    };
  });

  // Keydown

  wavedox.directive('wdKeydown', function() {
    return function (scope, element, attrs) {
      element.keydown(function(e) {

        scope.$apply(function() {
          scope.$eval(attrs.wdKeydown);
        });
      });
    };
  });

  // Tooltip

  wavedox.directive('wdTooltip', function() {
    return function(scope, element, attrs) {

      var title = scope.$eval(attrs.wdTooltip);
      element.attr('title', title).tooltip();
    };
  });

  // Toggle

  wavedox.directive('wdToggle', function() {
    return function(scope, element, attrs) {
      element.click(function() {
        if (attrs.wdToggleWithin) element.closest(attrs.wdToggleWithin).toggleClass('wd-toggle-open');
        $('#wd-toggle-' + scope.$eval(attrs.wdToggle)).toggle();
      });
    };
  });

  // YouTube

  wavedox.directive('wdYoutube', function() {
    return function(scope, element, attrs) {
      var id = scope.$eval(attrs.wdYoutube);

      var embed = $('<iframe>')
        .attr('src', 'http://www.youtube.com/embed/' + id);

      element.append(embed);
    };
  });

  // Visible

  wavedox.directive('wdVisible', function() {
    return function (scope, element, attr) {
      scope.$watch(attr.wdVisible, function(visible) {
        element.css('visibility', visible ? 'visible' : 'hidden');
      });
    };
  });

})();
