let $ = jQuery;

const SPECIAL_CHARS = {
  18: '⌥', 16: '⇧', 17: '^', 8: '⌫', 46: '⌦', 9: '⇥', 13: '↵', 20: '⇪', 27: '⎋', 32: '␣', 33: '⇞', 34: '⇟', 35: '↘', 36: '↖', 37: '←', 38: '↑', 39: '→', 40: '↓'
};
const PREDEFINED_CHARS = {
  186: [';', ':'], 187: ['=', '+'], 188: [',', '<'], 189: ['-', '_'], 190: ['.', '>'], 191: ['/', '?'], 192: ['`', '~'], 219: ['[', '{'], 220: ['\\', '|'], 221: [']', '}'], 222: ["'", '"']
};
const DELTA = 1000;


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

    let symbol = SPECIAL_CHARS[evt.which];
    if (symbol) {
      return symbol;
    }

    symbol = PREDEFINED_CHARS[evt.which];
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
          timestamp - this._keyEventTimestamp > DELTA) {
          this._shortcut = '';

          this._keyEventTimestamp = 0;
        }

        if (!this._keyEventTimestamp ||
          timestamp - this._keyEventTimestamp < DELTA) {
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

    console.log(cutEvent);
  }

}

export default MinimalKeyboardDispatcher
