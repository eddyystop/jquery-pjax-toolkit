/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

PJAX.form = {

// Convenience method.
  initPjaxForm: function initPjaxForm (containerId, config, getIsFormValid) {

    var pjaxForm = PJAX.form;
    pjaxForm._markFormButtonOnClick();
    pjaxForm._submitPjaxForm(containerId, getIsFormValid, config);

  },

// Mark submit button in form when it is clicked.
  _markFormButtonOnClick: function _markFormButtonOnClick () {
    $("form button[type=submit]").click(function() { //auto removed on HTML del

      $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
      $(this).attr("clicked", "true");

    });
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
      event.preventDefault();

      var isFormValid = typeof getIsFormValid === 'function' ?
        getIsFormValid($form) :
        $form.find(getIsFormValid || '[data-invalid]').length === 0;//abide dflt

      if (isFormValid) {

        // Save button causing the submit
        var clickedButton = $("button[type=submit][clicked=true]").val();
        $('#_button').val(clickedButton || '_defaultButton');

        // Convert route name to URL and PJAX container.
        var routeName = $form.attr('pjax-route');

        if (routeName && config && PJAX.link) {

          var urlAndCont = PJAX.link.getRouteUrlAndContainer(routeName, config);
          $form.attr('action', urlAndCont[0]);
          $form.attr('data-pjax', urlAndCont[1] || '#' + containerId);
        }

        // jquery-pjax can now handle it.
        var options = { push: true };
        $.pjax.submit(event, '#' + containerId, options);
      }
    });
  }
};