(function() {
  var wavedox = angular.module('wavedox');

  // YouTube Service

  YouTube.$inject = ['$http', 'Env', 'Alert'];
  wavedox.service('YouTube', YouTube);

  function YouTube($http, Env, Alert) {
    return {
      baseUrl: 'https://gdata.youtube.com/feeds/api/videos',
      callbackParam: 'callback=JSON_CALLBACK',

      // URL builder

      buildUrlFor: function(keywords) {
        var url = this.baseUrl + '?q=' + keywords + '&max-results=10&v=2&alt=json';
        if (Env.isDev()) console.info('YouTube', url);
        return url + '&' + this.callbackParam;
      },

      // Get

      search: function(keywords, callback) {
        var url = this.buildUrlFor(keywords);

        $http.jsonp(url)
          .success(this.successHandler(_.now(), callback, this.errorHandler))
          .error(this.errorHandler);
      },

      // Success handler

      successHandler: function(start, callback, errorHandler) {

        return function(data) {
          var time = ((_.now() - start) / 1000).toFixed(3);
          if (Env.isDev()) console.info('YouTube completed in ' + time + 's');

          callback.call(this, _.map(data.feed.entry, function(v) {
            return { id: _.getPath(v, 'media$group.yt$videoid.$t') };
          }));
        };
      },

      // Error handler

      errorHandler: function(data) {
        Alert.error('Failed requesting data from YouTube', data, 'YouTube');
      }
    };
  }

})();
