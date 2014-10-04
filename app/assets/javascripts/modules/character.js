(function() {
  var wavedox = angular.module('wavedox');

  // Character Ctrl

  CharacterCtrl.$inject = ['$scope', '$routeParams', 'CharacterService', 'ProfileService'];
  wavedox.controller('CharacterCtrl', CharacterCtrl);

  function CharacterCtrl($scope, $routeParams, CharacterService, ProfileService) {
    var params = {
      name: $routeParams.name,
      world: $routeParams.world
    };

    CharacterService.findOne(params, function(character) {
      $scope.character = character;
    });

    $scope.isMyProfile = function() {
      return ProfileService.isMyProfile();
    };

    $scope.saveProfile = function() {
      ProfileService.saveProfile($scope.character);
    };

    $scope.unlinkProfile = function() {
      ProfileService.unlinkProfile();
    };
  }

  // Character Model

  CharacterFactory.$inject = ['Census'];
  wavedox.factory('Character', CharacterFactory);

  function CharacterFactory(Census) {
    Character.parse = parseCharacter;
    return Character;

    function Character() {
      this.hasControllerRole = function() {
        return _.include(['Gadgets', 'Light', 'Mental', 'Munitions', 'Quantum'], this.power);
      };

      this.hasHealerRole = function() {
        return _.include(['Atomic', 'Celestial', 'Electricity', 'Nature', 'Sorcery'], this.power);
      };

      this.hasTankRole = function() {
        return _.include(['Earth', 'Experimental Serums', 'Fire', 'Ice', 'Rage'], this.power);
      };
    }

    // Parser

    function parseCharacter(soe, soeLeague) {
      var c = new Character();

      // Overview

      c.id = soe.character_id;
      c.name = soe.name;
      c.league = _.getPath(soeLeague, 'name');
      c.faction = _.getPath(soe, 'alignment_id_join_alignment.name.en');
      c.origin = _.getPath(soe, 'origin_id_join_origin.name.en');

      c.mentor = Census.mentors[c.faction.toLowerCase()][c.origin.toLowerCase()];
      c.power = _.getPath(soe, 'power_type_id_join_power_type.name.en');
      c.movement = _.getPath(soe, 'movement_mode_id_join_movement_mode.name.en');
      c.weapon = _.getPath(soe, 'power_source_id_join_power_source.name.en');
      c.personality = _.getPath(soe, 'personality_id_join_personality.name.en');
      c.gender = _.str.capitalize(_.getPath(soe, 'gender_id_join_gender.name'));
      c.world = Census.worlds.reverse[_.str.toNumber(soe.world_id)];
      c.lastLocation = _.getPath(soe, 'region_id_join_region.name.en');

      // Progress

      c.level = _.str.toNumber(soe.level);
      c.pveCr = _.str.toNumber(soe.combat_rating);
      c.pvpCr = _.str.toNumber(soe.pvp_combat_rating);
      c.skillPoints = _.str.toNumber(soe.skill_points);
      c.maxFeats = _.str.toNumber(soe.max_feats);

      // Stats

      c.currentHealth = _.str.toNumber(soe.current_health);
      c.maxHealth = _.str.toNumber(soe.max_health);
      c.currentPower = _.str.toNumber(soe.current_power);
      c.maxPower = _.str.toNumber(soe.max_power);
      c.defense = _.str.toNumber(soe.defense);
      c.dominance = _.str.toNumber(soe.dominance);
      c.might = _.str.toNumber(soe.might);
      c.precision = _.str.toNumber(soe.precision);
      c.restoration = _.str.toNumber(soe.restoration);
      c.toughness = _.str.toNumber(soe.toughness);
      c.vitalization = _.str.toNumber(soe.vitalization);

      // Paths

      c.image = 'http://census.soe.com/files/dcuo/images/character/paperdoll/' + c.id;
      if (c.league) c.leaguePath = '/worlds/' + c.world + '/leagues/' + c.league.toLowerCase();
      c.path = '/worlds/' + c.world + '/characters/' + c.name.toLowerCase();
      c.suggestedFeatsPath = c.path + '/suggested-feats';

      return c;
    }
  }

  // Character Service

  CharacterService.$inject = ['Census', 'Character'];
  wavedox.service('CharacterService', CharacterService);

  function CharacterService(Census, Character) {
    return {
      findOne: function(params, callback) {
        //var id = ???
        var name = params.name;
        var worldId = Census.worlds[params.world];

        var path = '/character'
                 // + '?character_id=' + id
                 + '?name=' + name + '&world_id=' + worldId // not id
                 + '&c:lang=en&c:case=false&c:join='
                 + 'alignment^on:alignment_id^to:alignment_id^show:name.en,'
                 + 'gender^on:gender_id^to:gender_id^show:name,'
                 + 'guild_roster^on:character_id^to:character_id(guild^terms:world_id=' + worldId + '^show:name),'
                 + 'movement_mode^on:movement_mode_id^to:movement_mode_id^show:name.en,'
                 + 'origin^on:origin_id^to:origin_id^show:name.en,'
                 + 'personality^on:personality_id^to:personality_id^show:name.en,'
                 + 'power_source^on:power_source_id^to:power_source_id^show:name.en,'
                 + 'power_type^on:power_type_id^to:power_type_id^show:name.en,'
                 + 'region^on:region_id^to:region_id';

        Census.get(path, function(response) {
          var list = response['character_list'] || [];
          var hash = _.first(list) || {};
          if (!hash) return callback();

          var league = _.getPath(hash, 'character_id_join_guild_roster.guild_id_join_guild');
          var character = Character.parse(hash, league);
          callback(character);

          var completedFeatPath = '/characters_completed_feat?character_id=' + character.id;
          Census.count(completedFeatPath, function(response) {
            character.featsCompleted = response.count;
          });
        });
      },

      findAll: function(params, callback) {
      }
    };
  }
})();
