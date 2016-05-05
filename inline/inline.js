'use strict';

let $ = jQuery;

let EXTENSION_NAME = 'JIRABus';

function log () {
  return console.log(...[EXTENSION_NAME].concat(Array.from(arguments)));
}

function group () {
  return console.group(...[EXTENSION_NAME].concat(Array.from(arguments)));
}

function groupEnd () {
  return console.groupEnd();
}

function error () {
  return console.error(...[EXTENSION_NAME].concat(Array.from(arguments)));
}

class CapturerPanel {
  constructor (config) {
    this._capturing = false;
    this._config = config;
    this._hotkeysCounter = 0;

    this._createPanelDOM();
    this._bindEvents();
  }

  _createPanelDOM () {
    this._$panel = $(`<div class="capture-panel capture-panel_opened">
      <a class="open-toggler" href="#"></a>
      <label for="indicator-checkbox" class="indicator">
        <input type="checkbox" id="indicator-checkbox" class="indicator-checkbox">
        <span class="indicator-icon"></span>
        <span class="indicator-text indicator-text_on"></span>
        <span class="indicator-text indicator-text_off"></span>
      </label>
      <ul class="hotkeys"></ul>
    </div>`);

    $(document.body).append(this._$panel);

    this._$hotkeys = this._$panel.find('.hotkeys');
    let hotkeys = this._config.hotkeys;

    hotkeys
      .forEach((hotkeyObj) => {
        hotkeyObj.id = this._hotkeysCounter++;
        this._appendHotkeyRow(hotkeyObj);
      });

  }

  /**
   *
   * @param hotkeyObj
   * @param hotkeyObj.id
   * @param hotkeyObj.hotkey
   * @param hotkeyObj.selector
   * @param hotkeyObj.action
   * @param hotkeyObj.description
   *
   * @param prepend Добавлять в начало или в конец списка?
   * @private
   */

  _appendHotkeyRow (hotkeyObj = { id: -1, hotkey: '', action: 'click', selector: '', description: ''}, prepend = false) {
    let $container;

    let appendFunc = prepend ? 'prependTo' : 'appendTo';

    $container = $(`<li class="hotkeys-item" data-id="${hotkeyObj.id}">`)[appendFunc](this._$hotkeys);

    $container
      .append(`<input type="text" class="selector" value="${hotkeyObj.selector}" placeholder="Choose an element to click">`);

    $container
      .append(`<input type="text" class="hotkey" value="${hotkeyObj.hotkey}" placeholder="Type hotkey">`);

    /*$container
     .append(`<button class="disable">Disable</button>`)
     .append(`<button class="remove">Remove</button>`);*/

    return $container;
  }

  _getHotkeyById (id) {
    return this._config.hotkeys.find((h) => h.id === id);
  }

  _bindEvents () {
    this._$panel.on('change', 'input[type="checkbox"]', this._onCaptureChange.bind(this));
    this._$panel.on('click', '.open-toggler', this._onArrowClick.bind(this));

    this._$panel.on('mouseenter mouseleave', '.selector', this._onSelectorHover.bind(this));

    this._$panel.on('focusin focusout', '.hotkey', this._onHotkeyFocusChange.bind(this));

    $(document).on('set-config-success', this._onConfigSet.bind(this));
  }

  _onConfigSet () {
    this._$panel.find('.loading').each((i, el) => $(el).removeClass('loading'));


  }

  _onHotkeyFocusChange (evt) {
    let focusValue = evt.type === 'focusin';

    if (focusValue) {
      MinimalKeyboardDispatcher.connect(evt.target);
      $(evt.target).val('');
    } else {

      let hotkey = MinimalKeyboardDispatcher.disconnect(evt.target);
      let id = $(evt.target).closest('.hotkeys-item').data('id');

      this._setHotkey(hotkey, id);
    }
  }

  _setHotkey (hotkey, id) {
    let $item = this._$panel.find(`[data-id="${id}"]`);
    if (!$item.length) {
      return;
    }

    let hotkeyObj = this._getHotkeyById(id);
    hotkeyObj.hotkey = hotkey;

    $item.addClass('loading');

    this._saveConfig();
  }

  _saveConfig () {
    document.dispatchEvent(new CustomEvent('set-config', { 'detail':  this._config }));
  }

