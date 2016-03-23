'use strict';




var eventHandlers = jQuery._data(document, 'events');
console.log(eventHandlers);

var eventHandlersCache = {};

['keyup', 'keypress', 'keydown'].forEach(function(eventName) {
  eventHandlersCache[eventName] = [];
  (eventHandlers[eventName] || []).forEach(function(eventHandlerObj){
    eventHandlersCache[eventName].push(eventHandlerObj.handler);
  });

  delete eventHandlers[eventName];
});

var KEYS = {
  's, w': 'click #action_id_11', // В работу (Work)
  's, r': 'click #action_id_31', // Готово (Ready)
  's, p': 'click #action_id_41', // Отложить (Postpone)
  's, v': 'click #action_id_251', // Review (Review)
  's, o': 'click #action_id_261', // На доработку (Open)
  's, g': 'click #action_id_271', // Все хорошо (Good)
};

function KeyboardDispatcher(KEYS) {
  this._decl = [];
  this._queue = [];

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

  this.queue = [];
  this.DELAY = 500;

  ['keyup', 'keypress', 'keydown'].forEach(eventName =>
  document.addEventListener(eventName, this.processEvent.bind(this), true));

};

KeyboardDispatcher.prototype.doAction = function(action) {
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

KeyboardDispatcher.prototype.printKeyboardEvent = function(evt) {
  var cutEvent = {};
  ['type', 'which', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey']
    .forEach((key) => cutEvent[key] = evt[key]);

  cutEvent['key'] = String.fromCharCode(evt.which);

  console.log(cutEvent, evt);
}


KeyboardDispatcher.prototype.renewShortcut = function(queueItem) {
  queueItem.lastHit = null;
  queueItem.keys = [...this._decl[queueItem.index].keys];
}

KeyboardDispatcher.prototype.processEvent = function(evt) {
  this.printKeyboardEvent(evt);
  /*if (evt.type === 'keydown') {
   this.queue.push({ keyCode: evt.keyCode, passed: false });
   }*/

  let key = String.fromCharCode(evt.which);
  let now = Date.now();

  if (evt.type === 'keyup') {
    this._queue.forEach(item => {
      if (item.keys[0] === key) {
      // валидный случай
      if (item.lastHit && item.lastHit + this.DELAY >= now || item.lastHit === null) {
        item.lastHit = now;

        item.keys.shift();
        // мы добрались до конца
        if (!item.keys.length) {
          this.renewShortcut(item);

          // здесь нужно выпускать событие, но пока сделаем так
          this.doAction(item.action);
        }
      } else {
        this.renewShortcut(item);
      }
    }



  }, this);
  }
};

var dispatcher = new KeyboardDispatcher(KEYS);
