import KeyboardDispatcher from './keyboardDispatcher'
import KeydownMixin from './keydownMixin'
import EventDispatcher from 'common/eventDispatcher'
import CONSTS from 'common/consts'

const $ = jQuery;


/**
 * @mixes KeydownMixin
 * @mixes EventDispatcher
 */
class HotkeyCatcher {
  constructor (config) {
    this._onConfigChange = this._onConfigChange.bind(this);

    this._initPropsWithConfig(config);
    this._buildHotkeyTree();

    this._bindEvents();
  }

  _initPropsWithConfig (config) {
    Object.assign(this, /** @lends this */{
      '_delay': config.delay,
      '_hotkeys': config.hotkeys,

      '_canceledEvents': []
    });
  }

  destroy () {
    this._unbindEvents();
  }

  _bindEvents () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.addEventListener(eventName, this, true));

    document.addEventListener(CONSTS.event.configSet, this._onConfigChange);
  }

  _unbindEvents () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.removeEventListener(eventName, this, true));

    document.removeEventListener(CONSTS.event.configSet, this._onConfigChange);
  }

  _buildHotkeyNode (node, restChars, hotkey) {
    if (!restChars.length) {
      node.hotkey = hotkey;
      return;
    }

    let sign = restChars.shift();
    let char = restChars.shift();

    let next;

    if (sign === '+') {
      next = node.next = node.next || {};
    } else if (sign === ',') {
      next = node.delayedNext = node.delayedNext || {};
    }

    if (char) {
      next[char] = next[char] || {};
      this._buildHotkeyNode(next[char], restChars, hotkey);
    }
  }

  _onConfigChange (evt) {
    let config = evt.detail;

    this._initPropsWithConfig(config);
    this._buildHotkeyTree();
  }

  /**
   *
   * @param {String} hotkey `⌘ + l , 1`
   * @private
   */
  _buildHotkeyBranch (hotkey) {
    let restChars = hotkey.replace(/ /g, '').split('');
    let char = restChars.shift();

    this._root.next[char] = this._root.next[char] || {};

    return this._buildHotkeyNode(this._root.next[char], restChars, hotkey);
  }

  _buildHotkeyTree () {
    this._root = { next: {} };
    this._currentNode = this._root;

    this._hotkeys
      .filter((hotkeyObj) => !hotkeyObj.disabled)
      .map((hotkeyObj) => hotkeyObj.hotkey)
      .forEach((hotkey) => this._buildHotkeyBranch(hotkey));
  }

  _blockDefaultBehavior (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this._canceledEvents.push(evt);

    console.log('Event was canceled', evt);
  }

  _resetNodePointer () {
    this._currentNode = this._root;
    this.clearKeydownSymbols();
  }

  handleEvent (evt) {
    // don't process events on inputs
    if (jQuery(evt.target).is('textarea, input')) {
      return;
    }

    let symbol = KeyboardDispatcher.resolveKeyFromEvent(evt);
    let traverse;

    // TODO: if shortcut is `l` `Cmd + l` is caught as well
    if (evt.type === 'keydown') {
      console.group('KEYDOWN', this.__keydownSymbols);

      // timeout passed, reset the node pointer
      if (this.isEventTimeoutExpired(this._delay)) {
        console.log('Timeout expired!');
        this._resetNodePointer();
      } else {
        console.log('Timeout NOT expired!');
      }

      if (this.areKeydownsEmpty() && !this.isEventTimeoutExpired(this._delay)) {
        traverse = 'delayedNext';
      }

      if (!traverse) {
        traverse = 'next';
      }

      console.log('Traverse', traverse);

      if (!this._currentNode[traverse]) {
        console.log(`No '${traverse}' traverse in node`, this._currentNode);
        return this._resetNodePointer();
      }

      let traverseNode = this._currentNode[traverse][symbol];

      console.log('Traverse NODE', traverseNode);

      if (traverseNode) {
        this._currentNode = traverseNode;
        this._blockDefaultBehavior(evt);

        // we went to a leaf
        let hotkey = this._currentNode.hotkey;
        if (hotkey) {
          this._triggerHotkeyEvent(hotkey);
        } else {
          this.addKeydownSymbol(symbol);
        }

      }

      console.groupEnd();

    } else if (evt.type === 'keyup') {
      console.group('KEYUP');

      this.setEventTimestamp();
      this.removeKeydownSymbol(symbol);

      console.log('rest keydowns', this.__keydownSymbols);

      console.groupEnd();
    }

  }

  _triggerHotkeyEvent (hotkey) {
    console.log('Hotkey found!', hotkey);

    EventDispatcher.dispatchEvent(CONSTS.event.hotkey, hotkey);

  }
}

Object.assign(HotkeyCatcher.prototype, KeydownMixin);

export default HotkeyCatcher
