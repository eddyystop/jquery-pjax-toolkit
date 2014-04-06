/*globals Validations, Pjax */

/**
 * res.locals
 *    .client {object}  session data
 *    .view   {object}  data used within the partial view
 *    .msgs   {array}   messages to display within the partial view
 *    .values {object}  values for fields within the partial view
 */
'use strict';

var CONTROLLER = 'ex1';

var Pjax = require('../services/Pjax');

var regions = [
    ['r1', 'region1 name'],
    ['r2', 'region2 name'],
    ['r3', 'region3 name']
  ],
  clubs = {
    r1: [
      ['club0', 'club0 name'],
      ['club1', 'club1 name'],
      ['club2', 'club2 name'],
      ['club3', 'club3 name'],
      ['club4', 'club4 name']
    ],
    r2: [
      ['club4', 'club4 name'],
      ['club5', 'club5 name'],
      ['club6', 'club6 name'],
      ['club7', 'club7 name']
    ],
    r3: [
      ['club0', 'club0 name'],
      ['club2', 'club2 name'],
      ['club4', 'club4 name'],
      ['club6', 'club6 name']
    ]
  };

/**
 * configurations for controller actions
 */

var club = {
  action: 'club',
  data: {
    regions: [
      ['r1', 'region1 name'],
      ['r2', 'region2 name'],
      ['r3', 'region3 name']
    ],
    /*
     localsView.clubs = [
     ['u10fd1', 'u10fd1 name'],
     ['u11fd1', 'u11fd1 name'],
     ['u12fd1', 'u12fd1 name'],
     ['u13fd1', 'u13fd1 name'],
     ['u14fd1', 'u14fd1 name'],
     ['u15fd1', 'u15fd1 name'],
     ['u16fd1', 'u16fd1 name'],
     ['u17fd1', 'u17fd1 name']
     ];
     */
    clubs: [
      ['club0', 'club0 name'],
      ['club1', 'club1 name'],
      ['club2', 'club2 name'],
      ['club3', 'club3 name'],
      ['club4', 'club4 name'],
      ['club5', 'club5 name'],
      ['club6', 'club6 name'],
      ['club7', 'club7 name']
    ],
    regionsClubs: {
      'r1': [0, 1, 2, 3],
      'r2': [4, 5, 6, 7],
      'r3': [0, 2, 4, 6, 7]
    },
    regionClubs: []
  },
  routes: {
    _self: { req: ['region', 'club'] },
    //_defaultButton: {},
    team: { path: 'signin/team', req: ['region', 'club'] },
    coach: { path: 'a/b' }
  },

  doAfterValidData: function doAfterValidData (req, res, sessionClient, localsView, config) {
    sessionClient.region = req.body.region;
    sessionClient.regionName = _findName(localsView.data.regions, req.body.region);
    sessionClient.club = req.body.club;
    sessionClient.clubName = _findName(localsView.data.clubs, req.body.club);
  },

  // typically update locals for display
  doAfterInvalidData: function doAfterInvalidData (req, res, sessionClient, localsView) {
    var regionClubs = [],
      clubIndexes = localsView.data.regionsClubs[req.body.region || ''] || [];
    clubIndexes.forEach(function (clubIndex) {
      regionClubs.push(localsView.data.clubs[clubIndex]);
    });
    localsView.data.regionClubs = regionClubs;
  }
};

var team = {
  action: 'team',
  data: { devil: 666 },
  routes: {
    _self: { req: ['region', 'club', 'teams'], js: 'devil' },
    _defaultButton: { path: 'ex1/schedule', req: ['region', 'club', 'teams'], js: 'devil' }
  },

  normalizeDataBeforeValidation: function normalizeDataBeforeValidation (req, res, sessionClient, localsView) {
    var teams = req.body.teams;
    req.body.teams = typeof teams === 'string' ? [teams] : (teams || []);
  },

  doAfterValidData: function doAfterValidData (req, res, sessionClient, localsView, config) {
    sessionClient.teams = req.body.teams;
    sessionClient.teamsStr = req.body.teamsStr = sessionClient.teams.join(' & ');
  },

  // typically update locals for display
  doAfterInvalidData: function doAfterInvalidData (req, res, sessionClient, localsView) {
    var teams = req.body.teams || [];
    console.log('teams=', teams);
    sessionClient.teams = typeof teams === 'string' ? [teams] : teams;
    sessionClient.teamsStr = sessionClient.teams.join(' & ');
  }
};

var schedule = {
  action: 'schedule',
  data: { devil: 660 },
  routes: {
    _self: { req: ['region', 'club', 'teams'], js: 'devil' },
    _defaultButton: { path: 'signin/schedule2', req: ['region', 'club', 'teams'] }
  }
};

//todo specify {layout: false} in just one place

