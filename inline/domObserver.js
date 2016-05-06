

let $ = jQuery;

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
      console.log('MO HANDLER', 'started', Array.from(arguments));

      if (records.every(r => r.addedNodes.length === 0)) {
        console.log('NO added nodes. Terminating!');
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

  _labelHotkey (hotkeyObj) {
    let target = jQuery(hotkeyObj.selector)[0];
    console.log(hotkeyObj.selector);

    if (!target || target.getAttribute('data-jirabus')) {
      console.log('NO NODE or ALREADY PROCESSED');
      return;
    }

    let $hotkeyElement = jQuery('<span>')
      .addClass('jirabus-hotkey')
      .text(hotkeyObj.hotkey);

    console.log('PROCESS', target);

    // TODO: надо сделать интеллектуальный поиск ноды с текстом
    let $target = jQuery(target).attr('data-jirabus', 'true');
    // для случая кнопок-действия
    let $textNode = $target.find('.trigger-label');
    if (!$textNode.length) {
      $textNode = $target;
    }

    $textNode.append($hotkeyElement);
  }

  _labelTargets (force) {
    console.group('LABEL ACTIONS');

    if (force) {
      $('.jirabus-hotkey').each((i, e) => $(e).remove());
      $('[data-jirabus]').each((i, e) => $(e).removeAttr('data-jirabus'));
    }

    this._config.hotkeys
      .filter((hotkeyObj) => !hotkeyObj.disabled)
      .forEach((hotkeyObj) => this._labelHotkey(hotkeyObj));

    console.groupEnd();
  }
}

export default DomObserver
