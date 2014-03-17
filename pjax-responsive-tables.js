/* jshint jquery, strict: true */
/* global $, PJAX */

var PJAX = PJAX || {};

/* Based on:
 http://zurb.com/playground/projects/responsive-tables/index.html
 http://zurb.com/playground/responsive-tables
 */
$(document).ready(function() {
  var switched = false;

  var updateTables = function() {
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