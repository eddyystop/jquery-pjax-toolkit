/* jshint jquery, strict: true */
/* global $, PJAX */

// ===== pjax-loader ===========================================================

var PJAX = PJAX || {};

PJAX.requireJs = function requireJs (urls, mimeType, cb) {
  PJAX.setUrlsAsLoaded(PJAX.getScriptUrls());
  var loaded = PJAX.loaded,
    missing = [];

  (typeof urls === 'string' ? [urls] : urls).forEach(function (url) {
    if (loaded.indexOf(url) === -1) { missing.push(url); }
  });

  PJAX.loadJsUrls(missing, mimeType, cb);
};

PJAX.requireCss = function requireCss (urls, cb) {
  var loaded = PJAX.loaded,
    missing = [];

  (typeof urls === 'string' ? [urls] : urls).forEach(function (url) {
    if (loaded.indexOf(url) === -1) { missing.push(url); }
  });

  if (cb) {
    PJAX.loadCssUrlsSeq(missing, cb);
  } else {
    PJAX.loadCssUrls(missing);
  }
};

PJAX.getScriptUrls = function getScriptUrls () {
  var urls = [];
  $('script[src]').each(function() { urls.push(this.src); });
  return urls;
};

PJAX.setUrlsAsLoaded = function setUrlsAsLoaded (urls) {
  (typeof urls === 'string' ? [urls] : urls).forEach(function (url) {
    if (PJAX._loaded.indexOf(url) === -1) { PJAX._loaded.push(url); }
  });
};

// ===== pjax-qs ===============================================================

PJAX.qs = {
  options: { array: '[0]', obj: '.' },

  /**
   * Convert a query string into an object
   * @param {string} query is the query or hash string. It may be a full URL.
   * @param {boolean} isHash is true if a hash is being parsed.
   *    false   Anything before an opt '?' or after an opt '#' is ignored.
   *    true    Anything before an opt '#!' or '#' is ignored.
   * @returns {object} parsed query string
   *
   * ?var=abc                        => {var: "abc"}
   * ?var.length=2&var.scope=123     => {var: {length: "2", scope: "123"}}
   * ?var[]=0&var[]=9                => {var: ["0", "9"]}
   * ?var[0]=0&var[2]=2&var[]=9      => {var: ["0", undefined, "2", "9"]}
   * ?my.var.is.here=5               => {my: {var: {is: {here: "5"}}}}
   * ?var=a&my.var[]=b&my.c=no       => {var: "a", my: {var: ["b"], c: "no"}}
   * ?var[1].test=abc                => not supported
   * Based on https://gist.github.com/kares/956897
   */

  parseQs: function parseQuery (query, isHash) {
    console.log('..... parseQuery START query=', query);
    var re = /([^&=]+)=?([^&]*)/g,
      params = {},
      e;
    if (!query) { return params; }

    if (isHash) {
      // the hash starts after a leading '#' or '#!' (see Google SEO)
      if (query.indexOf('#') !== -1) {
        query = query.substr(query.indexOf('#') + 1);
      }
      if (query.charAt(0) === '!') {
        query = query.substr(1);
      }

    } else {
      // the query string lies between a leading '?' and a trailing '#'
      if (query.indexOf('?') !== -1) {
        query = query.substr(query.indexOf('?') + 1);
      }
      if (query.indexOf('#') !== -1) {
        query = query.substr(0, query.indexOf('#'));
      }
    }

    if (query) {
      while (e = re.exec(query)) {
        var key = decodeURIComponent(e[1].replace(/\+/g, ' '));
        var value = decodeURIComponent(e[2].replace(/\+/g, ' '));
        createElement(params, key, value);
      }
    }

    console.log('return=', params);
    return params;

    // recursive function to construct the result object
    function createElement(params, key, value) {

      if (key.indexOf('.') !== -1) {
        // if key is an object

        var firstKey = key.split('.')[0],
          remainingKeys = key.split(/\.(.+)?/)[1];

        if (!params[firstKey]) { params[firstKey] = {}; }
        if (remainingKeys !== '') {
          createElement(params[firstKey], remainingKeys, value);
        }

      } else if (key.indexOf('[') !== -1) {
        // if key is an array

        var list = key.split('['),
          index = (list[1].split(']'))[0];
        key = list[0];

        if (!params[key] || !$.isArray(params[key])) { params[key] = []; }
        if (index == '') {
          params[key].push(PJAX.qs.coerseStr(value));
        } else {
          params[key][parseInt(index, 10)] = PJAX.qs.coerseStr(value);
        }
      } else {
        // just normal key

        params[key] = PJAX.qs.coerseStr(value);
      }
    }
  },

  coerseStr: function (str) {
    //stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
    if (!isNaN(parseFloat(str)) && isFinite(str)) {
      return parseFloat(str);
    }

    var from = ['true', 'false', 'null', 'undefined'],
      to = [true, false, null, undefined],
      i = from.indexOf(str);
    return i === -1 ? str : to[i];
  },

  /**
   * Convert an object into a query string. See parseQs.
   * @param {object} obj is the object.
   *
   * Formatting options are in PJAX.qs.options :
   *    options.array ''    => a=0&a=1&a=2
   *                  '[]'  => a[]=0&a[]=1&a[]2
   *                  else  => a[0]=0&a[1]=1&a[2]=2
   *    options.obj   '[]'  => a[b][c]=5
   *                  else  => a.b.c=5
   * @returns {string} the query string
   */
  stringifyQs: function (obj) {
    var url = '',
      options = PJAX.qs.options;
    if (!obj) { return url; }

    for (var name in obj) {
      if (obj.hasOwnProperty(name)) {
        url += (url ? '&' : '') + createString(name, obj[name]);
      }
    }

    return url;

    function createString(name, value) {
      var url = '', str;

      if ($.isArray(value)) {

        for (var i = 0, len = value.length; i < len; i += 1) {
          if (typeof value[i] !== 'undefined') {

            if (options.array === '') {
              str = '';
            } else if (options.array === '[]') {
              str = '[]';
            } else {
              str = '[' + i + ']';
            }

            url += (url ? '&' : '') + name + str + '=' + value[i];
          }
        }
        return url;

      } else if (typeof value === 'object') {

        for (var prop in value) {
          if (value.hasOwnProperty(prop)) {

            if (options.obj === '[]') {
              str = '[' + prop + ']';
            } else {
              str = '.' + prop;
            }

            url += (url ? '&' : '') + createString(name + str, value[prop]);
          }
        }
        return url;

      } else {
        return name + '=' + value;
      }
    }
  }
};

