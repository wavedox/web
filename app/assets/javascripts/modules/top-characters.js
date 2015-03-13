(function() {
  var wavedox = angular.module('wavedox');

  // Top Characters Ctrl

  TopCharactersCtrl.$inject = ['$scope', 'TopCharacters', 'Cookie'];
  wavedox.controller('TopCharactersCtrl', TopCharactersCtrl);

  function TopCharactersCtrl($scope, TopCharacters, Cookie) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.topCharacters = new TopCharacters().load();
    $scope.showImages = true;

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
      ga('send', 'event', 'Top Characters', 'Filter by', value);
    };

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };
  }

  // Top Characters Model

  TopCharactersFactory.$inject = ['Census', 'Character', 'League', 'Cookie'];
  wavedox.factory('TopCharacters', TopCharactersFactory);

  function TopCharactersFactory(Census, Character, League, Cookie) {

    function TopCharacters() {
      // Migrate cookies
      this.stats = Cookie.get('top_characters_stats') || Cookie.get('leaderboard_stats') || Cookie.get('leaderboard_0_stats') || 'skill_points';
      this.world = Cookie.get('top_characters_world') || Cookie.get('leaderboard_world') || Cookie.get('leaderboard_0_world') || 'usps';
      this.characters = [];

      // Clean up deprecated cookies
      Cookie.remove('leaderboard_stats');
      Cookie.remove('leaderboard_world');
      Cookie.remove('leaderboard_0_stats');
      Cookie.remove('leaderboard_0_world');
      Cookie.remove('leaderboard_1_stats');
      Cookie.remove('leaderboard_1_world');
    }

    TopCharacters.prototype.set = function(key, value) {
      this.characters = [];
      this[key] = value;
      this.load();
    };

    TopCharacters.prototype.statsCamel = function() {
      if (this.stats === 'combat_rating') return 'pveCr';
      if (this.stats === 'pvp_combat_rating') return 'pvpCr';
      return _.str.camelize(this.stats);
    };

    TopCharacters.prototype.statsLabel = function() {
      if (this.stats === 'combat_rating') return 'PvE CR';
      if (this.stats === 'pvp_combat_rating') return 'PvP CR';
      var strip = this.stats.replace(/^max_/, '');
      return _.str.humanize(strip).toLowerCase();
    };

    TopCharacters.prototype.worldLabel = function() {
      if (this.world === 'all') return 'all worlds';
      return this.world.toUpperCase();
    }

    TopCharacters.prototype.saveOptions = function() {
      Cookie.set('top_characters_stats', this.stats);
      Cookie.set('top_characters_world', this.world);
    };

    TopCharacters.prototype.load = function() {
      this.saveOptions();
      var topCharacters = this;
      var worldId = Census.worlds[this.world] || '';

      ga('send', 'event', 'Top Characters', 'Top ' + this.statsLabel() + ' in ' + this.worldLabel(), Cookie.get('my_character'));

      // To be excluded from leaderboards for a fair competition
      var soeCharacterIds = [
        '562958545312502' // EIIektra - TeamEpicFail
      ];

      var path = '/character?' + this.stats + '=%3C1000000'
               + '&deleted=false'
               + '&combat_rating=%3E100'
               + '&skill_points=%3E100'
               + (worldId && ('&world_id=' + worldId))
               + '&c:show=character_id,name,' + this.stats + ',world_id,combat_rating,pvp_combat_rating,skill_points'
               + "&c:join=guild_roster^on:character_id^to:character_id(guild^show:guild_id'name)"
               + '&c:sort=' + this.stats + ':-1,name'
               + '&c:limit=' + (soeCharacterIds.length + 100);

      Census.get(path, function(response) {
        var filteredCharacterList = _.filter(response['character_list'] || [], function(hash) {
          return !_.contains(soeCharacterIds, hash['character_id']);
        }).slice(0, 100);

        topCharacters.characters = _.map(filteredCharacterList, function(hash, i) {
          var leagueHash = _.getPath(hash, 'character_id_join_guild_roster.guild_id_join_guild');
          var league = League.parse(_.extend(leagueHash, { world_id: hash.world_id }));
          var character = Character.parse(hash, league);

          character.topRank = i + 1;
          character.leagueName = league && league.name;
          return character;
        });
      });

      return this;
    };

    return TopCharacters;
  }

})();
