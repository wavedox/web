(function() {
  var wavedox = angular.module('wavedox');

  // Leaderboard Ctrl

  LeaderboardCtrl.$inject = ['$scope', 'Leaderboard'];
  wavedox.controller('LeaderboardCtrl', LeaderboardCtrl);

  function LeaderboardCtrl($scope, Leaderboard) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.showImages = true;
    $scope.leaderboard = new Leaderboard().load();

    $scope.filterModel = {
      parse: function(c) {
        var val = $scope.filterModel.value && $scope.filterModel.value.toLowerCase();
        if (!val) return true;

        var regex = new RegExp(val);
        return (c.name && c.name.toLowerCase().match(regex))
          || (c.leagueName && c.leagueName.toLowerCase().match(regex));
      }
    };

    $scope.filter = function(value) {
      ga('send', 'event', 'Leaderboards', 'Filter by', value);
    };

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };
  }

  // Leaderboard Model

  LeaderboardFactory.$inject = ['Census', 'Character', 'League', 'Cookie'];
  wavedox.factory('Leaderboard', LeaderboardFactory);

  function LeaderboardFactory(Census, Character, League, Cookie) {

    function Leaderboard() {
      // Migrate cookies
      this.stats = Cookie.get('leaderboard_stats') || Cookie.get('leaderboard_0_stats') || 'skill_points';
      this.world = Cookie.get('leaderboard_world') || Cookie.get('leaderboard_0_world') || 'usps';
      this.characters = [];

      // Clean up
      Cookie.remove('leaderboard_0_stats');
      Cookie.remove('leaderboard_1_stats');
      Cookie.remove('leaderboard_0_world');
      Cookie.remove('leaderboard_1_world');
    }

    Leaderboard.prototype.set = function(key, value) {
      this.characters = [];
      this[key] = value;
      this.load();
    };

    Leaderboard.prototype.statsCamel = function() {
      if (this.stats === 'combat_rating') return 'pveCr';
      if (this.stats === 'pvp_combat_rating') return 'pvpCr';
      return _.str.camelize(this.stats);
    };

    Leaderboard.prototype.statsLabel = function() {
      if (this.stats === 'combat_rating') return 'PvE CR';
      if (this.stats === 'pvp_combat_rating') return 'PvP CR';
      var strip = this.stats.replace(/^max_/, '');
      return _.str.humanize(strip).toLowerCase();
    };

    Leaderboard.prototype.worldLabel = function() {
      if (this.world === 'all') return 'all worlds';
      return this.world.toUpperCase();
    }

    Leaderboard.prototype.saveOptions = function() {
      Cookie.set('leaderboard_stats', this.stats);
      Cookie.set('leaderboard_world', this.world);
    };

    Leaderboard.prototype.load = function() {
      this.saveOptions();

      var leaderboard = this;
      var worldId = Census.worlds[this.world] || '';

      ga('send', 'event', 'Leaderboards', 'Top ' + this.statsLabel() + ' in ' + this.worldLabel(), Cookie.get('my_character'));

      var path = '/character?' + this.stats + '=%3C1000000'
               + '&deleted=false'
               + '&combat_rating=%3E100'
               + '&skill_points=%3E100'
               + (worldId && ('&world_id=' + worldId))
               + '&c:show=character_id,name,' + this.stats + ',world_id,combat_rating,pvp_combat_rating,skill_points'
               + '&c:join=guild_roster^on:character_id^to:character_id(guild^show:name)'
               + '&c:sort=' + this.stats + ':-1,name'
               + '&c:limit=100';

      Census.get(path, function(response) {
        var list = response['character_list'] || [];

        leaderboard.characters = _.map(list, function(hash, i) {
          var leagueHash = _.getPath(hash, 'character_id_join_guild_roster.guild_id_join_guild');
          var league = League.parse(_.extend(leagueHash, { world_id: worldId }));
          var character = Character.parse(hash, league);

          character.leaderboardRank = i + 1;
          character.leagueName = league && league.name;
          return character;
        });
      });

      return this;
    };

    return Leaderboard;
  }

})();