// ===== pjax-link =============================================================


PJAX.link = {

  /**
   * Create event handlers for links with PJAX routing e.g. $('a[pjax-route]')
   * @param {string} containerId is HTML id of current PJAX container
   * @param {object} config contains the route definitions.
   *   See PJAX.link.getRouteUrlAndContainer for details.
   */

  pjaxLinkRoutes: function pjaxLinkRoutes (containerId, config) {
    console.log('... PJAX.link.pjaxLinkRoutes START');

    $('#' + containerId).find('a[pjax-route]').click(function (event) {
      console.log('* PJAX.link.pjaxLinkRoutes event handler START');
      event.stopPropagation();
      event.preventDefault();

      var urlAndContainer = PJAX.link.getRouteUrlAndContainer(
        $(event.target).attr('pjax-route'), config);
      console.log('* pjaxLinkRoutes. call $.pjax url=', urlAndContainer[0]);
      $.pjax({
        url: urlAndContainer[0],
        container: urlAndContainer[1] || '#' + containerId });
      console.log('* PJAX.link.pjaxLinkRoutes event handler END');
    });

    console.log('... PJAX.link.pjaxLinkRoutes END');
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
    console.log('*** getRouteUrlAndContainer START. routeName=', routeName);
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

    console.log('*** getRouteUrlAndContainer END. url =', url);
    return [url, route.container || ''];
  },

  stringifyParams: function stringifyParams (names, config, routeName) {
    var obj = {};
    if (typeof names === 'undefined') { return obj; }

    (typeof names === 'string' ? [names] : names).forEach(function (name) {
      var value = PJAX.link.getParam(name, config, routeName, true);
      console.log('name=', name, 'value=', value);
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
      console.log('..... getParam. HTML name=', name, 'value=', value);
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

// ===== pjax-form =============================================================

PJAX.form = {

// Convenience method.
  initPjaxForm: function initPjaxForm (containerId, config, getIsFormValid) {
    console.log('... PJAX.form.initPjaxForm START. config=', config);

    var pjaxForm = PJAX.form;
    pjaxForm._markFormButtonOnClick();
    pjaxForm._submitPjaxForm(containerId, getIsFormValid, config);

    console.log('... PJAX.form.initPjaxForm END');
  },

// Mark submit button in form when it is clicked.
  _markFormButtonOnClick: function _markFormButtonOnClick () {
    console.log('.... _markFormButtonOnClick START');
    $("form button[type=submit]").click(function() { //auto removed on HTML del

      console.log('********** _markFormButtonOnClick event handler START');
      $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
      $(this).attr("clicked", "true");
      console.log('********** _markFormButtonOnClick event handler END');

    });
    console.log('.... _markFormButtonOnClick END');
  },

  /**
   * Create event handler to submit PJAX <form>, including 'clicked' button.
   * @param {string} containerId
   * @param {*} getIsFormValid determines if form data are valid.
   *    {function}  function ($form) returns if form is valid or not.
   *    {string}    $form.find(getIsFormValid).length === 0
   *    {falsey}    Uses Foundation Abide's '[data-invalid]' as the string.
   * @param {object} config required when form has 'pjax-route' attr.
   *    See PJAX.link.getRouteUrlAndContainer for details.
   * @private
   *
   * 1. If the form has a 'pjax-route' attr & if the companion route processing
   * code (PJAX.link) has been loaded, its 'action' and 'data-pjax' attrs are
   * replaced by the route info, so jquery-pjax can process it.
   * 2. If a sumbit button has a 'clicked' attr, its 'value' attr is returned
   * as '_button' tag's value.
   * 3. Does nothing if form fields are not valid.
   */

  _submitPjaxForm: function _submitPjaxForm (containerId, getIsFormValid,
                                             config) {
    var $container = $('#' + containerId),
      $form = $container.find('form');

    $form.submit(function (event) { // event auto removed when HTML deleted
      console.log('********** PJAX.form._submitPjaxForm event handler START');
      event.preventDefault();

      console.log('))))) typeof getIsFormValid=', typeof getIsFormValid,
        'getIsFormValid=', getIsFormValid,
        '#found=', $form.find(getIsFormValid || '[data-invalid]').length
      );

      var isFormValid = typeof getIsFormValid === 'function' ?
        getIsFormValid($form) :
        $form.find(getIsFormValid || '[data-invalid]').length === 0;//abide dflt

      if (isFormValid) {

        // Save button causing the submit
        var clickedButton = $("button[type=submit][clicked=true]").val();
        $('#_button').val(clickedButton || '_defaultButton');
        console.log('* _submitPjaxForm. clicked buttons value=' + clickedButton);

        // Convert route name to URL and PJAX container.
        var routeName = $form.attr('pjax-route');
        console.log('* _submitPjaxForm. routeName=', routeName, 'config=', config,
          'PJAX=', !!PJAX.link, !!PJAX.link.getRouteUrlAndContainer);

        if (routeName && config && PJAX.link) {

          var urlAndCont = PJAX.link.getRouteUrlAndContainer(routeName, config);
          $form.attr('action', urlAndCont[0]);
          $form.attr('data-pjax', urlAndCont[1] || '#' + containerId);
          console.log('* _submitPjaxForm. route=', routeName, 'action=',
            $form.attr('action'), 'container=', $form.attr('data-pjax'));
        }

        // jquery-pjax can now handle it.
        var options = { push: true };
        console.log('* _submitPjaxForm. call $.pjax.submit options=', options);
        $.pjax.submit(event, '#' + containerId, options);
        console.log('* _submitPjaxForm returned');
      }
      console.log('********** PJAX.form._submitPjaxForm event handler END');
    });
  }
};

// ===== pjax-feature ==========================================================

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

// ===== pjax-responsive-tables ================================================

/* Based on:
 http://zurb.com/playground/projects/responsive-tables/index.html
 http://zurb.com/playground/responsive-tables
 */
$(document).ready(function() {
  var switched = false;

  var updateTables = function() {
    console.log('%%%%%%%% updateTables. #tables=', $("table.responsive").length);
    if (($(window).width() < 767) && !switched ){
      switched = true;
      $("table.responsive").each(function(i, element) {
        splitTable($(element));
      });
      return true;
    }
    else if (switched && ($(window).width() > 767)) {
      switched = false;
      $("table.responsive").each(function(i, element) {
        unsplitTable($(element));
      });
    }
  };

  $(window).load(updateTables);
  $(window).on("redraw",function(){switched=false;updateTables();}); // An event to listen for
  $(window).on("resize", updateTables);

  // custom changea JJS 2014-02-13 start ---------------------------------------
  // pjax fragment inserted. adjust tables for current window width
  $(document).on('pjax:end', function () {
    if ($(window).width() < 767) {
      // convert wide tables
      $('table.responsive').each(function(i, element) {
        if ($(this).parent().attr('class') !== 'scrollable') {
          splitTable($(element));
        }
      });
      switched = true;
    } else {
      // convert narrow tables
      $('div.table-wrapper div.scrollable table.responsive').each(function(i, element) {
        unsplitTable($(element));
      });
      switched = false;
    }
  });
  // end -----------------------------------------------------------------------

  function splitTable(original)
  {
    console.log('%%%%%%%%%%% splitTable');
    original.wrap("<div class='table-wrapper' />");

    var copy = original.clone();
    copy.find("td:not(:first-child), th:not(:first-child)").css("display", "none");
    copy.removeClass("responsive");

    original.closest(".table-wrapper").append(copy);
    copy.wrap("<div class='pinned' />");
    original.wrap("<div class='scrollable' />");

    setCellHeights(original, copy);
  }

  function unsplitTable(original) {
    console.log('%%%%%%%%%%% unsplitTable');
    original.closest(".table-wrapper").find(".pinned").remove();
    original.unwrap();
    original.unwrap();
  }

  function setCellHeights(original, copy) {
    var tr = original.find('tr'),
      tr_copy = copy.find('tr'),
      heights = [];

    tr.each(function (index) {
      var self = $(this),
        tx = self.find('th, td');

      tx.each(function () {
        var height = $(this).outerHeight(true);
        heights[index] = heights[index] || 0;
        if (height > heights[index]) heights[index] = height;
      });

    });

    tr_copy.each(function (index) {
      $(this).height(heights[index]);
    });
  }
});

// ===== pjax-responsive images ================================================

// https://github.com/scottjehl/picturefill customized for jquery-pjax
/*! Picturefill - Responsive Images that work today.
(and mimic the proposed Picture element with span elements).
Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */

(function( w ){

  // Enable strict mode
  "use strict";

  w.picturefill = function() {
    console.log('%%%%%%%% picturefill running');
    var ps = w.document.getElementsByTagName( "span" );

    // Loop the pictures
    for( var i = 0, il = ps.length; i < il; i++ ){
      if( ps[ i ].getAttribute( "data-picture" ) !== null ){

        var sources = ps[ i ].getElementsByTagName( "span" ),
          matches = [];

        // See if which sources match
        for( var j = 0, jl = sources.length; j < jl; j++ ){
          var media = sources[ j ].getAttribute( "data-media" );
          // if there's no media specified, OR w.matchMedia is supported
          if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
            matches.push( sources[ j ] );
          }
        }

        // Find any existing img element in the picture element
        var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

        if( matches.length ){
          var matchedEl = matches.pop();
          if( !picImg || picImg.parentNode.nodeName === "NOSCRIPT" ){
            picImg = w.document.createElement( "img" );
            picImg.alt = ps[ i ].getAttribute( "data-alt" );
          }
          else if( matchedEl === picImg.parentNode ){
            // Skip further actions if the correct image is already in place
            continue;
          }

          picImg.src =  matchedEl.getAttribute( "data-src" );
          matchedEl.appendChild( picImg );
          picImg.removeAttribute("width");
          picImg.removeAttribute("height");
        }
        else if( picImg ){
          picImg.parentNode.removeChild( picImg );
        }
      }
    }
  };

  // Run on resize and domready (w.load as a fallback)
  if( w.addEventListener ){
    w.addEventListener( "resize", w.picturefill, false );
    w.addEventListener( "DOMContentLoaded", function(){
      w.picturefill();
      // Run once only
      w.removeEventListener( "load", w.picturefill, false );
    }, false );
    w.addEventListener( "load", w.picturefill, false );
  }
  else if( w.attachEvent ){
    w.attachEvent( "onload", w.picturefill );
  }

  // custom changea JJS 2014-02-13 start ---------------------------------------
  $(document).on('pjax:end', function () {
    w.picturefill();
  });
  // end -----------------------------------------------------------------------

}( this ));


// ===== pjax-app ==============================================================

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
    console.log('.. _initFormHandling START. containerId=', containerId, 'config=', config);
    var $container = $('#' + containerId);

    // handlers for <a href="/foo/bar?field1=111" pjax-anchor>this</a>
    $container.pjax('a[pjax-anchor]', '#' + containerId);

    // handlers for <a pjax-route="route1">that</a>
    PJAX.link.pjaxLinkRoutes(containerId, config);

    // handlers for <form pjax-route="screen1" method="POST">
    PJAX.form.initPjaxForm(containerId, config);

    console.log('.. _initFormHandling END');
  }
};

$(document).on('pjax:success', function ( /* $event, xhr, options */ ) {
  console.log('********** pjax:success called START & END');
  PJAX.app._pjaxFail = false;
});

$(document).on('pjax:error', function ( /* $event, xhr, options */ ) {
  console.log('********** pjax:error called START & END');
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
  console.log('\n+++++++++++ LOAD +++++++++++++++++++++++++++++++++++++++++++');
  console.log('. newUrl=', $event.currentTarget.URL);

  if (pjaxApp._pjaxFail) {
    console.log('- last pjax failed');
    pjaxApp._pjaxFail = false;
    return;
  }

  var newUrl = $event.currentTarget.URL,// todo do we use this or window.location?
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

    console.log('. _isFirstCallRoute=', options._isFirstCallRoute,
      '_isFirstCallPath=', options._isFirstCallPath,
      '_isFromServer=', options._isFromServer);
    console.log('. newPath=', newPath, 'newRoute=', newRoute, 'newContainer=', newContainer);

    PJAX.controllers[newRoute]('load', options, newPath, newContainer);

    pjaxApp._lastPjaxUrl = newUrl;
    pjaxApp._lastPjaxContainer = newContainer;

  } else {
    console.log('\n\n!!!!!!!!!!!!!!!!!!!! no controller round for route=', newRoute, '!!!!!!!!!!!!!!!!!!!!');
  }
  console.log('+++++++++++ LOAD END +++++++++++++++++++++++++++++++++++++++\n');
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
  console.log('+++++++++++ UNLOAD +++++++++++++++++++++++++++++++++++++++++++');
  console.log('. lastUrl=', pjaxApp._lastPjaxUrl);

  if (pjaxApp._lastPjaxUrl) {

    var lastUrl = pjaxApp._lastPjaxUrl,
      parsedUrl = pjaxApp.parseUrl(lastUrl),
      lastPath = parsedUrl[0],
      lastRoute = parsedUrl[1],
      lastContainer = pjaxApp._lastPjaxContainer;

    if (PJAX.controllers[lastRoute]) {
      var opts = $.extend(true, {}, options); // else $ trigger problems

      console.log('. lastPath=', lastPath, 'lastRoute=', lastRoute, 'lastContainer=', lastContainer);

      PJAX.controllers[lastRoute]('unload', opts, lastPath, lastContainer);
    }

    opts = null; // GC

  }

  console.log('+++++++++++ UNLOAD on(pjax:start) END ++++++++++++++++++++++++');
});

