$(function() {

var waitUntil = function(condidate, interval, callback) {
  var inner = function() {
    if (condidate()) {
      return callback();
    } else {
      setTimeout(function() { inner(condidate, interval, callback) }, interval);
    }
  };
  setTimeout(inner, interval);
};

var exportToCalendar = function() {
  var $trip = $('.trip-content');

  var location = function () {
      var $waypoints = $trip.find('.waypoint-address .first-line h2');
      return {
        from: $waypoints.filter(':first').text(),
        to:   $waypoints.filter(':last').text()
      };
  };

  var details = function () {
      var normalizeText = function(text) {
        return text.replace(/\s+/g, " ").trim();
      };
      var transit = function() {
        var transit = '↓';
        var $directions = $trip.find('.directions-mode-group.closed');
        for(var i = 0; i < $directions.length; i++) {
          var $transitStops = $($directions[i]).find('.transit-stop');
          var $transitSteps = $($directions[i]).find('.transit-logical-step-content .transit-logical-step-header');
          for (var j = 0; j < Math.max($transitStops.length, $transitSteps.length); j++) {
            if ($transitStops[j]) {
              transit += '\n' + normalizeText($transitStops[j].innerText);
            }
            if ($transitSteps[j]) {
              transit += '\n' + '↓ ' + normalizeText($transitSteps[j].innerText);
            }
          }
        };
        return transit;
      };

      var $waypoints = $trip.find('.waypoint');
      if ($waypoints[0]) {
        return     normalizeText($waypoints.filter(':first').text())
          + '\n' + transit()
          + '\n' + normalizeText($waypoints.filter(':last').text())
          + '\n'
          + '\n' + document.URL;
      } else {
        return document.URL;
      }
  };

  var dates = function () {
      var $startTime = $trip.find('.directions-mode-group-departure-time.time-with-period:first');
      var $endTime   = $trip.find('.directions-mode-group-arrival-time.time-with-period:last');

      if ($startTime.length == 0 || $endTime.length == 0) {
        return "";
      }

      var parseDate = function($time, baseDate) {
        var parseTransitTime = function (timeText) {
            return {
              hour:    parseInt(timeText.split(':')[0], 10),
              minutes: parseInt(timeText.split(':')[1], 10)
            };
        };
        var time = parseTransitTime($time.text());
        return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), time.hour, time.minutes, 0, 0);
      };

      var baseDate =
        (document.URL.match(/!8j(\d+)/))
          ? new Date((parseInt(RegExp.$1) - 9 * 60 * 60) * 1000)
          : new Date();

      var formatAsUTC = function (date) {
          var fillZero = function(x) {
              return ('00' + x).slice(-2);
          };
          return ""
            + date.getUTCFullYear()
            + fillZero(date.getUTCMonth() + 1)
            + fillZero(date.getUTCDate()) + 'T'
            + fillZero(date.getUTCHours())
            + fillZero(date.getUTCMinutes())
            + '00Z';
      };

      return formatAsUTC(parseDate($startTime, baseDate)) + '/' + formatAsUTC(parseDate($endTime, baseDate));
  };

  var location = location();
  var dates = dates();

  window.open('http://www.google.com/calendar/event?action=TEMPLATE'
    + '&text=' + location.from + ' → ' + location.to
    + '&details=' + encodeURIComponent(details())
    + (dates ? '&dates=' + dates : '')
    + '&location=' + location.to
    + '&trp=true');
};

var prependTriggerButton = function() {
  if ($(".__route_export_trigger").length == 0) {
    var trigger = $('<button>').addClass('__route_export_trigger').attr({ title: "Google Maps Transit Scheduler" });
    trigger.click(exportToCalendar);
    $(".section-directions-details-action").prepend(trigger);
  }
};

var actionExists = function() {
  return $(".section-directions-details-action").length > 0;
};

waitUntil(actionExists, 100, prependTriggerButton);

});
