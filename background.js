chrome.tabs.onUpdated.addListener(activatePageAction);

function activatePageAction(tabId, changeInfo, tab) {
  if (tab.url.indexOf('jira.mail.ru') > -1) {
    // Show icon for page action in the current tab.
    chrome.pageAction.show(tabId);
  }
}

function errorHandler() {
  console.log(arguments);
}

var INLINE_JS;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(sender.tab ?
    'from a content script:' + sender.tab.url :
    'from the extension'
  );

  switch (request.type) {
    case 'code':
      if (INLINE_JS) {
        sendResponse(INLINE_JS);
        return;
      }

      chrome.runtime.getPackageDirectoryEntry(function(root) {
        root.getFile('inline.js', {}, function(fileEntry) {
          fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
              INLINE_JS = this.result;

              sendResponse(INLINE_JS);
              chrome.pageAction.setIcon({
                tabId: sender.tab.id,
                path: 'jira_light.png'
              });

            };
            reader.readAsText(file);
          }, errorHandler);
        }, errorHandler);
      });

      return true;
  }
});