// ===== pjax-CrazyGlue ========================================================

/**
 * Bi-directional binding between this JS object and a (collection of) DOM tag.
 * Easy to customize. Depends on DOM 'change' event.
 * @param {*} $el a jQuery element or collection, or a selector string.
 *   $('input[name=xxx]')
 *   $('select[name=xxx]')
 *   $('input[name=xxx]:radio')
 *   $('input[name=xxx]:checkbox')
 * @param {*} value to set tag to. string, array, null. optional.
 * @param {function} changeCb callback when tag's value changes. optional.
 * @returns {CrazyGlue}
 *   .value             current tag value.
 *   .change(newValue)  changes tag value.
 *   .sync()            forces .value to current tag value
 * @constructor
 */

var CrazyGlue = function CrazyGlue ($el, value, changeCb) {
  console.log('~~~ CrazyGlue constructor. typeof $el=', typeof $el);
  if (!this instanceof CrazyGlue) {
    return new CrazyGlue($el, value, changeCb);
  }
  if (typeof value === 'function') {
    changeCb = value;
    value = undefined;
  }

  this.$el = typeof $el === 'string' ? $($el) : $el;
  console.log('$el=', this.$el);

  var getPut = this._gettersPutters(this.$el);
  this._getJsValue = getPut[0];
  this._putToDom = getPut[1];

  console.log('~~~ CrazyGlue. called value=', value);
  if (typeof value !== 'undefined') { this._putToDom(value); }
  this.value = this._getJsValue(); // get what's really in the DOM
  console.log('~~~ CrazyGlue. stored value=', this.value);
  this.changeCb = typeof changeCb === 'function' ? changeCb : undefined;

  // Use non-jQuery event handler so it can refer to our props as 'this'.
  // Checkboxes & radio buttons have $el.length > 1, others $el.length = 1
  // We're assuming the browser removes these events should the tags be removed.
  for (var i = 0, len = this.$el.length; i < len; i += 1) {
    this.$el[i].addEventListener('change', this, false);
  }
};

