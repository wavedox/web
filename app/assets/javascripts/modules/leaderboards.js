(function() {
  var wavedox = angular.module('wavedox');

  // Leaderboard Ctrl

  LeaderboardCtrl.$inject = ['$scope', 'Leaderboard'];
  wavedox.controller('LeaderboardCtrl', LeaderboardCtrl);

  function LeaderboardCtrl($scope, Leaderboard) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.showImages = true;

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };

    $scope.leaderboards = [
      new Leaderboard(0, 'usps').load(),
      new Leaderboard(1, 'uspc').load()
    ];
  }

  // Leaderboard Model

  LeaderboardFactory.$inject = ['Census', 'Character', 'League', 'Cookie'];
  wavedox.factory('Leaderboard', LeaderboardFactory);

  function LeaderboardFactory(Census, Character, League, Cookie) {

    function Leaderboard(index, world) {
      this.index = index;
      this.stats = Cookie.get('leaderboard_' + index + '_stats') || 'skill_points';
      this.world = Cookie.get('leaderboard_' + index + '_world') || world;
      this.characters = [];
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

    Leaderboard.prototype.saveOptions = function() {
      Cookie.set('leaderboard_' + this.index + '_stats', this.stats);
      Cookie.set('leaderboard_' + this.index + '_world', this.world);
    };

    Leaderboard.prototype.load = function() {
      this.saveOptions();

      var leaderboard = this;
      var worldId = Census.worlds[this.world];

      ga('send', 'event', 'Leaderboards', 'Top ' + this.statsLabel() + ' in ' + this.world.toUpperCase(), Cookie.get('my_character'));

      var path = '/character?' + this.stats + '=%3C1000000'
               + '&deleted=false'
               + '&combat_rating=%3E100'
               + '&skill_points=%3E100'
               + '&world_id=' + worldId
               + '&c:show=character_id,name,' + this.stats + ',world_id,combat_rating,pvp_combat_rating,skill_points'
               + '&c:join=guild_roster^on:character_id^to:character_id(guild^terms:world_id=' + worldId + '^show:name)'
               + '&c:sort=' + this.stats + ':-1,name'
               + '&c:limit=100';

      Census.get(path, function(response) {
        var list = response['character_list'] || [];

        leaderboard.characters = _.map(list, function(hash) {
          var leagueHash = _.getPath(hash, 'character_id_join_guild_roster.guild_id_join_guild');
          var league = League.parse(_.extend(leagueHash, { world_id: worldId }));
          return Character.parse(hash, league);
        });
      });

      return this;
    };

    return Leaderboard;
  }

})();
