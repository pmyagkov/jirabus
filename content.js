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
}

chrome.runtime.sendMessage({ type: 'code' }, (response) => {
  console.log('content', response);

  Object.keys(response).forEach((fileName) => {
    let code = response[fileName];
    let ext = fileName.split('.');
    ext = ext[ext.length - 1];

    inlineCode(ext, code);
  });
});