// Non-jQuery event handler
CrazyGlue.prototype.handleEvent = function handleEvent (event) {
  console.log('~~~ CrazyGlue.handleEvent. type=', event.type);
  switch (event.type) {
    case "change":
      this.value = this._getJsValue();
      if (this.changeCb) { this.changeCb(this.value); }
  }
};

// change value
CrazyGlue.prototype.change = function change (value) {
  console.log('~~~ CrazyGlue.change');

  this._putToDom(value);
  this.value = this._getJsValue(); // get what's really in the DOM
};

// force value sync
CrazyGlue.prototype.sync = function sync () {
  console.log('~~~ CrazyGlue.force');

  this.value = this._getJsValue();
};

/**
 * Return getter and setter for jQuery collection.
 * You can customize this to support new or specialized tags/collections.
 * @param {*} $el jQuery element or collection, generally all of the same type.
 * @returns {array} [getterMethod, setterMethod]
 *   getterMethod()      sets this.value to the value of this.$el collection.
 *   setterMethod(value) places 'value' into this.$el.
 * @private
 */

CrazyGlue.prototype._gettersPutters = function _gettersPutters ($el) {
  var tag = $el.prop('tagName');

  if (tag === 'INPUT') {
    var type = $el.prop('type');
    if (type === 'checkbox' || type === 'radio') {
      console.log('~~~ INPUT:' + type);
      return [this._getElChecked, this._putElChecked];
    }
  } else if (tag === 'SELECT') {
    console.log('~~~ SELECT');
    return [this._getElSelected, this._putElSelected];
  }

  console.log('~~~ TAG regular');
  return [this._getElValue, this._putElValue];
};

