(function() {
  var wavedox = angular.module('wavedox');

  // Alert Model

  AlertModelFactory.$inject = [];
  wavedox.factory('AlertModel', AlertModelFactory);

  var alertTitleMap = {
    success: 'Oh Yeah',
    primary: 'Hey',
    danger: 'Oh Snap'
  };

  var alertIconStyleMap = {
    success: 'fa-check-circle',
    primary: 'fa-info-circle',
    danger: 'fa-exclamation-circle'
  };

  function AlertModelFactory() {

    function AlertModel(style, message, alerts) {
      this.style = style;
      this.message = message;
      this.alerts = alerts;
      this.flash();
    }

    AlertModel.prototype.title = function() {
      return alertTitleMap[this.style];
    };

    AlertModel.prototype.iconStyle = function() {
      return alertIconStyleMap[this.style];
    };

    AlertModel.prototype.flash = function() {
      $('#social-box').css('opacity', 0).fadeTo('slow', 1);
    };

    AlertModel.prototype.dismiss = function() {
      var index = this.alerts.indexOf(this);
      this.alerts.splice(index, 1);
      this.flash();
    };

    return AlertModel;
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
