/**
 * Module dependencies.
 */

var express = require('express');
//var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var path = require('path');
//var mongoose = require('mongoose');
//var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

/**
 * Load controllers.
 */

var ex1Controller = require('./controllers/ex1');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
//var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));


//app.set('view engine', 'jade');
app.set('view engine', 'ejs');


app.use(connectAssets({
  paths: ['public/css', 'public/js'],
  helperContext: app.locals
}));
app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());

app.use(express.session({
  secret: secrets.sessionSecret,
  cookie: { maxAge: 60000 }
  /* we're not using any DB
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
  */
}));

/* we are not using csrf so as not to complicate /ex1
app.use(express.csrf());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals._csrf = req.csrfToken();
  res.locals.secrets = secrets;
  next();
});
*/
app.use(flash());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: month }));
app.use(function(req, res, next) {
  // Keep track of previous URL
  if (req.method !== 'GET') return next();
  var path = req.path.split('/')[1];
  if (/(auth|login|logout|signup)$/i.test(path)) return next();
  req.session.returnTo = req.path;
  next();
});
app.use(app.router);
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
app.use(express.errorHandler());

/**
 * Application routes.
 */

app.get ('/', ex1Controller.index);

app.get ('/ex1', ex1Controller.index);
app.get ('/ex1/club', ex1Controller.club);
app.post('/ex1/club', ex1Controller.clubPost);
app.get ('/ex1/team', ex1Controller.team);
app.post('/ex1/team', ex1Controller.teamPost);
app.get ('/ex1/schedule', ex1Controller.schedule);
app.get ('/ex1/screen1', ex1Controller.screen1);


/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
