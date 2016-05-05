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

    console.groupEnd();
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

    console.log(cutEvent);
  }

  renewShortcut (queueItem) {
    queueItem.lastHit = null;
    //queueItem.keys = [...this._decl[queueItem.index].keys];
  }

  _cancelEvent (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this._canceledEvents.push(evt);

    console.log('Event was canceled', evt);
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

export default KeyboardDispatcher
