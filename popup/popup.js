const GET_CONFIG_COMMAND = 'get-config';

class Popup {
  constructor () {
    this.getConfig().then((config) => {
      jQuery(() => {
        this._$form = $('form');

        this.displayConfig(config);
        this.bindEvents();
      });
    });
  }

  displayConfig (config) {
    let hotkeys = config.hotkeys;
    Object.keys(hotkeys)
      .forEach((hotkey) => this._appendHotkeysRow(Object.assign({}, hotkeys[hotkey], { hotkey })));

    this._$form.append($('<button class="add">Add</button>'));
  }

  /**
   *
   * @param hotkeyObj
   * @param hotkeyObj.hotkey
   * @param hotkeyObj.actions
   * @param hotkeyObj.description
   * @private
   */

  _appendHotkeysRow (hotkeyObj = { hotkey: '', actions: [''], description: ''}) {

    let $container = $('<div class="hotkey-container">');
    $container.appendTo(this._$form);

    $container
      .append(`<input type="text" class="hotkey" value="${hotkeyObj.hotkey}" placeholder="Type hotkey">`);

    hotkeyObj.actions.forEach((action) => {
      let splitAction = action.split(' ');
      action = splitAction[0];

      let selector = splitAction.length > 1 ? splitAction.slice(1).join(' ')  : '';

      $container
        .append(`<input type="text" class="selector" value="${selector}" placeholder="Choose an element to click">`);
    });

    $container
      .append(`<button class="disable">Disable</button>`)
      .append(`<button class="remove">Remove</button>`);
  }

  bindEvents () {
    this._$form.on('click', '.add', (evt) => this._onAddClick(evt));
  }

  _onAddClick (evt) {
    evt.preventDefault();

    this._appendHotkeysRow();


  }

  getConfig () {
    console.log('Trying to request config');

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: GET_CONFIG_COMMAND }, (response) => {
        console.group('JIRAbus.popup.getConfig');
        console.log('Got response', response);

        let { command, data } = response;
        if (command !== GET_CONFIG_COMMAND) {
          console.log('Strange request received! Abort.');
          console.groupEnd();

          reject();
        }

        console.log('Got config', data.config);
        resolve(data.config);

      });
    });
  }
}

new Popup;
/*


if (false) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
      console.log(response.farewell);
    });
  });
}
*/
