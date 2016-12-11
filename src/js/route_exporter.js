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
  var q = document.querySelectorAll.bind(document);
  var location = function () {
      var wp = q('.waypoint-address .first-line h2');
      return {
        from: wp[0].innerText,
        to: wp[wp.length - 1].innerText
      };
  };
  var details = function () {
      return encodeURIComponent(document.URL);
  };
  var dates = function () {
      if (
        q('.directions-mode-group-departure-time.time-with-period').length == 0
        || q('.section-directions-trip-walking-duration.section-directions-trip-secondary-text span').length == 0
      ) {
        return "";
      }

      var z = function(x) {
          return ('00' + x).slice(-2);
      };
      var utcMsec = function (msec) {
          var d = new Date(msec);
          return d.getUTCFullYear() + z(d.getUTCMonth() + 1) + z(d.getUTCDate()) + 'T' + z(d.getUTCHours()) + z(d.getUTCMinutes()) + '00Z';
      };
      var parseTransitTime = function (span) {
          var h = parseInt(span.innerText.split(':')[0], 10);
          var m = parseInt(span.innerText.split(':')[1], 10);
          return { hour: h, minutes: m };
      };
      var start = parseTransitTime(q('.directions-mode-group-departure-time.time-with-period')[0]);
      var end = parseTransitTime(q('.directions-mode-group-arrival-time.time-with-period')[1]);
      var duration = q('.section-directions-trip-walking-duration.section-directions-trip-secondary-text span')[1].innerText;
      var date =
        (document.URL.match(/!8j(\d+)/))
          ? new Date((parseInt(RegExp.$1) - 9 * 60 * 60) * 1000)
          : new Date();
      var dateLabel = (function() {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthNames[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear();
      })();
      var startMsec = Date.parse(dateLabel + ' ' + start.hour + ':' + start.minutes + ':00');
      var endMsec = Date.parse(dateLabel + ' ' + end.hour + ':' + end.minutes + ':00');
      if (!startMsec || !endMsec) return;

      return utcMsec(startMsec) + '/' + utcMsec(endMsec);
  };

  var dates = dates();
  var location = location();

  window.open('http://www.google.com/calendar/event?action=TEMPLATE'
    + '&text=' + location.from + ' → ' + location.to
    + '&details=' + details()
    + ((dates) ? ('&dates=' + dates) : "")
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
