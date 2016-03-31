'use strict';


var eventHandlers = jQuery._data(document, 'events');
console.log(eventHandlers);

var KEYS = {
  's, w': [
    'click #action_id_11',
    'click #action_id_241',
    'click #action_id_71'
  ], // В работу (Work)
  's, f': [
    'click #action_id_31',
    'click #action_id_81'
  ], // Готово (Ready)
  's, p': 'click #action_id_41', // Отложить (Postpone)
  's, r': [
    'click #action_id_251',
    'click #action_id_281'
  ], // Review (Review), Откатить (Roll Back)
  's, o': [
    'click #action_id_261',
    'click #action_id_151'
  ], // На доработку/Открыть снова (Open)
  's, g': 'click #action_id_271', // Все хорошо (Good)
  's, t': 'click #action_id_231', // Протестировать (Testing)
  's, c': [
    'click #action_id_291',
    'click #action_id_21',
    'click #action_id_141'
  ], // Закрыть (Close)
  's, b': [
    'click #action_id_91',
    'click #action_id_111',
    'click #action_id_131'
  ], // Есть баги (Bugs)
  's, s': 'click #action_id_101', // Протестировано (TeSted)
  's, d': 'click #action_id_121', // Deployed on Production (Deployed)
  'n': 'click #commit-message-copy' // Copy commit message
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
    let actions = KEYS[key];
    actions = Array.isArray(actions) ? actions : [actions];
    actions.forEach(action => {
      let hotKeyDeclaration = {
        keysString: key,
        keys: key.split(',').map(k => k.trim().toUpperCase()),
        action: action,
        targetSelector: action.split(' ')[1]
      };

      this._decl.push(hotKeyDeclaration);

      this._queue.push({
        keys: [...hotKeyDeclaration.keys],
        action: hotKeyDeclaration.action,
        targetSelector: hotKeyDeclaration.targetSelector,
        index: this._decl.length - 1,
        lastHit: null
      });
    }, this);
  }, this);

  var observer = new MutationObserver(function () {
    this._labelActions();
  }.bind(this));

  observer.observe(document.body, {childList: true});

  //observer.disconnect();

  this._labelActions();
};

KeyboardDispatcher.prototype._labelActions = function () {
  this._decl.forEach((decl) => {
    let target = document.querySelector(decl.targetSelector);
    if (!target || target.getAttribute('data-jirabus')) {
      return;
    }

    let $hotkeyElement = jQuery('<b>')
      .addClass('jirabus-hotkey')
      .text(decl.keysString);

    // TODO: надо сделать интеллектуальный поиск ноды с текстом
    let $target = jQuery(target).attr('data-jirabus', 'true');
    // для случая кнопок-действия
    let $textNode = $target.find('.trigger-label');
    if (!$textNode.length) {
      $textNode = $target;
    }

    $textNode.append($hotkeyElement);

  });
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

  // пропускаем события на инпутах
  if (jQuery(evt.target).is('textarea, input')) {
    return;
  }

  let key = String.fromCharCode(evt.which);
  let now = Date.now();

  // ищем хоткей, подходящий по клавишам и `target` которого присутствует на странице
  let matchedItems =
    this._queue.filter(
      (item) => item.keys[0] === key && document.querySelector(item.targetSelector)
    );

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
            // TODO: нужно обновлять все шорткаты, начинающиеся с одной буквы
            // лучше с самого начала зацепленные выносить в отдельную очередь, а текущую блокировать
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
