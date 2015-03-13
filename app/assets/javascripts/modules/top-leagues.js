(function() {
  var wavedox = angular.module('wavedox');

  // Top Leagues Ctrl

  TopLeaguesCtrl.$inject = ['$scope', 'TopLeagues', 'Cookie'];
  wavedox.controller('TopLeaguesCtrl', TopLeaguesCtrl);

  function TopLeaguesCtrl($scope, TopLeagues, Cookie) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.topLeagues = new TopLeagues($scope).load();
    $scope.filterModel = {};
    $scope.originalLimit = 100;
    $scope.limit = $scope.originalLimit;

    $scope.filter = function(value) {
      ga('send', 'event', 'Top Leagues', 'Filter by', value);
    };

    $scope.showAll = function() {
      ga('send', 'event', 'Top Leagues', 'Show All', Cookie.get('my_character'));
      $scope.limit = $scope.topLeagues.leagues.length;
    };
  }

  // Top Leagues Model

  TopLeaguesFactory.$inject = ['$http', 'Census', 'League', 'Cookie'];
  wavedox.factory('TopLeagues', TopLeaguesFactory);

  function TopLeaguesFactory($http, Census, League, Cookie) {

    function TopLeagues($scope) {
      this.scope = $scope;

      // Migrate cookies
      this.stats = Cookie.get('top_leagues_stats') || 'score';
      this.world = Cookie.get('top_leagues_world') || 'usps';
      this.leagues = [];

      // Clean up deprecated cookies
      Cookie.remove('topleagues_stats');
    }

    TopLeagues.prototype.set = function(key, value) {
      this.leagues = [];
      this[key] = value;
      this.load();
    };

    TopLeagues.prototype.statsCamel = function() {
      return _.str.camelize(this.stats);
    };

    TopLeagues.prototype.statsLabel = function() {
      return _.str.humanize(this.stats).toLowerCase()
        .replace(/count/, 'headcount')
        .replace(/avg/, 'average')
        .replace(/pve/, 'PvE CR')
        .replace(/pvp/, 'PvP CR')
        .replace(/sp/, 'SP');
    };

    TopLeagues.prototype.worldLabel = function() {
      if (this.world === 'all') return 'all worlds';
      return this.world.toUpperCase();
    }

    TopLeagues.prototype.saveOptions = function() {
      Cookie.set('top_leagues_stats', this.stats);
      Cookie.set('top_leagues_world', this.world);
    };

    TopLeagues.prototype.load = function() {
      this.scope.limit = this.scope.originalLimit;
      this.saveOptions();

      var topLeagues = this;
      var worldId = Census.worlds[this.world] || '';

      ga('send', 'event', 'Top Leagues', 'Top ' + this.statsLabel() + ' in ' + this.worldLabel(), Cookie.get('my_character'));

      $http.get('/api/top-leagues.json').success(function(response) {
        var leagues = _.map(response, function(hash, i) {

          var league = League.parse(_.extend(hash, {
            guild_id: hash.id,
            world_id: Census.worlds[hash.world]
          }));

          league.score = hash.score.toFixed(2);
          league.avgSkillPoints = hash.avg_sp;
          league.avgPveCr = hash.avg_pve;
          league.avgPvpCr = hash.avg_pvp;
          league.spCount = hash.sp_count;
          league.pveCount = hash.pve_count;
          league.pvpCount = hash.pvp_count;
          league.alignment = hash.alignment;
          league.size = hash.size;

          return league;
        });

        leagues = _.filter(leagues, function(league) {
          if (topLeagues.world === 'all') return true;
          return league.world === topLeagues.world;
        });

        leagues = _.sortBy(leagues, function(league, i) {
          var key;
          if (topLeagues.stats === 'avg_sp') key = 'avgSkillPoints';
          if (topLeagues.stats === 'avg_pve') key = 'avgPveCr';
          if (topLeagues.stats === 'avg_pvp') key = 'avgPvpCr';
          if (topLeagues.stats === 'sp_count') key = 'spCount';
          if (topLeagues.stats === 'pve_count') key = 'pveCount';
          if (topLeagues.stats === 'pvp_count') key = 'pvpCount';
          return league[key] * -1;
        });

        _.each(leagues, function(league, i) {
          league.topRank = i + 1;
        });

        topLeagues.leagues = leagues;
      });

      return this;
    };

    return TopLeagues;
  }

})();
