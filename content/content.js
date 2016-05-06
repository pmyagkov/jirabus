import CONSTS from 'common/consts'
import EventDispatcher from 'common/eventDispatcher'

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

document.addEventListener(CONSTS.command.setConfig, (evt) => {
  let config = evt.detail;

  let request = {
    command: CONSTS.command.setConfig,
    data: config
  };

  chrome.runtime.sendMessage(request,
    (response) => EventDispatcher.dispatchEvent(CONSTS.event.configSet, config));
});

chrome.runtime.sendMessage({ command: CONSTS.command.getCode }, (response) => {
  let { data, command } = response;

  if (command !== CONSTS.command.getCode) {
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
      EventDispatcher.dispatchEvent('config', config);
    }
  });

  console.groupEnd();
});
