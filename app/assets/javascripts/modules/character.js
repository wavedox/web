(function() {
  var wavedox = angular.module('wavedox');

  // Character Ctrl

  CharacterCtrl.$inject = ['$scope', 'ProfileService'];
  wavedox.controller('CharacterCtrl', CharacterCtrl);

  function CharacterCtrl($scope, ProfileService) {
    $scope.hasProfile = function() {
      return ProfileService.hasProfile('character');
    };

    $scope.isMyProfile = function() {
      return ProfileService.isMyProfile('character');
    };

    $scope.saveProfile = function() {
      ProfileService.saveProfile('character');
    };

    $scope.unlinkProfile = function() {
      ProfileService.unlinkProfile('character');
    };
  }

  // Character Model

  CharacterFactory.$inject = [];
  wavedox.factory('Character', CharacterFactory);

  function CharacterFactory() {
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

    function parseCharacter(soe) {
      var character = new Character();
      character.characterId = soe.character_id;
      character.name = soe.name;
      character.level = parseInt(soe.level, 10);
      character.skillPoints = parseInt(soe.skill_points, 10);
      character.alignment = soe.alignment_id_join_alignment && soe.alignment_id_join_alignment.name && soe.alignment_id_join_alignment.name.en;
      character.movement = soe.movement_mode_id_join_movement_mode && soe.movement_mode_id_join_movement_mode.name && soe.movement_mode_id_join_movement_mode.name.en;
      character.origin = soe.origin_id_join_origin && soe.origin_id_join_origin.name && soe.origin_id_join_origin.name.en;
      character.power = soe.power_type_id_join_power_type && soe.power_type_id_join_power_type.name && soe.power_type_id_join_power_type.name.en;
      return character;
    }
  }

  // Count completed feats via JSONP

  var baseUrl = 'http://census.soe.com/s:bytecode/json/count/dcuo:v1/characters_completed_feat?character_id=';
  var characterId = $('#character-id').text();

  $.ajax({
    url: baseUrl + characterId,
    dataType: 'jsonp',
    jsonp: 'callback',

    success: function(response) {
      $('#completed-feat-count').text(response.count + ' / ');
    }
  });

})();
