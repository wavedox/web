(function() {
  var wavedox = angular.module('wavedox');

  // Profile Service

  ProfileService.$inject = ['Alert', 'Cookie'];
  wavedox.service('ProfileService', ProfileService);

  function ProfileService(Alert, Cookie) {
    return {
      hasProfile: function(type) {
        return !!Cookie.get('my_' + type);
      },

      isMyProfile: function() {
        return Cookie.get('my_character') === location.pathname;
      },

      profileUrl: function(type) {
        var url = Cookie.get('my_' + type);
        ga('send', 'event', 'Profile', 'Show', url);
        return url;
      },

      saveProfile: function(character) {
        ga('send', 'event', 'Profile', 'Save', character.path);
        Cookie.set('my_character', character.path);
        if (character.league) Cookie.set('my_league', character.league.path);
        Alert.success('Your profile has been saved.');
      },

      unlinkProfile: function() {
        ga('send', 'event', 'Profile', 'Unlink', location.pathname);
        Cookie.remove('my_character');
        Cookie.remove('my_league');
        Alert.success('This character has been unlinked from your profile.');
      }
    };
  }

})();
