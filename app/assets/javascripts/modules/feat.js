(function() {
  var wavedox = angular.module('wavedox');

  // SuggestedFeats Ctrl

  SuggestedFeatsCtrl.$inject = ['$scope', '$routeParams', 'SuggestedFeatsService', 'YouTube'];
  wavedox.controller('SuggestedFeatsCtrl', SuggestedFeatsCtrl);

  function SuggestedFeatsCtrl($scope, $routeParams, SuggestedFeatsService, YouTube) {
    $('body').animate({ scrollTop: 0 }, 'fast');
    ga('send', 'pageview');

    $scope.showBases = true;
    $scope.showCollectible = true;
    $scope.showDLC = true;
    $scope.showPvP = true;
    $scope.showRace = true
    $scope.showRD = true
    $scope.showSeasonal = true;
    $scope.showStyle = true

    $scope.toggle = function(key) {
      $scope[key] = !$scope[key];
    };

    $scope.isVisible = function(feat) {
      if (!$scope.showBases && feat.categoryPath[0].name === 'Bases') return false;
      if (!$scope.showCollectible && feat.categoryPath[0].name === 'General' && feat.categoryPath[1].name === 'Collectibles') return false;
      if (!$scope.showDLC && feat.categoryPath[0].name === 'DLC') return false;
      if (!$scope.showPvP && feat.categoryPath[0].name === 'Player vs. Player') return false;
      if (!$scope.showRace && feat.categoryPath[0].name === 'General' && feat.categoryPath[1].name === 'Races') return false;
      if (!$scope.showRD && feat.categoryPath[0].name === 'R&D') return false;
      if (!$scope.showSeasonal && feat.categoryPath[0].name === 'Seasonal') return false;
      if (!$scope.showStyle && feat.categoryPath[0].name === 'Styles') return false;
      return true;
    };

    $scope.countSuggestedFeats = function() {
      return $('.feat:visible').size();
    };

    $scope.trackingLabel = function(feat) {
      return '(' + $scope.character.skillPoints + ' SP) ' + feat.name;
    };

    $scope.track = function(category, action, label) {
      ga('send', 'event', category, action, label);
    };

    $scope.lookup = function(feat) {
      feat.hasLookup = !feat.hasLookup;
      if (!feat.hasLookup) return;
      YouTube.search('DCUO Feat ' + feat.name, function(videos) {
        feat.videos = videos;
        feat.videoIndex = 0;
      });
    };

    SuggestedFeatsService.load($routeParams.world, $routeParams.name, function(character, playerBase, suggestedFeats) {
      $scope.character = character;
      $scope.playerBase = playerBase;
      $scope.suggestedFeats = suggestedFeats;
    });
  }

  // Feat Model

  FeatFactory.$inject = [];
  wavedox.factory('Feat', FeatFactory);

  function FeatFactory() {
    Feat.parse = parseFeat;
    return Feat;

    function Feat() {
      this.isAvailableFor = function(character) {
        if (this.hasBeenRemovedFromGame()) return false;
        if (!this.predicate) return true;
        if (validPredicate(this.predicate, character)) return true;
        return false;
      };

      this.hasBeenRemovedFromGame = function() {
        return this.featId === '1264271';
      };

      this.nextVideo = function() {
        this.videoIndex++;
      };

      this.prevVideo = function() {
        this.videoIndex--;
      };
    }

    function validPredicate(predicate, character) {
        if (_.has(predicate, 'False')) {
          return false;
        }

        // Logical groups

        if (_.has(predicate, 'AND')) {
          return _.every(_.keys(predicate.AND), function(key) {
            return validPredicate(_.pick(predicate.AND, key), character);
          });
        }

        if (_.has(predicate, 'OR')) {
          return _.any(_.keys(predicate.OR), function(key) {
            return validPredicate(_.pick(predicate.OR, key), character);
          });
        }

        // Level

        if (_.has(predicate, 'LevelAtleast')) {
          return character.level >= parseInt(predicate.LevelAtleast.level, 10);
        }

        // Faction

        if (_.has(predicate, 'IsHero')) {
          return character.faction === 'Hero';
        }

        if (_.has(predicate, 'IsVillain')) {
          return character.faction === 'Villain';
        }

        // Movement

        if (_.has(predicate, 'HasMovementMode')) {
          return character.movement === predicate.HasMovementMode.mode;
        }

        // Origin

        if (_.has(predicate, 'IsMagic')) {
          return character.origin === 'Magic';
        }

        if (_.has(predicate, 'IsMeta')) {
          return character.origin === 'Meta';
        }

        if (_.has(predicate, 'IsTech')) {
          return character.origin === 'Tech';
        }

        // Role

        if (_.has(predicate, 'HasControllerRole')) {
          return character.hasControllerRole();
        }

        if (_.has(predicate, 'HasHealerRole')) {
          return character.hasHealerRole();
        }

        if (_.has(predicate, 'HasTankRole')) {
          return character.hasTankRole();
        }

        // HasDLC, HasQuestID, HasCompletedQuestID

        return true;
    }

    function parseFeat(soeFeat) {
      var feat = new Feat();
      feat.featId = soeFeat.feat_id;
      feat.featCategoryId = soeFeat.feat_category_id;
      feat.name = soeFeat.name && soeFeat.name.en;
      feat.description = soeFeat.description && soeFeat.description.en;

      if (soeFeat.predicate) {
        var dlcMap = {
          DLC1: 'Fight for the Light',
          DLC2: 'Lightning Strikes',
          DLC3: 'The Battle for Earth',
          DLC4: 'The Last Laugh',
          DLC5: 'Hand of Fate',
          DLC6: 'Home Turf',
          DLC7: 'Origin Crisis',
          DLC8: 'Sons of Trigon',
          DLC9: 'War of the Light Part I',
          DLC10: 'Amazon Fury Part I',
          DLC11: 'Halls of Power Part I',
          DLC12: 'War of the Light Part II'
        };

        feat.dlc = parseDLC(soeFeat.predicate);
        if (feat.dlc) feat.dlcName = dlcMap[feat.dlc];
        feat.predicate = parsePredicate(soeFeat.predicate);
      }

      return feat;
    }

    function parseDLC(soePredicate) {
      var match = soePredicate.match(/Has(DLC\d+)/);
      if (match) return match[1];
    }

    function parsePredicate(soePredicate) {
      try {
        var normalizedXml = soePredicate
            .replace(/=([^",\/\s]+)/g, '="$1"')
            .replace(/isHero/g, 'IsHero')
            .replace(/isVillain/g, 'IsVillain')
            .replace(/DDPredicate_/g, '');

        var wrappedXml = '<root>' + normalizedXml + '</root>';
        return $.xml2json(wrappedXml);

      } catch (e) {
        return { PREDICATE_PARSE_ERROR: e.toString() };
      }
    }
  }

  // FeatCategory Model

  FeatCategoryFactory.$inject = [];
  wavedox.factory('FeatCategory', FeatCategoryFactory);

  function FeatCategoryFactory() {
    FeatCategory.parse = parseFeatCategory;
    FeatCategory.buildMap = buildFeatCategoryMap;
    return FeatCategory;

    function FeatCategory() {
    }

    function parseFeatCategory(soeFeatCategory) {
      var featCategory = new FeatCategory();
      featCategory.featCategoryId = soeFeatCategory.feat_category_id;
      featCategory.parentCategoryId = soeFeatCategory.parent_category_id;
      featCategory.name = soeFeatCategory.category_name && soeFeatCategory.category_name.en;
      return featCategory;
    }

    function buildFeatCategoryMap(soeFeatCategories) {
      return _.reduce(soeFeatCategories, function(map, soeFeatCategory) {
        var featCategory = FeatCategory.parse(soeFeatCategory);
        map[featCategory.featCategoryId] = featCategory;
        return map;
      }, {});
    }
  }

  // SuggestedFeats Service

  SuggestedFeatsService.$inject = ['$http', 'Census', 'Feat', 'FeatCategory', 'Character'];
  wavedox.service('SuggestedFeatsService', SuggestedFeatsService);

  function SuggestedFeatsService($http, Census, Feat, FeatCategory, Character) {
    return {
      load: function(world, characterName, callback) {
        this.fetchDataPoints(world, characterName, function(dataPoints) {

          var availableFeats = _.filter(dataPoints.allFeats, function(feat) {
            if (_.include(dataPoints.charactersCompleted, feat.featId)) return false;
            if (!feat.isAvailableFor(dataPoints.character)) return false;
            return true;
          });

          var maxAvailable = 0;
          _.each(availableFeats, function(feat) {
            feat.completedCount = dataPoints.completedCounts[feat.featId] || 0;
            if (feat.completedCount > maxAvailable) maxAvailable = feat.completedCount;
          });

          var maxCompleted = _.max(dataPoints.completedCounts);

          var suggestedFeats = _.map(availableFeats, function(feat) {
            feat.potential = Math.ceil(feat.completedCount / maxAvailable * 100);
            feat.playersCompleted = humanizePlayersCompleted(feat.completedCount / maxCompleted * 100);
            feat.categoryPath = buildFeatCategoryPath(dataPoints.featCategoryMap[feat.featCategoryId]);
            return feat;
          });

          function humanizePlayersCompleted(value) {
            if (value < 0.0001) return value.toFixed(5);
            if (value < 0.001) return value.toFixed(4);
            if (value < 0.01) return value.toFixed(3);
            if (value >= 0.01) return value.toFixed(2);
          }

          function buildFeatCategoryPath(featCategory, path) {
            path = path || [];
            path.unshift(featCategory);
            if (featCategory.parentCategoryId) {
              var parentCategory = dataPoints.featCategoryMap[featCategory.parentCategoryId];
              buildFeatCategoryPath(parentCategory, path);
            }
            return path;
          }

          callback(dataPoints.character, maxCompleted, _.sortBy(suggestedFeats, function(feat) {
            return -1 * feat.completedCount;
          }));

        });
      },

      fetchDataPoints: function(world, characterName, callback) {
        var dataPoints = {};
        var characterQuery;
        var worldId = Census.worlds[world];

        if (characterName.match(/^id:/)) {
          characterQuery = 'character_id=' + _.last(characterName.split('id:'));
        } else {
          characterQuery = 'name=' + characterName + '&world_id=' + worldId;
        }

        var characterUrl = '/character?' + characterQuery +
            '&c:lang=en&c:case=false&c:join=' +
            'alignment^on:alignment_id^to:alignment_id^show:name.en,' +
            'movement_mode^on:movement_mode_id^to:movement_mode_id^show:name.en,' +
            'origin^on:origin_id^to:origin_id^show:name.en,' +
            'power_type^on:power_type_id^to:power_type_id^show:name.en';

        Census.get(characterUrl, function(response) {
          process('character', Character.parse(_.first(response['character_list'])));

          var characterId = dataPoints.character.id;
          var charactersCompletedUrl = '/characters_completed_feat?character_id=' + characterId + '&c:limit=9999&c:show=feat_id';
          Census.get(charactersCompletedUrl, function(response) {
            process('charactersCompleted', _.map(response['characters_completed_feat_list'], function(soeFeat) {
              return soeFeat.feat_id;
            }));
          });

        });

        var allFeatsUrl = '/feat?c:limit=9999&c:show=feat_id,feat_category_id,name.en,description.en,predicate';
        Census.get(allFeatsUrl, function(response) {
          process('allFeats', _.map(response['feat_list'], function(soeFeat) {
            return Feat.parse(soeFeat);
          }));
        });

        var allFeatCategoriesUrl = '/feat_category?c:limit=9999&c:lang=en&c:show=feat_category_id,parent_category_id,category_name';
        Census.get(allFeatCategoriesUrl, function(response) {
          process('featCategoryMap', FeatCategory.buildMap(response['feat_category_list']));
        });

        var completedCountsUrl = '/api/feat-completed-count.json';
        $http.get(completedCountsUrl).success(function(featCompletedCount) {
          process('completedCounts', featCompletedCount);
        });

        function process(key, value) {
          dataPoints[key] = value;
          if (_.size(dataPoints) < 5) return;
          callback(dataPoints);
        }
      }
    };
  }

})();
