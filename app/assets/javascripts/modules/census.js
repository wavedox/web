(function() {
  var wavedox = angular.module('wavedox');

  // Census Service

  Census.$inject = ['cHttp', 'Env'];
  wavedox.service('Census', Census);

  function Census(cHttp, Env) {
    return {
      baseUrl: 'http://census.soe.com/s:bytecode/json/',
      callbackParam: 'callback=JSON_CALLBACK',
      dcuoEndpoint: '/dcuo:v1',

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

        cHttp.jsonp(url, { cache: true })
          .success(this.successHandler(callback, this.errorHandler))
          .error(this.errorHandler);
      },

      // Count

      count: function(path, callback) {
        var url = this.buildUrlFor(path, 'count');

        cHttp.jsonp(url, { cache: true })
          .success(this.successHandler(callback, this.errorHandler))
          .error(this.errorHandler);
      },

      // Success handler

      successHandler: function(callback, errorHandler) {

        return function(data) {
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
