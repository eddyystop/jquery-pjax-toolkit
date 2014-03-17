/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

PJAX.controllers = {};
PJAX.data = {};

PJAX.app = {
  _routesInitialized: [],
  _pathsInitialized: [],
  _lastPjaxUrl: null,
  _lastPjaxContainer: null,
  _pjaxFail: false,

  parseUrl: function parseUrl (url) {
    if (!url) { return [null, null, null]; }
    url = url.replace(/^.*\/\/[^\/]+\//, '');
    return [url].concat(url.split('?'));
  },


  addToolkitHandlers: function addToolkitHandlers (containerId, config) {
    var $container = $('#' + containerId);

    // handlers for <a href="/foo/bar?field1=111" pjax-anchor>this</a>
    $container.pjax('a[pjax-anchor]', '#' + containerId);

    // handlers for <a pjax-route="route1">that</a>
    PJAX.link.pjaxLinkRoutes(containerId, config);

    // handlers for <form pjax-route="screen1" method="POST">
    PJAX.form.initPjaxForm(containerId, config);
  }
};

$(document).on('pjax:success', function ( /* $event, xhr, options */ ) {
  PJAX.app._pjaxFail = false;
});

$(document).on('pjax:error', function ( /* $event, xhr, options */ ) {
  PJAX.app._pjaxFail = true;
});

/**
 * Call PJAX.app[] for current PJAX after downloaded, restored from cache
 *   PJAX.app[pjax-route-being-unloaded] (
 *      'load',
 *      jquery-pjax-options-object-for-this-pjax,
 *      path-of-new-pjax,
 *      containerId-of-new-pjax
 *   );
 */

$(document).on('pjax:end', function ($event, xhr, options) {
  var pjaxApp = PJAX.app;

  if (pjaxApp._pjaxFail) {
    pjaxApp._pjaxFail = false;
    return;
  }

  var newUrl = $event.currentTarget.URL,// todo use this or window.location?
    parsedUrl = pjaxApp.parseUrl(newUrl),
    newPath = parsedUrl[0],
    newRoute = parsedUrl[1],
    newQuery = parsedUrl[2],
    cont = options.container,
    newContainer = (typeof cont === 'string' ? cont :
      cont[0].id).replace(/^#/, '');

  if (PJAX.controllers[newRoute]) {
    options = $.extend(true, {}, options); // else $ trigger problems
    options._isFromServer = !!options.xhr;

    options._isFirstCallPath = pjaxApp._pathsInitialized.indexOf(newPath) === -1;
    if (options._isFirstCallPath) { pjaxApp._pathsInitialized.push(newPath); }

    options._isFirstCallRoute =
      pjaxApp._routesInitialized.indexOf(newRoute) === -1;
    if (options._isFirstCallRoute) {
      pjaxApp._routesInitialized.push(newRoute);
    } else {

      // PJAX content is from the cache, so jquery did not execute inline script
      // force execution (in global context) of script marked for such execution
      var s = $('#' + newContainer).find('script[pjax-run-always]');
      s.each(function () {
        var $body = $('body');
        $body.append('<script>' + $(this).html() + '</script>');
        $body.children().last().remove();
      });
    }

    PJAX.controllers[newRoute]('load', options, newPath, newContainer);

    pjaxApp._lastPjaxUrl = newUrl;
    pjaxApp._lastPjaxContainer = newContainer;

  }

  options = null; // GC
});

/**
 * Call PJAX.controllers[] for current PJAX before it is unloaded.
 *   PJAX.controllers[pjax-route-being-unloaded] (
 *      'unload',
 *      jquery-pjax-options-object-for-next-pjax,
 *      path-of-pjax-being-unloaded,
 *      containerId-of-pjax-being-unloaded
 *   );
 */

$(document).on('pjax:start', function ($event, xhr, options) {
  var pjaxApp = PJAX.app;

  if (pjaxApp._lastPjaxUrl) {

    var lastUrl = pjaxApp._lastPjaxUrl,
      parsedUrl = pjaxApp.parseUrl(lastUrl),
      lastPath = parsedUrl[0],
      lastRoute = parsedUrl[1],
      lastContainer = pjaxApp._lastPjaxContainer;

    if (PJAX.controllers[lastRoute]) {
      var opts = $.extend(true, {}, options); // else $ trigger problems

      PJAX.controllers[lastRoute]('unload', opts, lastPath, lastContainer);
    }

    opts = null; // GC

  }
});