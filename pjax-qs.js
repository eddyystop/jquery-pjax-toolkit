/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

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