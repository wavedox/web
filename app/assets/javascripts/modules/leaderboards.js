(function() {
  var wavedox = angular.module('wavedox');

  // Leaderboard Ctrl

  LeaderboardCtrl.$inject = ['$scope', 'Leaderboard', 'TopLeagues', 'Cookie'];
  wavedox.controller('LeaderboardCtrl', LeaderboardCtrl);

  function LeaderboardCtrl($scope, Leaderboard, TopLeagues, Cookie) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.showImages = true;
    $scope.showAll = {};
    $scope.leagueFilterModel = {};

    $scope.topLeagues = new TopLeagues();
    $scope.leaderboard = new Leaderboard($scope.topLeagues).load();

    $scope.filterModel = {
      parse: function(c) {
        var val = $scope.filterModel.value && $scope.filterModel.value.toLowerCase();
        if (!val) return true;

        var regex = new RegExp(val);
        return (c.name && c.name.toLowerCase().match(regex))
          || (c.leagueName && c.leagueName.toLowerCase().match(regex));
      }
    };

    $scope.filter = function(category, value) {
      ga('send', 'event', category, 'Filter by', value);
    };

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };

    $scope.showMore = function(category, type) {
      if (category) ga('send', 'event', category, 'Show More', Cookie.get('my_character'));
      $scope.showAll[type] = true;
    };

    $scope.isVisible = function(type, index) {
      return $scope.showAll[type] || index < 10;
    };

    if ($(window).width() >= 992) {
      $scope.showMore(null, 'characters');
      $scope.showMore(null, 'leagues');
    }
  }

  // Leaderboard Model

  LeaderboardFactory.$inject = ['Census', 'Character', 'League', 'Cookie'];
  wavedox.factory('Leaderboard', LeaderboardFactory);

  function LeaderboardFactory(Census, Character, League, Cookie) {

    function Leaderboard(topLeagues) {
      this.topLeagues = topLeagues;

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
      this.topLeagues.leagues = [];
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
               + "&c:join=guild_roster^on:character_id^to:character_id(guild^show:guild_id'name)"
               + '&c:sort=' + this.stats + ':-1,name'
               + '&c:limit=150';

      Census.get(path, function(response) {
        var list = _.filter(response['character_list'] || [], function(hash) {
          var leagueId = _.getPath(hash, 'character_id_join_guild_roster.guild_id');
          return !_.contains([ // Blacklisted leagues
            '8590148778', // The Turbans
            '8590113811' // TeamEpicFail
          ], leagueId);
        }).slice(0, 100);

        leaderboard.characters = _.map(list, function(hash, i) {
          var leagueHash = _.getPath(hash, 'character_id_join_guild_roster.guild_id_join_guild');
          var league = League.parse(_.extend(leagueHash, { world_id: hash.world_id }));
          var character = Character.parse(hash, league);

          character.leaderboardRank = i + 1;
          character.leagueName = league && league.name;
          return character;
        });

        leaderboard.topLeagues.load(leaderboard.characters);
      });

      return this;
    };

    return Leaderboard;
  }

  // Top Leagues Model

  TopLeaguesFactory.$inject = ['Census', 'Cookie', 'LeagueService'];
  wavedox.factory('TopLeagues', TopLeaguesFactory);

  function TopLeaguesFactory(Census, Cookie, LeagueService) {

    function TopLeagues() {
      this.stats = Cookie.get('topleagues_stats') || 'avgSkillPoints';
      this.leagues = [];
    }

    TopLeagues.prototype.sortBy = function(key) {
      this.stats = key;
      this.saveOptions();
      this.sort();
    };

    TopLeagues.prototype.sort = function() {
      this.leagues = _.sortBy(this.leagues, function(league) {
        return _.str.toNumber(league[this.stats]) * -1;
      }, this);

      ga('send', 'event', 'Top Leagues', 'Sort by average ' + this.statsLabel(), Cookie.get('my_character'));

      _.each(this.leagues, function(league, i) {
        league.leaderboardRank = i + 1;
      });
    };

    TopLeagues.prototype.statsLabel = function() {
      if (this.stats === 'avgSkillPoints') return 'skill points';
      if (this.stats === 'avgPveCr') return 'PvE CR';
      if (this.stats === 'avgPvpCr') return 'PvP CR';
    };

    TopLeagues.prototype.saveOptions = function() {
      Cookie.set('topleagues_stats', this.stats);
    };

    TopLeagues.prototype.load = function(characters) {
      this.saveOptions();

      var topLeagues = this;
      var fakeLeagueId = 0;
      var uniqueLeagues = _.unique(_.map(characters, function(character) {
        return character.league || { id: --fakeLeagueId };
      }), 'id');

      _.each(uniqueLeagues, function(uniqueLeague) {
        var params = {
          name: uniqueLeague.name,
          world: uniqueLeague.world,
          silent: true
        };

        LeagueService.findOne(params, function(league) {
          if (league.members.length >= 10 && league.avgSkillPoints >= 1 && league.avgPveCr >= 1 && league.avgPvpCr >= 1) {
            topLeagues.leagues.push(league);
            topLeagues.sort();
          }
        });
      });

      return this;
    };

    return TopLeagues;
  }

})();
