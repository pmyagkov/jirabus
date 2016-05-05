function isCodeInlined(ext) {
  return !!document.getElementById(`jirabus-${ext}`);
}

function inlineCode(ext, code, force) {
  if (!force && isCodeInlined(ext)) {
    return;
  }

  var codeNode = document.createElement(ext === 'js' ? 'script' : 'style');
  codeNode.setAttribute('id', `jirabus-${ext}`);
  codeNode.textContent = code;

  document.body.appendChild(codeNode);

  return codeNode;
}

let GET_CODE_COMMAND = 'get-code';
let SET_CONFIG_COMMAND = 'set-config';

document.addEventListener(SET_CONFIG_COMMAND, (evt) => {
  let config = evt.detail;

  let request = {
    command: SET_CONFIG_COMMAND,
    data: config
  };

  chrome.runtime.sendMessage(request, (response) => {
    var event = new CustomEvent('set-config-success', { detail: config });
    document.dispatchEvent(event);
  });
});

chrome.runtime.sendMessage({ command: GET_CODE_COMMAND }, (response) => {
  let { data, command } = response;

  if (command !== GET_CODE_COMMAND) {
    return;
  }

  console.group('JIRAbus.sendMessage.callback');
  console.log('Got response', response);

  let config = data.config;
  delete data.config;

  Object.keys(data).forEach((fileName) => {
    let code = data[fileName];
    let ext = fileName.split('.');
    ext = ext[ext.length - 1];

    let codeNode = inlineCode(ext, code);
    if (ext === 'js') {
      document.dispatchEvent(new CustomEvent('config', { 'detail':  config }));
    }
  });

  console.groupEnd();
});
