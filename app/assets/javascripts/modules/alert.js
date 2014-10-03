(function() {
  var wavedox = angular.module('wavedox');

  // Alert Model

  AlertModelFactory.$inject = [];
  wavedox.factory('AlertModel', AlertModelFactory);

  var alertTitleMap = {
    success: 'Oh Yeah',
    info: 'Info',
    error: 'Oh Snap'
  };

  var alertIconStyleMap = {
    success: 'fa-check-circle',
    info: 'fa-info-circle',
    error: 'fa-exclamation-circle'
  };

  function AlertModelFactory() {
    return AlertModel;

    function AlertModel(level, message, alerts) {
      this.level = level;
      this.message = message;
      this.alerts = alerts;

      this.title = function() {
        return alertTitleMap[this.level];
      };

      this.iconStyle = function() {
        return alertIconStyleMap[this.level];
      };

      this.dismiss = function() {
        var index = this.alerts.indexOf(this);
        this.alerts.splice(index, 1);
      };
    }
  }

  // Alert Service

  Alert.$inject = ['AlertModel', 'Env'];
  wavedox.service('Alert', Alert);

  function Alert(AlertModel, Env) {
    return {
      alerts: [],

      success: function(message) {
        this.clear();
        this.alerts.push(new AlertModel('success', message, this.alerts));
      },

      info: function(message) {
        this.clear();
        this.alerts.push(new AlertModel('info', message, this.alerts));
      },

      error: function(message, data, label) {
        this.clear();
        this.alerts.push(new AlertModel('error', message, this.alerts));
        if (Env.isDev()) console.error(label || 'Alert', data);
      },

      clear: function() {
        this.alerts.splice(0, this.alerts.length);
      }
    };
  }

})();
