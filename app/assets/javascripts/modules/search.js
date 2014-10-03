(function() {
  var wavedox = angular.module('wavedox');

  // Search Ctrl

  SearchCtrl.$inject = ['$scope', 'SearchModel'];
  wavedox.controller('SearchCtrl', SearchCtrl);

  function SearchCtrl($scope, SearchModel) {
    $scope.searchModel = new SearchModel();

    // Placeholder

    $scope.placeholder = function() {
      return _.str.capitalize($scope.searchModel.dataType) + ' name';
    };

    // Search

    $scope.search = function() {
      SearchService.search($scope.searchModel);
    };
  }

  // Search Model

  SearchModelFactory.$inject = ['Cookie'];
  wavedox.factory('SearchModel', SearchModelFactory);

  function SearchModelFactory(Cookie) {
    return SearchModel;

    function SearchModel() {
      this.keyword = '';
      this.cardinality = Cookie.get('default_cardinality') || 'one';
      this.dataType = Cookie.get('default_data_type') || 'character';
      this.world = Cookie.get('default_world') || 'usps';

      // Set

      this.set = function(key, value) {
        this[key] = value;
        this.saveOptions();
      }

      // Save Options

      this.saveOptions = function() {
        Cookie.set('default_cardinality', this.cardinality);
        Cookie.set('default_data_type', this.dataType);
        Cookie.set('default_world', this.world);
      };

      // Pluralize

      this.pluralize = function() {
        return this.cardinality === 'all' ? 's' : '';
      };
    }
  }

  // Search Service

  SearchService.$inject = ['$location'];
  wavedox.service('SearchService', SearchService);

  function SearchService($location) {
    return {

      // Search

      search: function(searchModel) {
        var keyword = searchModel.keyword.trim().toLowerCase();
        var endpoint = searchModel.dataType.trim().toLowerCase() + 's';

        if (searchModel.cardinality === 'all' && keyword.length < 3) {
          alert('Enter at least 3 letters to find all matching ' + endpoint + '.');
          return;
        }

        var world = searchModel.world.trim().toLowerCase();
        var sep = searchModel.cardinality === 'all' ? '?keyword=' : '/';

        $location.url('/worlds/' + world + '/' + endpoint + sep + keyword);
      }
    };
  }

})();
