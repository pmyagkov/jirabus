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

let FILE_CACHE = {};

function readFile(fileName) {

  return new Promise((resolve, reject) => {

    if (FILE_CACHE[fileName]) {
      return resolve(FILE_CACHE[fileName]);
    }

    chrome.runtime.getPackageDirectoryEntry(function(root) {

      root.getFile(fileName, {}, function(fileEntry) {

        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            FILE_CACHE[fileName] = this.result;

            resolve({ [fileName]: FILE_CACHE[fileName] });
          };
          reader.readAsText(file);
        }, reject);
      }, reject);
    });
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(sender.tab ?
    'from a content script:' + sender.tab.url :
    'from the extension'
  );

  switch (request.type) {
    case 'code':
      Promise.all([readFile('inline.js'), readFile('inline.css')]).then((promiseValues) => {
        let response = Object.assign({}, ...promiseValues);
        sendResponse(response);
      }, errorHandler);

      chrome.pageAction.setIcon({
        tabId: sender.tab.id,
        path: 'jira_light.png'
      });
      console.log('TAB', sender.tab);

      return true;
  }
});