module.exports = {

  index: function (req, res) {
    logReqInfo('/ex1/index', req);

    req.session.X_PJAX = null;
    res.locals.htmlToLoad = '/ex1/club';
    logResInfo('ex1/htmlFramework', null, res);
    res.render('ex1/htmlFramework', {layout: false});
  },

  club: function (req, res) {
    logReqInfo('/ex1/club', req);

    res.locals.regions = regions;
    res.locals.clubs = clubs;
    res.locals.region = 'x'; // no initial selection
    res.locals.club = 'x';

    // * A route directly called by a client PJAX request will have a
    // X-PJAX header.
    // * The route may be for a PJAX POST request. If the POST data is
    // validated correctly, the route is likely to res.redirect(..) to
    // another route to render a response. That redirected-to route will not
    // have a X-PJAX header.
    // * We req.session.X_PJAX = true before redirection, so the
    // redirected-to route knows the original client request was PJAX.
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    if (req.session.X_PJAX) {
      // PJAX request for HTML fragment

      // We are not redirecting
      req.session.X_PJAX = null;

      // * Inserting HTML into the DOM is not the only thing jquery-pjax does.
      // * Users want to be able to save bookmarks and they expect to see a properly
      // rendered page when they use the bookmark.
      // * The server therefore should send the client a bookmark-able URL,
      // and it should be able to render a completely refreshed page when it gets
      // that URL.
      // FYI, such a request would not have a X-PJAX header.
      // * jquery-pjax will set the client's window.location.search to the URL
      // provided by the server after inserting a PJAX request HTML.
      res.setHeader('X-PJAX-URL', '/ex1/club');

      // render the PJAX HTML
      logResInfo('ex1/club', '/ex1/club', res);
      res.render('ex1/club', {layout: false});

    } else {
      // Request is from a bookmark, etc. Render a complete, refreshed page.

      // * We'll render the html framework and cause it to PJAX the contents.
      // Redirecting with res.redirect('/ex1') accomplishes the same thing.
      // * We could instead have rendered a complete page, including the html
      // framework and PJAX fragment. This would result in a single round trip.
      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/club';
      logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }

  },

  clubPost: function (req, res) {
    logReqInfo('/ex1/clubPost', req);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    req.session.region = req.body.region;
    req.session.club = req.body.club;

    res.redirect('/ex1/team');
  },

  team: function (req, res) {
    logReqInfo('/ex1/team', req);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    res.locals.regionName = _findName(regions, req.session.region);
    res.locals.clubName = _findName(clubs[req.session.region] || [], req.session.club);

    if (req.session.X_PJAX) {
      // PJAX request for HTML fragment

      req.session.X_PJAX = null;
      res.setHeader('X-PJAX-URL', '/ex1/team');
      logResInfo('ex1/team', '/ex1/team', res);
      res.render('ex1/team', {layout: false});

    } else {
      // Request is from a bookmark, etc. Render a complete, refreshed page.

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/team';
      logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }
  },


  teamPost: function (req, res) {
    logReqInfo('/ex1/teamPost', req);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    req.session.teams = req.body.teams;

    res.redirect('/ex1/schedule');
  },

  schedule: function (req, res) {
    logReqInfo('/ex1/schedule', req);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    res.locals.regionName = _findName(regions, req.session.region);
    res.locals.clubName = _findName(clubs[req.session.region] || [], req.session.club);

    var teams = req.session.teams;
    res.locals.teamsNames = typeof teams === 'string' ? teams :
      req.session.teams.join(', ');

    if (req.session.X_PJAX) {
      // PJAX request for HTML fragment

      req.session.X_PJAX = null;
      res.setHeader('X-PJAX-URL', '/ex1/schedule');
      logResInfo('ex1/schedule', '/ex1/schedule', res);
      res.render('ex1/schedule', {layout: false});

    } else {
      // Request is from a bookmark, etc. Render a complete, refreshed page.

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/schedule';
      logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }
  },

  screen1: function (req, res) {
    logReqInfo('/ex1/screen1', req);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    if (req.session.X_PJAX) {
      // PJAX request for HTML fragment

      req.session.X_PJAX = null;
      res.setHeader('X-PJAX-URL', '/ex1/screen1');
      logResInfo('ex1/screen1', '/ex1/screen1', res);
      res.render('ex1/screen1', {layout: false});

    } else {
      // Request is from a bookmark, etc. Render a complete, refreshed page.

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/screen1';
      logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }

  }
};

function _findName (list, key) {
  for (var i = 0, len = list.length; i < len; i += 1) {
    if (list[i][0] === key) {
      return list[i][1];
    }
  }
  return '';
}

function logReqInfo (route, req) {
  console.log('\n\n===> route handler "' + route + '"; METHOD=',
    req.route.method, '; X-PJAX header=', req.header('X-PJAX'));

  console.log('=> original url=', req.originalUrl);
  console.log('=> req.query=', req.query);
  console.log('=> req.body=', req.body);
  console.log('=> req is ' +
    (req.session.X_PJAX || req.header('X-PJAX') ? '' : 'not') +
    ' a PJAX request');
}

function logResInfo (view, url, res) {
  // res.locals is a function with properties
  var locals = {};
  for (var key in res.locals) {
    if (res.locals.hasOwnProperty(key)) {
      locals[key] = res.locals[key];
    }
  }

  console.log('\n\n<= rendering view=', view);
  console.log('<= with res.locals=', locals);
  console.log('<= setting client URL=', url || '(not set)');
}