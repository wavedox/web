(function() {
  var wavedox = angular.module('wavedox');

  // Cookie Service

  Cookie.$inject = [];
  wavedox.service('Cookie', Cookie);

  function Cookie() {
    return {

      // Get

      get: function(key) {
        return $.cookie(key);
      },

      // Set

      set: function(key, value) {
        $.cookie(key, value, { expires: 365, path: '/' });
      }
    };
  }

})();
