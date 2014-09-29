// https://github.com/wcamarao/camelize-http

(function() {

  cHttp.$inject = ['$http'];
  angular.module('camelizeHttp', []).service('cHttp', cHttp);

  function cHttp($http) {
    http.get = get;
    http.post = post;
    return http;

    function http(options) {
      return wrap($http(options));
    }

    function get() {
      return wrap($http.get.apply(this, arguments));
    }

    function post() {
      var args = [];

      for (var i=0; i<arguments.length; i++) {
        args.push(arguments[i]);
      }

      args[1] = parse(arguments[1], underscore);
      return wrap($http.post.apply(this, args));
    }

    function wrap(req) {
      return {
        success: function(callback) {
          req.success(curry(callback));
          return wrap(req);
        },

        error: function(callback) {
          req.error(curry(callback));
          return wrap(req);
        },
      };
    }

    function curry(callback) {
      return function(response) {
        callback(parse(response, camelize));
      };
    }

    function parse(value, method) {
      if (!(value instanceof Object)) return value;
      var result = (value instanceof Array) ? [] : {};

      for (var key in value) {
        var newKey = (value instanceof Array) ? key : method(key);
        result[newKey] = parse(value[key], method);
      }

      return result;
    }

    function camelize(str) {
      // https://github.com/epeli/underscore.string
      return str.trim().replace(/[-_\s]+(.)?/g, function(match, c) { return c ? c.toUpperCase() : ''; });
    }

    function underscore(str) {
      // https://github.com/epeli/underscore.string
      return str.trim().replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    }
  }

})();
