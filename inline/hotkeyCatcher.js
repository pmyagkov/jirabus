import KeyboardDispatcher from './keyboardDispatcher'
import KeydownMixin from './keydownMixin'

const $ = jQuery;


/*class KeyboardDispatcher {
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

    });

    console.groupEnd();
  }

  _blockExistedHandlers () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.addEventListener(eventName, this.processEvent.bind(this), true));
  }



  printKeyboardEvent (evt) {
    var cutEvent = {};
    ['type', 'which', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey']
      .forEach((key) => cutEvent[key] = evt[key]);

    cutEvent['key'] = String.fromCharCode(evt.which);

    console.log(cutEvent);
  }

  renewShortcut (queueItem) {
    queueItem.lastHit = null;
    //queueItem.keys = [...this._decl[queueItem.index].keys];
  }



  /!*processEvent (evt) {
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
   this._blockDefaultBehavior(evt);

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
   }*!/
}*/


/**
 * @mixes KeydownMixin
 */
class HotkeyCatcher {
  constructor (config) {
    this._onConfigChange = this._onConfigChange.bind(this);

    this._initPropsWithConfig(config);
    this._buildHotkeyTree();

    this._bindEvents();
  }

  _initPropsWithConfig (config) {
    Object.assign(this, {
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

    document.addEventListener('set-config-success', this._onConfigChange);
  }

  _unbindEvents () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.removeEventListener(eventName, this, true));

    document.removeEventListener('set-config-success', this._onConfigChange);
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

    if (evt.type === 'keydown') {
      console.group('KEYDOWN');

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
    document.dispatchEvent(new CustomEvent('jirabus-hotkey', { 'detail': hotkey }))
  }
}

Object.assign(HotkeyCatcher.prototype, KeydownMixin);

export default HotkeyCatcher
