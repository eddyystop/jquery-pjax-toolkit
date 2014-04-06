/* jshint jquery, strict: true */
/* global $, PJAX */
'use strict';

/**
 * Handlers for pjax loading/unloading.
 * @param {string} action is load or unload.
 *      load   Called once pjax html has been loaded.
 *      unload Called before pjax html is deleted.
 *             Events within container will be automatically removed.
 * @param {object} options is information of the pjax request. On load:
 *    {boolean} options._isFirstCallRoute if first time controller called.
 *        e.g. ex1/club
 *    {boolean} options._isFirstCallPath if first time URL's path called.
 *        e.g. ex1/club?region=r1&club=c1
 *    {boolean} options._isFromServer if PJAX content comes from server,
 *        else it comes from cache via back/forward buttons.
 * @param {string} path is (X-PJAX-URL) path being loaded/unloaded.
 * @param {string} containerId is id of the container being loaded/unloaded.
 */

PJAX.controllers['ex1/club'] = function
    (action, options, path, containerId) {
  logPjaxController(arguments);

  var config = {
    data: { acct: 123},
    qs: PJAX.qs.parseQs(window.location.search, false),
    hash: PJAX.qs.parseQs(window.location.hash, true),
    routes: {
      screen1: {
        path: '/ex1/screen1?field9=9999', button: 'myButton', container: '',
        paramsQs: ['region', 'club', 'acct']
      },
      ex1_club_post: {
        path: '/ex1/club?field3=3333',
        paramsQs: ['acct']
      }
    }
  };

  var regions = PJAX.data['ex1/club'].regions,
    clubs = PJAX.data['ex1/club'].clubs;

  var $container = $('#' + containerId),
    $region = $container.find('#region'),
    $club = $container.find('#club');

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

    // EVENT HANDLERS
    $region.on('click', function () {
      var region = $region.find('option:selected').val();
      _loadClubOptions (region);
    });

    // CRAZYGLUE BINDINGS
    var gender = new CrazyGlue('#gender'),
      sex = new CrazyGlue('input:radio[name=sex]',
        function (val) { gender.change(JSON.stringify(val) || ''); }
      );

    var zoo = new CrazyGlue('#zoo'),
      animal = new CrazyGlue('input:checkbox[name=animal]',
        function (val) { zoo.change(JSON.stringify(val) || ''); }
      );

  } else { } // pjax being unloaded

  function _loadClubOptions (region) {

    var str = '';
    if (clubs[region]) {
      clubs[region].forEach(function (club) {
        str += [
          '<option value="',
          club[0],
          '"',
          '>',
          club[1],
          '</option>\n'
        ].join('');
      })
    }

    $club.html(str);
  }
};

// ===========================================================================

PJAX.controllers['ex1/team'] = function
  (action, options, path, containerId, otherRoute, otherContainer) {
  logPjaxController(arguments);

  var config = {
    data: { acct: 123},
    qs: PJAX.qs.parseQs(window.location.search),
    hash: PJAX.qs.parseQs(window.location.hash),
    routes: {
      ex1_team_post: {
        path: '/ex1/team?field6=6666',
        paramsQs: 'acct'
      }
    }
  };

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

  } else { } // pjax being unloaded
};

// ===========================================================================

PJAX.controllers['ex1/schedule'] = function
  (action, options, path, containerId, otherRoute, otherContainer) {
  logPjaxController(arguments);

  var config = {};

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

  } else { } // pjax being unloaded
};

function logPjaxController (args) {
  if (args[0] === 'load') {
    console.log('\n===> PJAX action=', args[0], '; path=', args[2],
      '; containerId=', args[3]);
    console.log('=> window.location.href=', window.location.href);

    var options = args[1];
    if (options._isFirstCallRoute) { console.log('=> first call to controller'); }
    if (options._isFirstCallPath) { console.log('=> first call for path'); }
    if (options._isFromServer) { console.log('=> HTML loaded from server');
    } else { console.log('=> HTML retrieved from cache'); }

    } else {
    console.log('\n<= PJAX action=', args[0], '; path=', args[2],
      '; containerId=', args[3], '\n');
  }
}

