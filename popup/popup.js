let port;

function getConfig () {
  const GET_CONFIG = 'get-config';

  port = chrome.extension.connect({ name: "popup" });
  port.postMessage({ command: GET_CONFIG});

  return new Promise(function (resolve, reject) {
    port.onMessage.addListener((data) => {
      if (data.command === GET_CONFIG) {
        resolve(data.data);
      }
    })
  });
}


/**
 *
 * @param config
 * config
 */

function displayConfig (config) {
  let $form = $('form');


}


getConfig().then((config) => {
  jQuery(displayConfig.bind(null, config));
});


if (false) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
      console.log(response.farewell);
    });
  });
}
