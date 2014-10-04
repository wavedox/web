(function() {
  var wavedox = angular.module('wavedox');

  // Cookie Service

  Cookie.$inject = [];
  wavedox.service('Cookie', Cookie);

  function Cookie() {
    return {

      // Config

      config: {
        expires: 365,
        path: '/'
      },

      // Get

      get: function(key) {
        return $.cookie(key);
      },

      // Set

      set: function(key, value) {
        $.cookie(key, value, this.config);
      },

      // Remove

      remove: function(key, value) {
        $.removeCookie(key, this.config);
      }
    };
  }

})();
