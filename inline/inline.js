'use strict';

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


class KeyboardDispatcher {
  constructor (config) {
    this._config = config;

    this._decl = [];
    this._queue = [];
    this._canceledEvents = [];

    this._blockExistedHandlers();
    this._parseHotkeys();
  }

  _parseHotkeys () {
    console.group('JIRAbus._parseHotkeys');

    Object.keys(this._config.hotkeys).forEach((key) => {
      let keyObj = this._config.hotkeys[key];
      console.log('Parse', keyObj);

      let actions = Array.isArray(keyObj.actions) ? keyObj.actions : [keyObj.actions];
      actions.forEach(action => {
        let actionSplit = action.split(' ');
        let hotKeyDeclaration = {
          keysString: key,
          keys: key.split(',').map(k => k.trim().toUpperCase()),
          action: actionSplit[0],
          targetSelector: actionSplit.slice(1).join(' ')
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

    var observer = new MutationObserver(function (records) {
      log('MO HANDLER', 'started', Array.from(arguments));

      if (records.every(r => r.addedNodes.length === 0)) {
        log('NO added nodes. Terminating!');
        return;
      }

      observer.disconnect();

      this._labelActions();

      observer.observe(document.body, { subtree: true, childList: true });
    }.bind(this));

    this._labelActions();

    observer.observe(document.body, { subtree: true, childList: true });
  }

  _labelActions () {
    group('LABEL ACTIONS');

    this._decl.forEach((decl) => {
      let target = jQuery(decl.targetSelector)[0];
      log(decl.targetSelector);
      if (!target || target.getAttribute('data-jirabus')) {
        log('NO NODE or ALREADY PROCESSED');
        return;
      }

      let $hotkeyElement = jQuery('<b>')
        .addClass('jirabus-hotkey')
        .text(decl.keysString);

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

  _blockExistedHandlers () {
    ['keyup', 'keypress', 'keydown'].forEach(eventName =>
      document.addEventListener(eventName, this.processEvent.bind(this), true));
  }

  doAction (item) {
    let elem = jQuery(item.targetSelector)[0];
    if (!elem) {
      error(`No elem with '${item.targetSelector}' found. Can't do action '${item.action}'!`);
      return;
    }

    if (typeof elem[item.action] !== 'function') {
      error(`Elem '${item.targetSelector}' doesn't contain action '${item.action}'!`);
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
    queueItem.keys = [...this._decl[queueItem.index].keys];
  }

  _cancelEvent (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    this._canceledEvents.push(evt);

    log('Event was canceled', evt);
  }

  processEvent (evt) {
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
  }  
}

/**
 * Name of this function should never be changed because it's called from inline script!!!
 * @param config
 */
let keyboardDispatcher;
function main(config) {
  if (keyboardDispatcher) {
    // TODO: clean dispatcher and reconfig it
  }

  keyboardDispatcher = new KeyboardDispatcher(config);
}
