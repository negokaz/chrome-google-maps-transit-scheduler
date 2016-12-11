chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.url.match(new RegExp('^https://www.google.[^/]+/maps/dir/.+/am=t/.+')) && changeInfo.status === "complete") {
    chrome.tabs.executeScript(tabId, {file: 'bower_components/jquery/dist/jquery.js'}, function() {
      chrome.tabs.executeScript(tabId, {file: 'js/route_exporter.js'});
    });
    chrome.tabs.insertCSS(tabId, {file: 'style/route_exporter.css'});
  }
});
