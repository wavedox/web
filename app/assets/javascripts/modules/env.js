(function() {
  var wavedox = angular.module('wavedox');

  Env.$inject = ['Cookie'];
  wavedox.service('Env', Env);

  function Env(Cookie) {
    return {
      localhostRegex: /^localhost|127.0.0.1|10.0.1/,

      isDev: function() {
        return Cookie.get('dev') || location.hostname.match(this.localhostRegex);
      }
    };
  }

})();
