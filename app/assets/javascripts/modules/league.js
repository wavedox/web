(function() {
  var wavedox = angular.module('wavedox');

  // League Ctrl

  LeagueCtrl.$inject = ['$scope', '$routeParams', 'LeagueService'];
  wavedox.controller('LeagueCtrl', LeagueCtrl);

  function LeagueCtrl($scope, $routeParams, LeagueService) {
    var params = {
      name: $routeParams.name,
      world: $routeParams.world
    };

    LeagueService.findOne(params, function(league) {
      $scope.league = league;
    });
  }

  // League Model

  LeagueFactory.$inject = ['Census', 'Character'];
  wavedox.factory('League', LeagueFactory);

  function LeagueFactory(Census, Character) {
    League.parse = parseLeague;
    League.parseRoster = parseRoster;
    League.ranks = ranks();
    return League;

    function League() {
    }

    // Ranks

    function ranks() {
      return {
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
      }
    }

    // Parse League

    function parseLeague(soe) {
      var c = new League();

      // Overview

      c.id = soe.guild_id;
      c.name = soe.name;

      // Paths

      c.path = '/worlds/' + c.world + '/leagues/' + c.name.toLowerCase();

      return c;
    }

    // Parse Roster

    function parseRoster(list) {
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
    }
  }

  // League Service

  LeagueService.$inject = ['Census', 'League'];
  wavedox.service('LeagueService', LeagueService);

  function LeagueService(Census, League) {
    return {
      findOne: function(params, callback) {
        var name = params.name;
        var worldId = Census.worlds[params.world];

        var path = '/guild'
                 + '?name=' + name + '&world_id=' + worldId
                 + '&c:lang=en&c:case=false&c:show=guild_id,name,world_id';

        Census.get(path, function(response) {
          var list = response['guild_list'] || [];
          var hash = _.first(list) || {};
          if (!hash) return callback();

          var league = League.parse(hash);

          var rosterPath = '/guild_roster?guild_id=' + league.id
                         + '&world_id=' + worldId + '&c:lang=en&c:limit=9999&c:show=character_id,rank&c:join='
                         + 'character^on:character_id^to:character_id'
                         + "^show:name'level'combat_rating'pvp_combat_rating'skill_points'power_type_id'alignment_id'world_id"
                         + '(power_type^on:power_type_id^to:power_type_id^show:name.en,'
                         + 'alignment^on:alignment_id^to:alignment_id^show:name.en)'

          Census.get(rosterPath, function(rosterResponse) {
            var rosterList = rosterResponse['guild_roster_list'] || [];
            league.members = League.parseRoster(rosterList);
          })

          callback(league);
        });
      },

      findAll: function(params, callback) {
      }
    };
  }

})();
