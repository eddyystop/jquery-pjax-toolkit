/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

PJAX.feature = {

// Add width and client feature to URL
  addClientInfo: function addClientInfo (url) {
    var pjaxLink = PJAX.link,
      qs = '';

    [ pjaxLink.getClientWidths(),
      PJAX.feature.getFeatures()
    ].forEach(function (part) {
        qs += (qs && part ? '&' : '') + part;
      });

    return (url || '') + (qs ? '?' + qs : '');
  },

  getFeatures: function getFeatures () {
    return '_features=' + JSON.stringify(PJAX.feature.getModernizrFeatures());
  },

  /**
   * convert Modernizr object into a format more suitable for transfer
   * @returns {object} converted Modernizr object
   */

  getModernizrFeatures: function getModernizrFeatures () {
    var features = { _base: [] },
      _base = features._base;

    for (var feature in Modernizr) {
      if (Modernizr.hasOwnProperty(feature)) {
        var value = Modernizr[feature];

        switch (typeof value) {
          case 'boolean':
            if (value) { _base.push(feature); }
            break;
          case 'object':
            var subFeatures = [];
            for (var subFeature in value) {
              if (value.hasOwnProperty(subFeature)) {
                var value1 = value[subFeature];
                if (typeof value1 === 'boolean' && value1) {
                  subFeatures.push(subFeature);
                }
              }
            }
            if (subFeatures.length) { features[feature] = subFeatures; }
            break;
          default:
            break;
        }
      }
    }

    return features;
  }
};