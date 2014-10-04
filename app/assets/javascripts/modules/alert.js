(function() {
  var wavedox = angular.module('wavedox');

  // Alert Model

  AlertModelFactory.$inject = [];
  wavedox.factory('AlertModel', AlertModelFactory);

  var alertTitleMap = {
    success: 'Oh Yeah',
    primary: 'Info',
    danger: 'Oh Snap'
  };

  var alertIconStyleMap = {
    success: 'fa-check-circle',
    primary: 'fa-info-circle',
    danger: 'fa-exclamation-circle'
  };

  function AlertModelFactory() {
    return AlertModel;

    function AlertModel(style, message, alerts) {
      this.style = style;
      this.message = message;
      this.alerts = alerts;

      this.title = function() {
        return alertTitleMap[this.style];
      };

      this.iconStyle = function() {
        return alertIconStyleMap[this.style];
      };

      this.flash = function() {
        $('#social-box').css('opacity', 0).fadeTo('slow', 1);
      };

      this.dismiss = function() {
        var index = this.alerts.indexOf(this);
        this.alerts.splice(index, 1);
        this.flash();
      };

      this.flash();
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
        this.alerts.push(new AlertModel('primary', message, this.alerts));
      },

      error: function(message, data, label) {
        this.clear();
        this.alerts.push(new AlertModel('danger', message, this.alerts));
        if (Env.isDev()) console.error(label || 'Alert', data);
      },

      clear: function() {
        this.alerts.splice(0, this.alerts.length);
      }
    };
  }

})();