  _onSelectorHover (evt) {
    let hoverValue = evt.type === 'mouseenter';
    let selector = evt.target.value;
    $(selector).toggleClass('jirabus-border', hoverValue);
  }

  _onCaptureChange (evt) {
    this._capturing = evt.target.checked;

    console.log('CapturerPanel._onChange', 'Capturing is turned ', this._capturing ? 'on' : 'off');

    this[this._capturing ? '_startCapture' : '_stopCapture']();
  }

  _onArrowClick (evt) {
    let baseClass = this._$panel[0].classList.item(0);
    this._$panel.toggleClass(baseClass + '_opened');
  }

  _isValidElement (target) {
    if (!this._capturing) {
      return false;
    }

    if (this._$panel[0].contains(target)) {
      return false;
    }

    // element has neither a class nor the id
    if (target.classList.toString() === '' && !target.getAttribute('id')) {
      return false;
    }

    return true;
  }

  handleEvent (evt) {
    if (!this._isValidElement(evt.target)) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    switch (evt.type) {
      case 'mouseover':
        return this._onCaptureMouseOver(evt.target);
      case 'mouseout':
        return this._onCaptureMouseLeave(evt.target);
      case 'click':
        return this._onCaptureClick(evt.target);
    }
  }

  _onCaptureMouseOver (target) {
    target.classList && target.classList.add('jirabus-border');
  }

  _onCaptureMouseLeave (target) {
    target.classList && target.classList.remove('jirabus-border');
  }

  _onCaptureClick (target) {
    let selector = this._calculateSelector(target);
    let hotkey = '';
    let hotkeyObj = this._createBlankHotkeyObj(hotkey, selector);

    let $hotkeyItem = this._appendHotkeyRow(hotkeyObj, true);
    $hotkeyItem.find('.hotkey').focus();
  }

  _calculateSelector (target, relative) {
    let idClosest = $(target).closest('[id]')[0];
    let selector;
    if (!idClosest) {
      selector = `.${target.classList.toString().split(' ').join('.')}`;
    } else {
      if (idClosest === target) {
        selector = `#${target.getAttribute('id')}`;
      }
    }

    // пытаемся посчитать количество элементов в селекторе
    var queriedSelector = $(selector);
    if (queriedSelector.length === 1) {
      // это правильный селектор
      return selector;
    } else {
      let index = queriedSelector.findIndex((elem) => elem === target);
      if (index > -1) {
        selector += `:eq(${index})`;
      }
    }

    return selector;
  }

  _createBlankHotkeyObj (hotkey = '', selector = '') {
    var hotkeyObj = {
      id: this._hotkeysCounter++,
      hotkey: hotkey,
      selector: selector,
      action: '',
      description: ''
    };

    this._config.hotkeys.push(hotkeyObj);

    return hotkeyObj;
  }

  _startCapture() {
    document.addEventListener('mouseover', this, true);
    document.addEventListener('mouseout', this, true);
    document.addEventListener('click', this, true);
  }

  _stopCapture() {
    document.removeEventListener('mouseover', this, true);
    document.removeEventListener('mouseout', this, true);
    document.removeEventListener('click', this, true);
  }
}


class MinimalKeyboardDispatcher {
  static connect (target) {
    MinimalKeyboardDispatcher._map = MinimalKeyboardDispatcher._map || new WeakMap();
    MinimalKeyboardDispatcher._map.set(target, new MinimalKeyboardDispatcher(target));
  }

  static disconnect (target) {
    let instance = MinimalKeyboardDispatcher._map.get(target);
    if (!instance) {
      return;
    }

    MinimalKeyboardDispatcher._map.delete(target);

    let hotkey = instance.getHotkey();

    instance.destroy();
    instance = null;

    return hotkey;
  }

  constructor (target) {
    this._$target = $(target);
    this._handleEvent = this._handleEvent.bind(this);

    this._shortcut = '';
    this._downedKeys = [];
    this._keyEventTimestamp = 0;

    this._bindEvents();
  }

  destroy () {
    this._unbindEvents();
  }

  getHotkey () {
    return this._$target.val();
  }

  _bindEvents () {
    this._$target.on('keydown keyup', this._handleEvent);
  }

  _unbindEvents () {
    this._$target.off('keydown keyup', this._handleEvent);
  }

