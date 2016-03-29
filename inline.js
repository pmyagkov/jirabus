'use strict';


var eventHandlers = jQuery._data(document, 'events');
console.log(eventHandlers);

var KEYS = {
  's, w': 'click #action_id_11', // В работу (Work)
  's, r': 'click #action_id_31', // Готово (Ready)
  's, p': 'click #action_id_41', // Отложить (Postpone)
  's, v': 'click #action_id_251', // Review (Review)
  's, o': 'click #action_id_261', // На доработку (Open)
  's, g': 'click #action_id_271', // Все хорошо (Good)
  's, t': 'click #action_id_231', // Протестировать (Testing)

};

function KeyboardDispatcher(KEYS) {
  this._decl = [];
  this._queue = [];
  this._canceledEvents = [];
  this.DELAY = 500;

  this._eventHandlersCache = {};

  this._blockExistedHandlers();
  this._parseHotkeys();

}

KeyboardDispatcher.prototype._parseHotkeys = function () {
  Object.keys(KEYS).forEach((key) => {
    this._decl.push({
      keys: key.split(',').map(k => k.trim().toUpperCase()),
      action: KEYS[key]
    });

    let current = this._decl[this._decl.length - 1];
    this._queue.push({
      keys: [...current.keys],
      action: current.action,
      index: this._decl.length - 1,
      lastHit: null
    });

  }, this);

  var observer = new MutationObserver(function(mutations) {
    this._labelActions();
  }.bind(this));

  observer.observe(document.body, { childList: true });

  //observer.disconnect();

  this._labelActions();
};

KeyboardDispatcher.prototype._labelActions = function () {
  Object.keys(KEYS).forEach((actionKey) => {
    let action = KEYS[actionKey];
    let targetSelector = action.split(' ')[1];

    let target = document.querySelector(targetSelector);
    debugger;
    if (!target || target.getAttribute('data-jirabus')) {
      return;
    }

    // TODO: надо сделать интелектуальный поиск ноды с текстом
    jQuery(target).attr('data-jirabus', 'true')
      .find('.trigger-label').append(
        jQuery('<b>')
          .text(actionKey)
          .css('margin-left', '5px')
      );
  }, this)
};

KeyboardDispatcher.prototype._blockExistedHandlers = function () {
  /*['keyup', 'keypress', 'keydown'].forEach(function (eventName) {
    this._eventHandlersCache[eventName] = [];
    (eventHandlers[eventName] || []).forEach(function (eventHandlerObj) {
      this._eventHandlersCache[eventName].push(eventHandlerObj.handler);
    }, this);

    delete eventHandlers[eventName];
  }, this);*/

  ['keyup', 'keypress', 'keydown'].forEach(eventName =>
    document.addEventListener(eventName, this.processEvent.bind(this), true));
};

KeyboardDispatcher.prototype.doAction = function (action) {
  let split = action.split(' ');
  if (split.length < 2) {
    return;
  }

  let elem = document.querySelector(split[1]);
  if (!elem) {
    return;
  }

  if (typeof elem[split[0]] !== 'function') {
    return;
  }

  elem[split[0]]();
};

KeyboardDispatcher.prototype.printKeyboardEvent = function (evt) {
  var cutEvent = {};
  ['type', 'which', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey']
    .forEach((key) => cutEvent[key] = evt[key]);

  cutEvent['key'] = String.fromCharCode(evt.which);

  console.log(cutEvent, evt);
};


KeyboardDispatcher.prototype.renewShortcut = function (queueItem) {
  queueItem.lastHit = null;
  queueItem.keys = [...this._decl[queueItem.index].keys];
};

KeyboardDispatcher.prototype._cancelEvent = function (evt) {
  evt.preventDefault();
  evt.stopPropagation();

  this._canceledEvents.push(evt);
  console.log('Event was canceled', evt);
};

KeyboardDispatcher.prototype.processEvent = function (evt) {
  this.printKeyboardEvent(evt);

  let key = String.fromCharCode(evt.which);
  let now = Date.now();

  let matchedItems = this._queue.filter((item) => item.keys[0] === key);
  if (['keydown', 'keypress', 'keyup'].includes(evt.type) && matchedItems.length) {
    this._cancelEvent(evt);

    if (evt.type === 'keyup') {
      matchedItems.forEach(item => {
        if (item.lastHit && item.lastHit + this.DELAY >= now || item.lastHit === null) {
          // валидный случай
          item.lastHit = now;

          item.keys.shift();
          // мы добрались до конца
          if (!item.keys.length) {
            this.renewShortcut(item);

            // здесь нужно эмитить событие, но пока сделаем так
            this.doAction(item.action);
          }
        } else {
          this.renewShortcut(item);
        }
      }, this);
    }
  }
};

var dispatcher = new KeyboardDispatcher(KEYS);
