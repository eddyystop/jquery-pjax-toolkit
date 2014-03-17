/* jshint jquery, strict: true */
/* global $, PJAX */

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