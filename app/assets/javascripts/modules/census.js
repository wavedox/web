(function() {
  var wavedox = angular.module('wavedox');

  // Census Service

  Census.$inject = ['$http', 'Env', 'Alert'];
  wavedox.service('Census', Census);

  function Census($http, Env, Alert) {
    return {
      baseUrl: 'http://census.soe.com/s:bytecode/json/',
      callbackParam: 'callback=JSON_CALLBACK',
      dcuoEndpoint: '/dcuo:v1',

      // Worlds

      worlds: {
        uspc: 1,
        usps: 2,
        eupc: 3,
        eups: 4,

        reverse: [undefined, 'uspc', 'usps', 'eupc', 'eups']
      },

      // Mentors

      mentors: {
        hero: {
          meta: 'Superman',
          tech: 'Batman',
          magic: 'Wonder Woman'
        },

        villain: {
          meta: 'Lex Luthor',
          tech: 'Joker',
          magic: 'Circe'
        }
      },

      // URL builder

      buildUrlFor: function(path, verb) {
        var sep = path.indexOf('?') > -1 ? '&' : '?';
        var url = this.baseUrl + verb + this.dcuoEndpoint + path;
        if (Env.isDev()) console.info('Census', url);
        return url + sep + this.callbackParam;
      },

      // Get

      get: function(path, callback) {
        var url = this.buildUrlFor(path, 'get');

        $http.jsonp(url, { cache: true })
          .success(this.successHandler(_.now(), callback, this.errorHandler))
          .error(this.errorHandler);
      },

      // Count

      count: function(path, callback) {
        var url = this.buildUrlFor(path, 'count');

        $http.jsonp(url, { cache: true })
          .success(this.successHandler(_.now(), callback, this.errorHandler))
          .error(this.errorHandler);
      },

      // Success handler

      successHandler: function(start, callback, errorHandler) {

        return function(data) {
          var time = ((_.now() - start) / 1000).toFixed(3);
          if (Env.isDev()) console.info('Census', 'Completed in ' + time + 's');
          if (_.has(data, 'error') || _.has(data, 'errorCode')) return errorHandler(data);
          callback.apply(this, arguments);
        };
      },

      // Error handler

      errorHandler: function(data) {
        Alert.error('Failed requesting data from Census', data, 'Census');
      }
    };
  }

})();
