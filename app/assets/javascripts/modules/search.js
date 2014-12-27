(function() {
  var wavedox = angular.module('wavedox');

  // Search Ctrl

  SearchCtrl.$inject = ['$scope', 'SearchModel', 'SearchService'];
  wavedox.controller('SearchCtrl', SearchCtrl);

  function SearchCtrl($scope, SearchModel, SearchService) {
    $scope.searchModel = new SearchModel();
    SearchService.searchModel = $scope.searchModel;

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

    function SearchModel() {
      this.keyword = '';
      this.cardinality = Cookie.get('default_cardinality') || 'one';
      this.dataType = Cookie.get('default_data_type') || 'character';
      this.world = Cookie.get('default_world') || 'usps';
    }

    // Set

    SearchModel.prototype.set = function(key, value) {
      if (key === 'cardinality' && value === 'one') this.world = 'usps';
      this[key] = value;
      this.saveOptions();
    }

    // Save Options

    SearchModel.prototype.saveOptions = function() {
      Cookie.set('default_cardinality', this.cardinality);
      Cookie.set('default_data_type', this.dataType);
      Cookie.set('default_world', this.world);
    };

    // Pluralize

    SearchModel.prototype.pluralize = function() {
      return this.cardinality === 'all' ? 's' : '';
    };

    // World Label

    SearchModel.prototype.worldLabel = function() {
      if (this.world === 'all') return 'all worlds';
      return this.world.toUpperCase();
    };

    return SearchModel;
  }

  // Search Service

  SearchService.$inject = ['$location', 'Alert'];
  wavedox.service('SearchService', SearchService);

  function SearchService($location, Alert) {
    return {

      // Search

      search: function(searchModel) {
        var keyword = searchModel.keyword.trim().toLowerCase();
        var endpoint = searchModel.dataType.trim().toLowerCase() + 's';

        if (searchModel.cardinality === 'all' && keyword.length < 3) {
          Alert.error('Enter at least 3 letters to find all matching ' + endpoint + '.');
          return;
        }

        var world = searchModel.world.trim().toLowerCase();
        var sep = searchModel.cardinality === 'all' ? '?keyword=' : '/';

        $location.url('/worlds/' + world + '/' + endpoint + sep + keyword);
      }
    };
  }

})();
