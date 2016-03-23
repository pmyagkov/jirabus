var SCRIPT_ID = 'jirabus-inline';

function isCodeInlined() {
  return !!document.getElementById('jirabus-inline');
}

function inlineCode(code, force) {
  if (!force && isCodeInlined()) {
    return;
  }

  var script = document.createElement('script');
  script.setAttribute('id', SCRIPT_ID);
  script.textContent = code;

  document.body.appendChild(script);
}

chrome.runtime.sendMessage({ type: 'code' }, (response) => {
  console.log('content', response);

  inlineCode(response);
});
