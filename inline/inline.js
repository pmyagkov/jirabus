import CapturerPanel from './capturerPanel'
import HotkeyCatcher from './hotkeyCatcher'
import DomObserver from './domObserver'

/**
 * Name of this function should never be changed because it's called from inline script!!!
 * @param config
 */
let hotkeyCatcher;
let capturer;
let domObserver;

function main(config) {
  if (hotkeyCatcher) {
    // TODO: clean dispatcher and reconfig it
  }

  hotkeyCatcher = new HotkeyCatcher(config);
  capturer = new CapturerPanel(config);
  domObserver = new DomObserver(config);
}

document.addEventListener('config', (evt) => {
  let config = evt.detail;
  return main(config);
});
