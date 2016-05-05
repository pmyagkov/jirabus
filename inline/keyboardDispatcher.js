import KeydownMixin from './keydownMixin'

let $ = jQuery;

const SPECIAL_CHARS = {
  18: '⌥', 16: '⇧', 17: '^', 8: '⌫', 46: '⌦', 9: '⇥', 13: '↵', 20: '⇪', 27: '⎋', 32: '␣', 33: '⇞', 34: '⇟', 35: '↘', 36: '↖', 37: '←', 38: '↑', 39: '→', 40: '↓'
};
const PREDEFINED_CHARS = {
  186: [';', ':'], 187: ['=', '+'], 188: [',', '<'], 189: ['-', '_'], 190: ['.', '>'], 191: ['/', '?'], 192: ['`', '~'], 219: ['[', '{'], 220: ['\\', '|'], 221: [']', '}'], 222: ["'", '"']
};
const DELTA = 1000;


class KeyboardDispatcher {
  static connect (target) {
    KeyboardDispatcher._map = KeyboardDispatcher._map || new WeakMap();
    KeyboardDispatcher._map.set(target, new KeyboardDispatcher(target));
  }

  static disconnect (target) {
    let instance = KeyboardDispatcher._map.get(target);
    if (!instance) {
      return;
    }

    KeyboardDispatcher._map.delete(target);

    let hotkey = instance.getHotkey();

    instance.destroy();
    instance = null;

    return hotkey;
  }

  constructor (target) {
    this._$target = $(target);
    this._handleEvent = this._handleEvent.bind(this);

    this._shortcut = '';
    this.__keydownSymbols = [];
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

  static resolveKeyFromEvent (evt) {
    if (evt.metaKey && [91, 93].includes(evt.which)) {
      return '⌘';
    }

    let symbol = SPECIAL_CHARS[evt.which];
    if (symbol) {
      return symbol;
    }

    symbol = PREDEFINED_CHARS[evt.which];
    if (symbol) {
      return symbol[evt.shiftKey ? 1 : 0];
    }

    return String.fromCharCode(evt.which).toLowerCase();
  }

  _handleEvent (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    let symbol = this.resolveKeyFromEvent(evt);

    this._printKeyboardEvent(evt, { symbol });

    let timestamp = Date.now();

    switch (evt.type) {
      case 'keydown':
        if (this._keyEventTimestamp &&
          timestamp - this._keyEventTimestamp > DELTA) {
          this._shortcut = '';

          this._keyEventTimestamp = 0;
        }

        if (!this._keyEventTimestamp ||
          timestamp - this._keyEventTimestamp < DELTA) {
          this.addKeydownSymbol(symbol);

          this._keyEventTimestamp = 0;

          this._$target.val((this._shortcut ? `${this._shortcut}, ` : '') + this.formatKeydowns());
        }

        break;

      case 'keyup':
        // TODO: check if keyupTimestamp is not expired
        this.removeKeydownSymbol(symbol);

        if (!this.__keydownSymbols.length) {
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

    console.log(cutEvent);
  }

}

Object.assign(KeyboardDispatcher.prototype, KeydownMixin);

export default KeyboardDispatcher
