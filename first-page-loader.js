PJAX = {
  _loaded: [], // List of loaded URLs is used by companion repos.

  // Wait till DOM is fully rendered
  onReady: function onReady (cb) {
    if (window.addEventListener) {
      window.addEventListener('load', cb, false);
    } else if (window.attachEvent) {
      window.attachEvent('onload', cb);
    } else { window.onload = cb; }
  },

  // Load Javascript and other <script> files in sequence
  loadJsUrls: function loadJsUrls (files, mimeType, cb) {
    if (typeof mimeType !== 'string') {
      cb = mimeType;
      mimeType = null;
    }

    if (files.length > 0) {
      var el = document.createElement('script');
      el.src = files[0];
      el.async = true;
      el.type = (mimeType || 'text/javascript');

      el.onreadystatechange = el.onload = function () {
        var state = el.readyState;
        if (!state || /loaded|complete/.test(state)) {
          console.log('loaded', el.src);
          PJAX._loaded.push(el.src);
          PJAX.loadJsUrls(files.slice(1), cb);
        }
      };

      (document.body || document.head).appendChild(el);//body safer IE
    } else {
      console.log('===== all js loaded');
      if (cb) { cb(); }
    }
  },

  // Initiate loading of CSS files.
  loadCssUrls: function loadCssUrls (files) {
    var headEl = document.getElementsByTagName('head')[0];

    for (var i = 0, len = files.length; i < len; i += 1) {
      var style = document.createElement('style');
      style.textContent = '@import "' + files[i] + '"';
      headEl.appendChild(style);
    }
    console.log('===== all css loading initiated');
  },

  // Load CSS files in sequence. (You can remove to reduce size.)
  loadCssUrlsSeq: function loadCssUrls (files, cb) {
    // http://meyerweb.com/eric/css/link-specificity.html
    // http://www.phpied.com/when-is-a-stylesheet-really-loaded/

    if (files.length > 0) {
      var style = document.createElement('style'),
        fi;
      style.textContent = '@import "' + files[0] + '"';

      fi = setInterval(function() {
        if (style.sheet && style.sheet.cssRules) {
          clearInterval(fi);
          console.log('loaded', files[0]);
          PJAX._loaded.push(files[0]);
          PJAX.loadCssUrls(files.slice(1), cb);
        }
      }, 10);

      document.getElementsByTagName('head')[0].appendChild(style);
    } else {
      console.log('===== all css loaded in sequence');
      if (cb) { cb(); }
    }
  }
};