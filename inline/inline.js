import ExtensionPanel from './extensionPanel'
import HotkeyCatcher from './hotkeyCatcher'
import DomObserver from './domObserver'

/**
 * Name of this function should never be changed because it's called from inline script!!!
 * @param config
 */
let hotkeyCatcher;
let extensionPanel;
let domObserver;

function main(config) {
  hotkeyCatcher = new HotkeyCatcher(config);

  extensionPanel = new ExtensionPanel(config);
  domObserver = new DomObserver(config);
}

document.addEventListener('config', (evt) => {
  let config = evt.detail;
  return main(config);
});