  _resolveKeyFromEvent (evt) {
    if (evt.metaKey && [91, 93].includes(evt.which)) {
      return '⌘';
    }

    let symbol = MinimalKeyboardDispatcher.SPECIAL_CHARS[evt.which];
    if (symbol) {
      return symbol;
    }

    symbol = MinimalKeyboardDispatcher.PREDEFINED_CHARS[evt.which];
    if (symbol) {
      return symbol[evt.shiftKey ? 1 : 0];
    }

    return String.fromCharCode(evt.which);
  }

  static cutSymbolFromArray (arr, symbol, index) {
    index = Number.isInteger(index) ? index : arr.findIndex(s => s === symbol);

    if (index === -1) {
      return arr;
    }

    return [].concat(arr.slice(0, index), arr.slice(index + 1));
  }

  _formatKeyDowns () {
    let index;
    let unformatted = [...this._downedKeys];
    let formatted = [];
    while ((index = unformatted.findIndex(key => ['⌥', '⇧', '^', '⌘'].includes(key))) !== -1) {
      formatted.push(unformatted[index]);
      unformatted =
        MinimalKeyboardDispatcher.cutSymbolFromArray(unformatted, null, index);
    }

    formatted = formatted.concat(unformatted);

    return formatted.join(' + ').toLowerCase();
  }

  _addKeyDown (symbol) {
    if (!this._downedKeys.includes(symbol)) {
      this._downedKeys.push(symbol);
    }
  }

  _handleEvent (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    let symbol = this._resolveKeyFromEvent(evt);

    this._printKeyboardEvent(evt, { symbol });

    let timestamp = Date.now();

    switch (evt.type) {
      case 'keydown':
        if (this._keyEventTimestamp &&
          timestamp - this._keyEventTimestamp > MinimalKeyboardDispatcher.DELTA) {
          this._shortcut = '';

          this._keyEventTimestamp = 0;
        }

        if (!this._keyEventTimestamp ||
          timestamp - this._keyEventTimestamp < MinimalKeyboardDispatcher.DELTA) {
          this._addKeyDown(symbol);

          this._keyEventTimestamp = 0;

          this._$target.val((this._shortcut ? `${this._shortcut}, ` : '') + this._formatKeyDowns());
        }

        break;

      case 'keyup':
        // TODO: check if keyupTimestamp is not expired

        this._downedKeys =
          MinimalKeyboardDispatcher.cutSymbolFromArray(this._downedKeys, symbol);

        if (!this._downedKeys.length) {
          this._keyEventTimestamp = timestamp;
          this._shortcut = this._$target.val();
        }

        break;
    }
  }


  _printKeyboardEvent (evt, restObj = {}) {
    var cutEvent = {};
    ['type', 'which', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey']
      .forEach((key) => cutEvent[key] = evt[key]);

    cutEvent['key'] = String.fromCharCode(evt.which);

    Object.assign(cutEvent, restObj);

    log(cutEvent);
  }

}

MinimalKeyboardDispatcher.SPECIAL_CHARS = {
  18: '⌥', 16: '⇧', 17: '^', 8: '⌫', 46: '⌦', 9: '⇥', 13: '↵', 20: '⇪', 27: '⎋', 32: '␣', 33: '⇞', 34: '⇟', 35: '↘', 36: '↖', 37: '←', 38: '↑', 39: '→', 40: '↓'
};

MinimalKeyboardDispatcher.PREDEFINED_CHARS = {
  186: [';', ':'], 187: ['=', '+'], 188: [',', '<'], 189: ['-', '_'], 190: ['.', '>'], 191: ['/', '?'], 192: ['`', '~'], 219: ['[', '{'], 220: ['\\', '|'], 221: [']', '}'], 222: ["'", '"']
};

MinimalKeyboardDispatcher.DELTA = 1000;



class KeyboardDispatcher {
  constructor (config) {
    this._config = config;

    this._decl = [];
    this._queue = [];
    this._canceledEvents = [];

    //this._blockExistedHandlers();
    this._parseHotkeys();
  }

  _parseHotkeys () {
    console.group('JIRAbus._parseHotkeys');

    this._config.hotkeys.forEach((hotkeyObj) => {
      console.log('Parse', hotkeyObj);

      this._decl.push(Object.assign({}, hotkeyObj));

      /*this._queue.push({
       keys: [...hotKeyDeclaration.keys],
       action: hotKeyDeclaration.action,
       targetSelector: hotKeyDeclaration.targetSelector,
       index: this._decl.length - 1,
       lastHit: null
       });*/

    });
  }

