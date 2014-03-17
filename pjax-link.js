/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

PJAX.link = {

  /**
   * Create event handlers for links with PJAX routing e.g. $('a[pjax-route]')
   * @param {string} containerId is HTML id of current PJAX container
   * @param {object} config contains the route definitions.
   *   See PJAX.link.getRouteUrlAndContainer for details.
   */

  pjaxLinkRoutes: function pjaxLinkRoutes (containerId, config) {

    $('#' + containerId).find('a[pjax-route]').click(function (event) {
      event.stopPropagation();
      event.preventDefault();

      var urlAndContainer = PJAX.link.getRouteUrlAndContainer(
        $(event.target).attr('pjax-route'), config);
      $.pjax({
        url: urlAndContainer[0],
        container: urlAndContainer[1] || '#' + containerId });
    });
  },

  /**
   * Convert route name to its URL and target PJAX container
   * @param {string} routeName
   * @param {object} config contains route definitions
   *
   * config = {
   *   data: { account: 123},
   *   qs: {},
   *   hash: {},
   *   routes: {
   *    screen1: {
   *      path: '/other/screen1?field9=9999',
   *      paramsQs: ['region', 'club', 'account']
   *      button: 'activate', // '_button' not added if no property or if empty
   *      container: 'pjax-container'  // defaults to ''
   *    }
   *   }
   * };
   *
   * Assume HTML tags with names region & club,
   * then route 'screen1' returns [
   *    '/other/screen1?field9=9999&region=r2&club[0]=club5&club[1]=club7&
   *    account=123&_button=activate', ''
   *    ]
   *
   * The <select name="club" multiple> results in either 'club=club5' or
   * 'club[0]=club5&club[1]=club7' depending on the number of options selected.
   *
   * Throws if routeName falsey or not in config.routes.
   */

  getRouteUrlAndContainer: function (routeName, config) {
    var pjaxLink = PJAX.link,
      route = pjaxLink.getObjProp(config, 'routes', routeName);
    if (!route) { return ['', ''] }

    var qs = '';
    [ pjaxLink.stringifyParams(
      pjaxLink.getObjProp(config, 'routes', routeName, 'paramsQs') || [],
      config, routeName),
      route.button ? '_button=' + route.button : '',
      pjaxLink.getClientWidths()
    ].forEach(function (part) {
        qs += (qs && part ? '&' : '') + part;
      });
    var url = (route.path || '') + (qs ? '?' + qs : '');

    return [url, route.container || ''];
  },

  stringifyParams: function stringifyParams (names, config, routeName) {
    var obj = {};
    if (typeof names === 'undefined') { return obj; }

    (typeof names === 'string' ? [names] : names).forEach(function (name) {
      var value = PJAX.link.getParam(name, config, routeName, true);
      if (typeof value !== 'undefined') { obj[name] = value; }
    });

    return PJAX.qs.stringifyQs(obj);
  },


  /**
   * Return the value of 'name' when present.
   * Lookup is performed in the following order:
   * 1. HTML                  el's name attr = 'name'  (when ifTags = true)
   * 2. PJAX.data[routeName]  server's controller data (when routeName truesy)
   * 3. config.hash           parsed URL hash          (when config is truesy)
   * 4. config.qs             parsed URL query string  (when config is truesy)
   * 5. config.data           controller's data        (when config is truesy)
   * So default values may be placed in config.data.
   * @param {string} name
   * @param {object} config is optional.
   * @param {string} routeName is optional.
   * @param {boolean} ifTags if HTML to be searched
   * @returns {*} value of name, or undefined
   */

  getParam: function getParam (name, config, routeName, ifTags) {
    var getObjProp = PJAX.link.getObjProp,
      value;

    if (ifTags) {
      value = $('[name=' + name + ']').val();
      if (typeof value !== 'undefined') { return value; }
    }

    if (routeName) {
      value = getObjProp(PJAX, 'data', routeName, name);
      if (typeof value !== 'undefined') { return value; }
    }

    if (config) {
      if (config.hash) {
        value = getObjProp(config, 'hash', name);
        if (typeof value !== 'undefined') { return value; }
      }
      if (config.qs) {
        value = getObjProp(config, 'qs', name);
        if (typeof value !== 'undefined') { return value; }
      }
      if (config.data) {
        value = getObjProp(config, 'data', name);
        if (typeof value !== 'undefined') { return value; }
      }
    }

    return undefined;
  },

  // get a.b.c.d without worrying about existence
  getObjProp: function getObjProp (obj) {
    var value = obj;

    for (var i = 1, len = arguments.length; i < len; i += 1) {
      if (typeof value[arguments[i]] === 'undefined') { return undefined; }
      value = value[arguments[i]];
    }

    return value;
  },

  getClientWidths: function getClientWidths () {
    return '_widths=' + $(window).width() + ',' + $(document).width();
  }
};