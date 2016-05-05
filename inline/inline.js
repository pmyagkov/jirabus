import CapturerPanel from './capturerPanel'
import MinimalKeyboardDispatcher from './minimalKeyboardDispatcher'
import KeyboardDispatcher from './keyboardDispatcher'
import DomObserver from './domObserver'

/**
 * Name of this function should never be changed because it's called from inline script!!!
 * @param config
 */
let keyboardDispatcher;
let capturer;
let domObserver;

function main(config) {
  if (keyboardDispatcher) {
    // TODO: clean dispatcher and reconfig it
  }

  keyboardDispatcher = new KeyboardDispatcher(config);
  capturer = new CapturerPanel(config);
  domObserver = new DomObserver(config);
}

document.addEventListener('config', (evt) => {
  let config = evt.detail;
  return main(config);
});
