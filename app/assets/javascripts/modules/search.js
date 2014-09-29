(function() {
  var wavedox = angular.module('wavedox');

  // Search Ctrl

  SearchCtrl.$inject = ['$scope', 'SearchModel'];
  wavedox.controller('SearchCtrl', SearchCtrl);

  function SearchCtrl($scope, SearchModel) {
    $scope.showSearchOptions = false;
    $scope.searchModel = new SearchModel();

    $scope.placeholder = function() {
      var prefix = $scope.searchModel.dataType ? _.str.capitalize($scope.searchModel.dataType) + ' name' : 'Keywords';
      var suffix = $scope.searchModel.world ? ' (' + $scope.searchModel.world.toUpperCase() + ')' : ' (all worlds)';
      return prefix + suffix;
    };

    $scope.toggleSearchOptions = function() {
      $scope.showSearchOptions = !$scope.showSearchOptions;
    };
  }

  // Search Model

  SearchModelFactory.$inject = [];
  wavedox.factory('SearchModel', SearchModelFactory);

  function SearchModelFactory() {
    return SearchModel;

    function SearchModel() {
      this.keyword = '';
      this.cardinality = $.cookie('default_cardinality') || 'one';
      this.dataType = $.cookie('default_data_type') || 'character';
      this.world = $.cookie('default_world') || 'usps';

      this.set = function(key, value) {
        this[key] = value;
        this.saveOptions();
      }

      this.saveOptions = function() {
        updateCookie('default_cardinality', this.cardinality);
        updateCookie('default_data_type', this.dataType);
        updateCookie('default_world', this.world);
      };

      this.pluralize = function() {
        return this.cardinality === 'all' ? 's' : '';
      };
    }

    function updateCookie(key, value) {
      $.cookie(key, value, { expires: 365, path: '/' });
    }
  }

})();