// $('input[name=xxx]')
CrazyGlue.prototype._getElValue = function () {
  var val = this.$el.val(),
    type = typeof val;
  if (type === 'undefined' || type === 'null') { val = ''; }
  console.log('~~~~~ CrazyGlue.getElValue=', val);
  return val;
};
CrazyGlue.prototype._putElValue = function (value) {
  console.log('~~~~~ CrazyGlue.putElValue=', value);
  var val = value,
    type = typeof val;
  if (type === 'undefined' || type === 'null') { val = ''; }
  this.$el.val(val);
};

// $('input[name=xxx]:radio')
// $('input[name=xxx]:checkbox')
CrazyGlue.prototype._getElChecked = function () {
  var ret = [];
  console.log('+++ #selected=', this.$el.filter(':checked').length);

  this.$el.filter(':checked').each(function () {
    var val = $(this).val(),
      type = typeof val;
    if (type === 'string') { ret.push(val); }
  });

  console.log('~~~~~ CrazyGlue.getElChecked=', ret);
  return ret;
};
CrazyGlue.prototype._putElChecked = function (value) {
  console.log('~~~~~ CrazyGlue.putElChecked=', value);
  var val = value,
    type = typeof val;
  if (type === 'undefined' || type === 'null') { val = []; }
  if (type === 'string') { val = [val]; }
  this.$el.removeAttr('checked'); // req'd for checkboxes
  this.$el.val(val);
};

// $('select[name=xxx]')
CrazyGlue.prototype._getElSelected = function () {
  var val = this.$el.val(),
    type = typeof val;
  if (type === 'undefined' || type === 'null') { val = []; }
  console.log('~~~~~ CrazyGlue.getElSelected=', val);
  return val;
};
CrazyGlue.prototype._putElSelected = function (value) {
  console.log('~~~~~ CrazyGlue.putElSelected=', value);
  var val = value,
    type = typeof val;
  if (type === 'undefined' || type === 'null') { val = []; }
  if (type === 'string') { val = [val]; }
  this.$el.val(val);
};
