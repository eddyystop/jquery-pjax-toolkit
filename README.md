# [jquery-pjax-toolkit] (https://github.com/defunkt/jquery-pjax-toolkit)

jquery-pjax-toolkit provides additional capabilities for when you are using
[jquery-pjax] (https://github.com/defunkt/jquery-pjax).
Related features are packaged in separate files,
and you may use just the files you need.

## How to install
```sh
bower install git://github.com/eddyystop/jquery-pjax-toolkit
```

## Components
- [first-page-loader] (#first-page-loader) - A minimalist first-page loader.
- [pjax-loader] (#pjax-loader) - A conditional loader.
- [pjax-qs] (#pjax-qs) - Convert between query strings and objects.
- [pjax-link] (#pjax-link) - Anchors with dynamic URLs and query strings.
- [pjax-form] (#pjax-form) - Forms with dynamic URLs and query strings.
- [pjax-features] (#pjax-features) - Report features supported by the client.
- [pjax-responsive-tables] (#pjax-responsive-tables) -
Support for responsive tables.
- [pjax-app] (#pjax-app) - Ties the above into a micro framework
for jquery-pjax.

Note that jQuery itself removes constructs such as data and event handlers
from elements before replacing those elements with new PJAX content.
So you do not need to handle that yourself.




## Dependencies
You may use only those components you want as long as you include
their dependencies:

~~~
| Component dependencies    |first|loader| qs |link|form|features|tables|app|jquery-pjax|
|---------------------------|-----|------|----|----|----|--------|------|---|-----------|
| 1. first-page-loader      | -   | .    | .  | .  | .  | .      | .    | . | .         |
| 2. pjax-loader            | req | -    | .  | .  | .  | .      | .    | . | .         |
| 3. pjax-qs                | .   | .    | -  | .  | .  | .      | .    | . | req       |
| 4. pjax-link              | .   | .    | req| -  | .  | .      | .    | . | req       |
| 5. pjax-form              | .   | .    | opt| opt| -  | .      | .    | . | req       |
| 6. pjax-features          | .   | .    | .  | .  | .  | -      | .    | . | .         |
| 7. pjax responsive-tables | .   | .    | .  | .  | .  | .      | -    | . | opt       |
| 8. pjax-app               | .   | .    | req| req| req| .      | .    | - | req       |
~~~

jquery-pjax-toolkit.js packages together modules 2 to 8.
jquery-pjax-toolkit.min.js is the production version.




## Docs

### <a name="first-page-loader"></a>first-page-loader
first-page-loader is a minimalist lib for loading CSS, JavaScript,
and template files (as well as other mime types) sequentially or in parallel.

It's designed for sites wanting to load the above-the-cut portion of their
first page in under 1 second. Of course it'll work great with any site.

first-page-loader has its own repo.
Its included with jquery-pjax-toolkit because its designed to be used with it.
See its [repo] (https://github.com/eddyystop/first-page-loader)
for more information.


***


### <a name="pjax-loader"></a>pjax-loader

#### 1. Load external CSS files
```js
PJAX.requireCss([
    '/concat/production.css',
    '/css/vendor/pjax-responsive-tables.css'
]);
```
Start downloading in parallel any CSS files not already downloaded.
We do not wait for the downloads to complete.

```js
PJAX.requireCss([
    '/concat/production.css',
    '/css/vendor/pjax-responsive-tables.css'
], handler );
```
CSS order can make a difference in edge cases.
Download sequentially any CSS files not already downloaded.
(I must say [this is not easy to do]
(http://www.phpied.com/when-is-a-stylesheet-really-loaded/).)
The handler is called at the end.

#### 2. Inline script can have external files as a dependency.
jquery-pjax initiates the download of any external files in `script` tags,
while executing any inline JS immediately.
This is an issue when the (not yet available) external JS is
a dependency of the inline JS.

```js
PJAX.requireJs([
    '/js/js1.js',
    '/js/js2.js'
], function () {
    // You know the 2 files have been loaded, parsed, and executed by this time.
    ...
} );
```
Download js1.js followed by js2.js, if they haven't already been downloaded.
Call the handler at the end.
PJAX.requireJs will not download a file which jquery-pjax itself
has already downloaded.

#### 3. JS independent of how production files are concatenated.
```js
PJAX.onReady(function () {
    PJAX.loadCssUrls([
        '/prod/production.css'
    ]);
    PJAX.loadJsUrls([
        '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.js',
        '/prod/production.js'
    ], function () {
        PJAX.setUrlsAsLoaded([
            '/css/vendor/foundation.css',
            '/css/vendor/pjax-responsive-tables.css',
            '/js/vendor/jquery.pjax.js',
            '/js/vendor/modernizr.js',
            '/js/vendor/foundation.js',
            '/js/vendor/foundation.abide.js',
            '/js/vendor/jquery-pjax-toolkit.js',
            '/js/app.js'
        ]);
        $.pjax({ url: '/signin', container: '#pjax-container' });
    });
});
```
Your JS can now check if `/js/vendor/modernizr.js` has been loaded,
without caring if it was downloaded as a separate file in dev mode
or if its inside `/prod/production.js` in production.


***


### <a name="pjax-qs"></a>pjax-qs

#### 1. Convert query strings to objects
```js
var queryObj = PJAX.qs.parseQs(window.location.search);
var hashObj = PJAX.qs.parseQs(window.location.hash, true);
```
Also works with whole URLs.
Search strings lie between optional '?' and '#'.
Hashes follow optional '#' or '#!'.

```
| String                     | Object                                |
|----------------------------|---------------------------------------|
| var=abc                    | {var: "abc"}                          |
| var.length=2&var.scope=123 | {var: {length: 2, scope: 123}}        |
| var[]=true&var[]=9         | {var: [true, 9]}                      |
| var[0]=&var[2]=2&var[]=9   | {var: [0, undefined, 2, 9]}           |
| my.var.is.here=null        | {my: {var: {is: {here: null}}}}       |
| var=a&my.var[]=b&my.c=no   | {var: "a", my: {var: ["b"], c: "no"}} |
| var[1].test=abc            | not supported                         |
```
Valid numeric strings are converted to numbers.
'true', 'false', 'null', 'undefined' are converted to their JS primitives.

#### 2. Convert objects to query strings.
```js
window.location.search = '?' + PJAX.qs.stringify(searchObj);
window.location.hash = '#' + PJAX.qs.stringify(hashObj);
```
The result contains the `hasOwnProperty(0` properties.

```
| option                | value| resulting format     |         |
|-----------------------|------|----------------------|---------|
| PJAX.qs.options.array | ''   | a=0&a=1&a=2          |         |
|                       | '[]' | a[]=0&a[]=1&a[]2     |         |
|                       | else | a[0]=0&a[1]=1&a[2]=2 | default |
| PJAX.qs.options.obj   | '[]' | a[b][c]=5            |         |
|                       | else | a.b.c=5              | default |
```
You can change the format to conform with what your server expects.


***


### <a name="pjax-link"></a>pjax-link
```html
<a href="/other/screen1?field1=111&field2=222" pjax-anchor>Next page</a>
```
jquery-pjax calls the `href` in anchor tags with a `pjax-anchor` attribute.
Such a constant URL may be insufficient for your project.
pjax-link adds support for route names and for dynamic query strings.

#### 1. Get a param's value.
```js
config = {
  data: { account: 123, type: 'regular' },
  qs: PJAX.qs.parseQs(window.location.search, false),
  hash: PJAX.qs.parseQs(window.location.hash, true)
};
var value = PJAX.link.getParam('name', config, routeName, ifTags);
```
Finds the value for 'name'. The lookup is performed in the following order:
```
| 1. HTML                 | el's name attr = 'name'  | (when ifTags = true)    |
| 2. PJAX.data[routeName] | server's controller data | (when routeName truesy) |
| 3. config.hash          | parsed URL hash          | (when config is truesy) |
| 4. config.qs            | parsed URL query string  | (when config is truesy) |
| 5. config.data          | controller's data        | (when config is truesy) |
```
So default values may be placed in config.data.
Direct access, i.e. `config.qs['name']`,
should be favoured when convenient for clarity and performance.


#### 2. Create dynamic URLs.
```js
config = {
  data: { account: 123, type: 'regular' },
  qs: {},
  hash: {},
  routes: {
    screen1: {
       path: '/other/screen1',
       paramsQs: ['region', 'club', 'account'],
       button: 'activate',          // no '_button' if no property or if empty
       container: 'pjax-container'  // HTML el ID. Defaults to ''
    }
  }
};

var urlAndCont = PJAX.link.getRouteUrlAndContainer('screen1', config),
// urlAndCont[0] is
//   /other/screen1?region=r1&club[0]=c1&club[1]=c2&account=123
//   &_button=activate&_widths=900,1200
// urlAndCont[1] is
//   'pjax-container'
```
The query string includes
- Any values already attached to `.path` e.g. path: '/other/screen1?field1=111'
- The `PJAX.link.getParam()` values for 'region', 'club' and 'account'.
- The current window and document widths.

#### 3. Dynamic anchor support
- An event handler for the anchor which is automatically removed when the HTML
is deleted by the next PJAX request.
- Route names with dynamic query strings.

```js
PJAX.link.pjaxLinkRoutes('pjax-container', config);
```
```html
<a pjax-route="screen1">Next page</a>
```
Assume the 'config' object in the previous section.
When `Next page` is clicked, jquery-pjax requests URL
`/other/screen1?region=r1&club[0]=c1&club[1]=c2&account=123&_button=activate&_widths=900,1200`
and places the results in container id 'pjax-container'.


***


### <a name="pjax-form"></a>pjax-form

#### 1. Addition support for forms.
- An event handler for the form which is automatically removed when the HTML
is deleted by the next PJAX request.
- Route names with dynamic query strings (as with pjax-link).
- Check if the form data is valid.
- Indicate which button caused the submit.

```js
PJAX.form.initPjaxForm('pjax-container', config, '[data-invalid]');
```
```html
<div id="pjax-container">
  <form pjax-route="screen1" method="POST">
    <select name="region" required>
      <option value="r1">region 1</option>
      <option value="r2">region 2</option>
    </select>
    <select name="club" size="3" multiple required>
      <option value="c1">club 1</option>
      <option value="c2">club 2</option>
      <option value="c3">club 3</option>
    </select>

    <input id="_button" name="_button" type="hidden">
    <button type="submit" value="player">Player or parent</button>
    <button type="submit" value="coach">Sign in as a coach</button>
  </form>
</div>
```
- The form data is considered valid if no element has a `data-invalid` attr.
Any selector allowed in `$(foo).find(...)` may be used.
- The form's `action` and `data-pjax` are set to the URL and container derived
from the route name, in the same manner as pjax-link.
- The query variable `_button` is returned with the `value` of the submit
button which initiated the form submit.
The server can use this to determine which action to perform.

The above form might return
- A request URL of
'/other/screen1?account=123&_widths=900,1200'
- A request method of 'POST'
- A request payload formatted like a $.ajax() POST request
containing the values of region, club and _button.

*Actually our example contains
`config.routes.screen1.paramsQs = ['region', 'club', 'account']`.
This would confusingly place the values of 'region' and 'club'
in the query string as well.*

#### 2. Customized form validation.
```js
PJAX.form.initPjaxForm('pjax-container', config, function ($form) {
  ... validate elements within jQuery element $form.
});
```
An alternative signature for the function.
The callback must return a boolean indicating if the form fields are valid.


***


### <a name="pjax-features"></a>pjax-features
[Modernizr] (https://github.com/Modernizr/Modernizr)
is commonly used to determine the features supported by the client.
You can [customize] (http://modernizr.com/download/)
which features it checks for.

It may be convenient for the server to know the features supported by
user agent running your app. The server could then, for example,
serve different HTML to smartphones, tablets and browsers.
The feature list should of course be sent just once.

```js
PJAX.onReady(function () {
    PJAX.loadCssUrls([
        '/prod/production.css'
    ]);
    PJAX.loadJsUrls([
        '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.js',
        '/prod/production.js'
    ], function () {
        PJAX.setUrlsAsLoaded([
            '/css/vendor/foundation.css',
            '/css/vendorpjax-responsive-tables.css',
            '/js/vendor/jquery.pjax.js',
            '/js/vendor/modernizr.js',
            '/js/vendor/foundation.js',
            '/js/vendor/foundation.abide.js',
            '/js/vendor/jquery-pjax-toolkit.js',
            '/js/app.js'
        ]);
        $.pjax({
            url: PJAX.feature.addClientInfo('/signin'),
            container: '#pjax-container'
        });
    });
});
```
The query string for /signin will contain the variable `_features`
which is a compressed version of the `Modernizr` JS variable
which modernizr.js exposes.

The query string may, for example, be:
```
_widths: '1287,1288'&_features={
"_base":["flexbox","flexboxlegacy","canvas","canvastext","webgl","geolocation","
postmessage","websqldatabase","indexeddb","hashchange","history","draganddrop","
websockets","rgba","hsla","multiplebgs","backgroundsize","borderimage","borderra
dius","boxshadow","textshadow","opacity","cssanimations","csscolumns","cssgradie
nts","cssreflections","csstransforms","csstransitions","fontface","generatedcont
ent","localstorage","sessionstorage","webworkers","applicationcache","svg","inli
nesvg","smil","svgclippaths","formvalidationapi","formvalidationmessage","formva
lidation"],
"input":["autocomplete","autofocus","list","placeholder","max","min","multiple",
"pattern","required","step"],
"inputtypes":["search","tel","url","email","date","month","week","time",
"datetime-local","number","range","color"]}
```


***


### <a name="pjax-responsive-tables"></a>pjax-responsive-tables
Zurb Inc's Foundation 5, is an open source, advanced, responsive front-end
CSS framework. Bootstrap is based on it.

pjax-responsive-tables is a modification of Zurb's open source
responsive-tables with support for jquery-pjax.
It should work with most CSS, including Foundation 5 and Bootstrap 3.

```html
<table class="responsive">
  <tbody>
    <tr>
        <th>Header 1</th>
        <th>Header 2</th>
        <th>Header 3</th>
        <th>Header 4</th>
        <th>Header 5</th>
        <th>Header 6</th>
        <th>Header 7</th>
        <th>Header 8</th>
    </tr>
    <tr>
        <td>row 1, cell 1</td>
        <td>row 1, cell 2</td>
        <td>row 1, cell 3</td>
        <td>row 1, cell 4</td>
        <td>row 1, cell 5</td>
        <td>row 1, cell 6</td>
        <td>row 1, cell 7</td>
        <td>row 1, cell 8</td>
    </tr>
    <tr>
        <td>row 2, cell 1</td>
        <td>row 2, cell 2</td>
        <td>row 2, cell 3</td>
        <td>row 2, cell 4</td>
        <td>row 2, cell 5</td>
        <td>row 2, cell 6</td>
        <td>row 2, cell 7</td>
        <td>row 2, cell 8</td>
    </tr>
  </tbody>
</table>
```
Just add the `responsive` class to your `table` tags to make them responsive.
Refer to Zurb's
[responsive-tables] (http://zurb.com/playground/responsive-tables)
for more information.


***


### <a name="pjax-app"></a>pjax-app
This is a micro framework based on jquery-pjax.
It is compatible with all the features of the toolkit
and it uses many of them behind the scenes.

Its goals are to:
- Route to controllers when PJAX content is inserted.
- Identify the status of the content: served, from cache, unloading, etc.
- Define routes for links and forms so click events issue dynamic URLs
for PJAX requests.
The URLs may include values from HTML elements, query or hash strings, or JS values.
- Convert between query/hash strings and JS objects.
- Cleanly pass data from the server, as well as HTML.

#### 1. PJAX controllers
```js
/**
 * Handlers for pjax loading/unloading
 * @param {string} action is 'load' or 'unload'.
 *      load   Called once pjax html has been loaded
 *      unload Called before pjax html is deleted
 *             Events within the container are automatically removed.
 * @param {object} options contains info about the pjax request.
 *    {boolean} options._isFirstCallRoute if first time controller called.
 *        e.g. signin/club
 *    {boolean} options._isFirstCallPath if first time URL's path called
 *        e.g. signin/club?region=r1&club=c1
 *    {boolean} options._isFromServer if PJAX content comes from server,
 *        else it comes from cache via back/forward buttons.
 * @param {string} path is (X-PJAX-URL) path being loaded/unloaded.
 * @param {string} containerId is ID of the container being loaded/unloaded.
 */

PJAX.controllers['signin/club'] = function(action, options, path, containerId) {

  var config = {
    data: { john: 123},
    qs: PJAX.qs.parseQs(window.location.search),
    hash: PJAX.qs.parseQs(window.location.hash),
    routes: {
      screen1: {
        path: '/other/screen1?field9=9999', button: 'myButton', container: '',
        paramsQs: ['region', 'club', 'john']
      },
      signin_club_post: {
        path: '/signin/club?field3=3333',
        paramsQs: 'john'
      }
    }
  };

  if (action === 'load') {

    // first call to controller
    if (options._isFirstCallRoute) {
    }

    // first call for path
    if (options._isFirstCallPath) {
    }

    if (options._isFromServer) {
      // loaded from the server
    } else {
      // loaded from cache
    }

    PJAX.app.addToolkitHandlers(containerId, config);

  } else {

    // pjax being unloaded
  }
};
```
This controller is called whenever the redirected URL of the PJAX call is
`http://foo.com/signin/club?...`.
The server provides this URL in the
[X-PJAX-URL] (https://coderwall.com/p/g3cttg) header of the PJAX response.

The controller is passed this URL's path (sign/club?...),
plus the id of target container.
This template has sections for:
- The first time a PJAX call is made to the controller.
- The first time a call is made for the path.
- When the content for the container has been received from the server.
- When the content has been retrieved from cache via back/forward arrows.
- Just before its container is replaced by another PJAX call.

'addToolKitHandler` adds event handers for features described previously:
- `<a href="/foo/bar?field1=111" pjax-anchor>this</a>`
- `<a pjax-route="route1">that</a>`
- `<form pjax-route="screen1" method="POST">`

jQuery itself removes constructs such as data and event handlers
from child elements before replacing those elements with new PJAX content.
So you do not need to handle that yourself.

#### 2. Packaging controllers

```js
QQ.loadJsUrls([
    '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.js',
    '/js/vendor/modernizr.js',
    '/js/vendor/jquery-pjax-toolkit.js',
    '/js/my-controllers.js'
], handler);
```
The simplest solution is to place all the PJAX controllers into
one or more external files and load them on the first page like any other asset.

```js
<div>...</div>
<script>
PJAX.requireCss([
    '/concat/my-controllers2.css'
]);
PJAX.requireJs([
    '/concat/my-controllers2.js'
], handler );
</script>
```
Alternatively you can serve a PJAX response containing inline script with
`PJAX.requireJs` and `PJAX.requireCss`
to load some controllers only when they are needed.

#### 3. What's up with inline scripts?
```js
<div>...</div>
<script>
    console.log('This JS script is running.');
</script>
```
Your server can send JS within inline script tags in the PJAX content,
and the JS will be executed when initially received.

Now however the user can use the back/forward buttons
to navigate among the cached PJAX-based pages.
jquery-pjax will display the HTML as expected
but the inline JavaScript will not be executed again.
That's because jquery-pjax, not surprisingly, uses `$(container).html(content)`
which removes the script while sanitizing the content.

```js
<div>...</div>
<script>
    console.log('This runs only the first time the PJAX content is displayed.');
</script>
<script pjax-run-always>
    console.log('This runs every time the PJAX content is displayed.');
</script>
```
Every time PJAX content is inserted,
pjax-app will manually `$('body').append()` (and hence run)
any inline script with a `pjax-run-always` attribute.
It will then remove that appended script.

#### 4. Data for controllers
```js
<div>...</div>
<script>
    PJAX.data['signin/club'] = {
        maxSignonAttempts: <%- maxSignonAttempts %>
    };
</script>
<script pjax-run-always>
    PJAX.data['signin/club'].clubNames = <%- JSON.stringify(clubNames) %>;
</script>
```
```js
PJAX.controllers['signin/club'] = function (action, options, path, containerId) {
  ...
  var maxSignonAttempts = PJAX.data['signin/club'].maxSignonAttempts,
    clubNames = PJAX.data['signin/club'].clubNames;
  ...
};
```
`<script>` is suited to configuring a controller for the session.
`<script pjax-run-always>` is suited to passing data to be used while
the current content is being displayed.


***


### jquery-pjax
IMHO opinion MV* and SPA designs are overkill for the majority of web sites,
as well as for the minimum viable product implementation of many startup ideas.

[jquery-pjax] (https://github.com/defunkt/jquery-pjax),
used in portions of github.com, supports a very simple,
viable design with a great performance profile if:
 - Displayed data does not have to change in real time e.g. no push is needed.
 - You do not display **lots** of data
 of which only small amounts change at any time, e.g. calendars.

[This article] (http://signalvnoise.com/posts/3112-how-basecamp-next-got-to-be-so-damn-fast-without-using-much-client-side-ui)
describes how [Basecamp] (http://basecamp.com),
a web application with high load and fast performance requirements,
uses a PJAX design (though not jquery-pjax) to achieve its goals.

jquery-pjax-toolkit's aim is to provide much of the client side tools needed
to achieve similar benefits for our projects.

### License
Copyright (c) 2014 John Szwaronek (<johnsz9999@gmail.com>).
Distributed under the MIT license. See LICENSE.md for details.