(function() {
  var wavedox = angular.module('wavedox');

  // League Ctrl

  LeagueCtrl.$inject = ['$scope', '$routeParams', 'LeagueService'];
  wavedox.controller('LeagueCtrl', LeagueCtrl);

  function LeagueCtrl($scope, $routeParams, LeagueService) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.filterModel = {};
    $scope.showImages = true;

    $scope.params = {
      name: $routeParams.name,
      world: $routeParams.world
    };

    $scope.track = function(action, info) {
      ga('send', 'event', 'League', action, info);
    };

    $scope.orderBy = {
      key: 'rank',
      label: 'rank',

      set: function(key, label) {
        this.key = key;
        this.label = label;
        $scope.track('Sort by', label);
      },

      keys: function() {
        return [this.key, 'name'];
      }
    };

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };

    LeagueService.findOne($scope.params, function(league) {
      $scope.league = league || {};
    });
  }

  // League Search Ctrl

  LeagueSearchCtrl.$inject = ['$scope', '$routeParams', '$location', 'LeagueService'];
  wavedox.controller('LeagueSearchCtrl', LeagueSearchCtrl);

  function LeagueSearchCtrl($scope, $routeParams, $location, LeagueService) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.hideOutdated = true;

    $scope.params = {
      name: $location.search().keyword,
      world: $routeParams.world,

      worldLabel: function() {
        if (this.world === 'all') return 'all worlds';
        return this.world && this.world.toUpperCase();
      }
    };

    LeagueService.findAll($scope.params, function(leagues) {
      $scope.leagues = leagues;
    });
  }

  // League Model

  LeagueFactory.$inject = ['Census', 'Character'];
  wavedox.factory('League', LeagueFactory);

  function LeagueFactory(Census, Character) {

    function League() {
    }

    // Calculate Averages

    League.prototype.calculateAverages = function() {

      var pveCrBase = 0,
          pvpCrBase = 0,
          skillPointsBase = 0;

      this.avgPveCr = 0;
      this.avgPvpCr = 0;
      this.avgSkillPoints = 0;

      _.each(this.members, function(member) {
        if (member.level < 30) return;

        if (member.pveCr > 0) {
          this.avgPveCr += member.pveCr;
          pveCrBase++;
        }

        if (member.pvpCr > 0) {
          this.avgPvpCr += member.pvpCr;
          pvpCrBase++;
        }

        if (member.skillPoints > 0) {
          this.avgSkillPoints += member.skillPoints;
          skillPointsBase += 1;
        }
      }, this);

      this.avgPveCr = Math.round(this.avgPveCr / (pveCrBase || 1));
      this.avgPvpCr = Math.round(this.avgPvpCr / (pvpCrBase || 1));
      this.avgSkillPoints = Math.round(this.avgSkillPoints / (skillPointsBase || 1));
    };

    // Ranks

    League.ranks = {
      0: '★★',
      1: '★||||',
      2: '★|||',
      3: '★||',
      4: '★|',
      5: '★',
      6: '||||',
      7: '|||',
      8: '||',
      9: '|'
    };

    // Parse League

    League.parse = function(soe) {
      if (!soe) return;

      var l = new League();
      l.id = soe.guild_id;
      l.name = soe.name;
      l.world = soe.world_id && Census.worlds.reverse[_.str.toNumber(soe.world_id)];
      l.path = encodeURI('/worlds/' + l.world + '/leagues/' + l.name.toLowerCase());
      return l;
    };

    // Parse Roster

    League.parseRoster = function(list) {
      var characters = [];

      _.each(list, function(joinMember) {
        var member = joinMember.character_id_join_character;

        if (member) {
          var character = Character.parse(_.extend(member, { character_id: joinMember.character_id }));
          character.rank = _.str.toNumber(joinMember.rank);
          character.rankDisplay = League.ranks[character.rank];
          characters.push(character);
        }
      });

      return _.sortBy(characters, function(c) {
        return [c.rank, c.name];
      });
    };

    return League;
  }

  // League Service

  LeagueService.$inject = ['Census', 'League'];
  wavedox.service('LeagueService', LeagueService);

  function LeagueService(Census, League) {
    return {

      // Find one

      findOne: function(params, callback) {
        var name = params.name;
        var worldId = Census.worlds[params.world];

        // Fetch league

        var path = '/guild?name=' + name
                 + '&world_id=' + worldId
                 + '&c:lang=en'
                 + '&c:case=false'
                 + '&c:show=guild_id,name,world_id';

        Census.get(path, function(response) {
          var list = response['guild_list'] || [];
          var hash = _.first(list) || {};
          if (_.isEmpty(hash)) return callback();

          var league = League.parse(_.extend(hash, { world_id: worldId }));

          // Fetch members

          var rosterPath = '/guild_roster?guild_id=' + league.id
                         + '&world_id=' + worldId
                         + '&c:lang=en'
                         + '&c:limit=100000'
                         + '&c:show=character_id,rank'
                         + '&c:join=character^on:character_id^to:character_id'
                         + "^show:name'level'combat_rating'pvp_combat_rating'skill_points'power_type_id'alignment_id'world_id"
                         + '(power_type^on:power_type_id^to:power_type_id^show:name.en,'
                         + 'alignment^on:alignment_id^to:alignment_id^show:name.en)';


          Census.get(rosterPath, function(rosterResponse) {
            var rosterList = rosterResponse['guild_roster_list'] || [];
            league.members = League.parseRoster(rosterList);
            league.faction = league.members[0] && league.members[0].faction;
            league.calculateAverages();
            callback(league);
          });
        }, params.silent);
      },

      // Find all

      findAll: function(params, callback) {
        var name = params.name;
        var worldId = Census.worlds[params.world] || '';

        var path = '/guild?name=*' + name
                 + (worldId && '&world_id=' + worldId)
                 + '&c:lang=en'
                 + '&c:case=false'
                 + '&c:limit=100000'
                 + '&c:sort=name'
                 + '&c:show=guild_id,name,world_id';

        Census.get(path, function(response) {
          var list = response['guild_list'] || [];

          var leagues = _.map(list, function(hash) {
            return League.parse(hash);
          });

          callback(_.filter(leagues, function(league) {
            return league.name.indexOf('_deleted') === -1;
          }));
        });
      }
    };
  }

})();
