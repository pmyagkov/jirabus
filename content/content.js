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

const commandEventHash = {
  [CONSTS.command.setConfig] : CONSTS.event.configSet,
  [CONSTS.command.sendFeedback] : CONSTS.event.feedbackSent
};

function bindEvents () {
  Object.keys(commandEventHash).forEach((command) => {
    document.addEventListener(command, onCommand);
  });
}

function onCommand (evt) {
  let data = evt.detail;
  let command = evt.type;

  chrome.runtime.sendMessage({ command, data },
    (response) => {
      EventDispatcher.dispatchEvent(commandEventHash[command], response.data)
    });
}

bindEvents();

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