  _blockExistedHandlers () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.addEventListener(eventName, this.processEvent.bind(this), true));
  }

  doAction (item) {
    let elem = jQuery(item.selector)[0];
    if (!elem) {
      error(`No elem with '${item.selector}' found. Can't do action '${item.action}'!`);
      return;
    }

    if (typeof elem[item.action] !== 'function') {
      error(`Elem '${item.selector}' doesn't contain action '${item.action}'!`);
      return;
    }

    elem[item.action]();
  }

  printKeyboardEvent (evt) {
    var cutEvent = {};
    ['type', 'which', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey']
      .forEach((key) => cutEvent[key] = evt[key]);

    cutEvent['key'] = String.fromCharCode(evt.which);

    log(cutEvent);
  }

  renewShortcut (queueItem) {
    queueItem.lastHit = null;
    //queueItem.keys = [...this._decl[queueItem.index].keys];
  }

  _cancelEvent (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this._canceledEvents.push(evt);

    log('Event was canceled', evt);
  }

  /*processEvent (evt) {
   //this.printKeyboardEvent(evt);

   // пропускаем события на инпутах
   if (jQuery(evt.target).is('textarea, input')) {
   return;
   }

   let key = String.fromCharCode(evt.which);
   let now = Date.now();

   // ищем хоткей, подходящий по клавишам и `target` которого присутствует на странице
   let matchedItems =
   this._queue.filter(
   (item) => item.keys[0] === key && jQuery(item.targetSelector).length
   );

   log('MATCHED ITEMS', matchedItems);

   if (['keydown', 'keypress', 'keyup'].includes(evt.type) && matchedItems.length) {
   this._cancelEvent(evt);

   if (evt.type === 'keyup') {
   matchedItems.forEach(item => {
   if (item.lastHit && item.lastHit + this._config.delay >= now || item.lastHit === null) {
   // валидный случай
   item.lastHit = now;

   item.keys.shift();
   // мы добрались до конца
   if (!item.keys.length) {
   // TODO: нужно обновлять все шорткаты, начинающиеся с одной буквы
   // лучше с самого начала зацепленные выносить в отдельную очередь, а текущую блокировать
   this.renewShortcut(item);

   // здесь нужно эмитить событие, но пока сделаем так
   this.doAction(item);
   }
   } else {
   this.renewShortcut(item);
   }
   }, this);
   }
   }
   }*/
}

class DomObserver {
  constructor (config) {
    this._config = config;

    this._labelTargets();
    this._initMutationObserver();

    this._bindEvents();

    this._startObserving();
  }

  _bindEvents () {
    $(document).on('set-config-success', this._onConfigSet.bind(this));

  }

  _startObserving () {
    this._observer.observe(document.body, { subtree: true, childList: true });
  }

  _initMutationObserver () {
    this._observer = new MutationObserver((records) =>  {
      log('MO HANDLER', 'started', Array.from(arguments));

      if (records.every(r => r.addedNodes.length === 0)) {
        log('NO added nodes. Terminating!');
        return;
      }

      this._observer.disconnect();
      this._labelTargets();
      this._startObserving();
    });
  }

  _onConfigSet () {
    this._labelTargets(true);
  }

  _labelTargets (force) {
    group('LABEL ACTIONS');

    this._config.hotkeys.forEach((hotkeyObj) => {
      let target = jQuery(hotkeyObj.selector)[0];
      log(hotkeyObj.selector);

      if (!target || (!force && target.getAttribute('data-jirabus'))) {
        log('NO NODE or ALREADY PROCESSED');
        return;
      }

      let $hotkeyElement = jQuery('<b>')
        .addClass('jirabus-hotkey')
        .text(hotkeyObj.hotkey);

      log('PROCESS', target);

      // TODO: надо сделать интеллектуальный поиск ноды с текстом
      let $target = jQuery(target).attr('data-jirabus', 'true');
      // для случая кнопок-действия
      let $textNode = $target.find('.trigger-label');
      if (!$textNode.length) {
        $textNode = $target;
      }

      $textNode.append($hotkeyElement);

    });

    groupEnd();
  }
}

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
