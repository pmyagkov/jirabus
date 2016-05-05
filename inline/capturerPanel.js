import KeyboardDispatcher from './keyboardDispatcher'

let $ = jQuery;

class CapturerPanel {
  constructor (config) {
    this._capturing = false;
    this._config = config;
    this._hotkeysCounter = 0;

    this._createPanelDOM();
    this._bindEvents();
  }

  _createPanelDOM () {
    this._$panel = $(`<div class="capture-panel capture-panel_opened">
      <a class="open-toggler" href="#"></a>
      <label for="indicator-checkbox" class="indicator">
        <input type="checkbox" id="indicator-checkbox" class="indicator-checkbox">
        <span class="indicator-icon"></span>
        <span class="indicator-text indicator-text_on"></span>
        <span class="indicator-text indicator-text_off"></span>
      </label>
      <ul class="hotkeys"></ul>
    </div>`);

    $(document.body).append(this._$panel);

    this._$hotkeys = this._$panel.find('.hotkeys');
    let hotkeys = this._config.hotkeys;

    hotkeys
      .forEach((hotkeyObj) => {
        hotkeyObj.id = this._hotkeysCounter++;
        this._appendHotkeyRow(hotkeyObj);
      });

  }

  /**
   *
   * @param hotkeyObj
   * @param hotkeyObj.id
   * @param hotkeyObj.hotkey
   * @param hotkeyObj.selector
   * @param hotkeyObj.action
   * @param hotkeyObj.description
   *
   * @param prepend Добавлять в начало или в конец списка?
   * @private
   */

  _appendHotkeyRow (hotkeyObj = { id: -1, hotkey: '', action: 'click', selector: '', description: ''}, prepend = false) {
    let $container;

    let appendFunc = prepend ? 'prependTo' : 'appendTo';

    $container = $(`<li class="hotkeys-item" data-id="${hotkeyObj.id}">`)[appendFunc](this._$hotkeys);

    $container
      .append(`<input type="text" class="selector" value="${hotkeyObj.selector}" placeholder="Choose an element to click">`);

    $container
      .append(`<input type="text" class="hotkey" value="${hotkeyObj.hotkey}" placeholder="Type hotkey">`);

    /*$container
     .append(`<button class="disable">Disable</button>`)
     .append(`<button class="remove">Remove</button>`);*/

    return $container;
  }

  _getHotkeyById (id) {
    return this._config.hotkeys.find((h) => h.id === id);
  }

  _bindEvents () {
    this._$panel.on('change', 'input[type="checkbox"]', this._onCaptureChange.bind(this));
    this._$panel.on('click', '.open-toggler', this._onArrowClick.bind(this));

    this._$panel.on('mouseenter mouseleave', '.selector', this._onSelectorHover.bind(this));

    this._$panel.on('focusin focusout', '.hotkey', this._onHotkeyFocusChange.bind(this));

    $(document).on('set-config-success', this._onConfigSet.bind(this));
  }

  _onConfigSet () {
    this._$panel.find('.loading').each((i, el) => $(el).removeClass('loading'));


  }

  _onHotkeyFocusChange (evt) {
    let focusValue = evt.type === 'focusin';

    if (focusValue) {
      KeyboardDispatcher.connect(evt.target);
      $(evt.target).val('');
    } else {

      let hotkey = KeyboardDispatcher.disconnect(evt.target);
      let id = $(evt.target).closest('.hotkeys-item').data('id');

      this._setHotkey(hotkey, id);
    }
  }

  _setHotkey (hotkey, id) {
    let $item = this._$panel.find(`[data-id="${id}"]`);
    if (!$item.length) {
      return;
    }

    let hotkeyObj = this._getHotkeyById(id);
    hotkeyObj.hotkey = hotkey;

    $item.addClass('loading');

    this._saveConfig();
  }

  _saveConfig () {
    document.dispatchEvent(new CustomEvent('set-config', { 'detail':  this._config }));
  }

  _onSelectorHover (evt) {
    let hoverValue = evt.type === 'mouseenter';
    let selector = evt.target.value;
    $(selector).toggleClass('jirabus-border', hoverValue);
  }

  _onCaptureChange (evt) {
    this._capturing = evt.target.checked;

    console.log('CapturerPanel._onChange', 'Capturing is turned ', this._capturing ? 'on' : 'off');

    this[this._capturing ? '_startCapture' : '_stopCapture']();
  }

  _onArrowClick (evt) {
    let baseClass = this._$panel[0].classList.item(0);
    this._$panel.toggleClass(baseClass + '_opened');
  }

  _isValidElement (target) {
    if (!this._capturing) {
      return false;
    }

    if (this._$panel[0].contains(target)) {
      return false;
    }

    // element has neither a class nor the id
    if (target.classList.toString() === '' && !target.getAttribute('id')) {
      return false;
    }

    return true;
  }

  handleEvent (evt) {
    if (!this._isValidElement(evt.target)) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    switch (evt.type) {
      case 'mouseover':
        return this._onCaptureMouseOver(evt.target);
      case 'mouseout':
        return this._onCaptureMouseLeave(evt.target);
      case 'click':
        return this._onCaptureClick(evt.target);
    }
  }

  _onCaptureMouseOver (target) {
    target.classList && target.classList.add('jirabus-border');
  }

  _onCaptureMouseLeave (target) {
    target.classList && target.classList.remove('jirabus-border');
  }

  _onCaptureClick (target) {
    let selector = this._calculateSelector(target);
    let hotkey = '';
    let hotkeyObj = this._createBlankHotkeyObj(hotkey, selector);

    let $hotkeyItem = this._appendHotkeyRow(hotkeyObj, true);
    $hotkeyItem.find('.hotkey').focus();
  }

  _calculateSelector (target, relative) {
    let idClosest = $(target).closest('[id]')[0];
    let selector;
    if (!idClosest) {
      selector = `.${target.classList.toString().split(' ').join('.')}`;
    } else {
      if (idClosest === target) {
        selector = `#${target.getAttribute('id')}`;
      }
    }

    // пытаемся посчитать количество элементов в селекторе
    var queriedSelector = $(selector);
    if (queriedSelector.length === 1) {
      // это правильный селектор
      return selector;
    } else {
      let index = queriedSelector.findIndex((elem) => elem === target);
      if (index > -1) {
        selector += `:eq(${index})`;
      }
    }

    return selector;
  }

  _createBlankHotkeyObj (hotkey = '', selector = '') {
    var hotkeyObj = {
      id: this._hotkeysCounter++,
      hotkey: hotkey,
      selector: selector,
      action: '',
      description: ''
    };

    this._config.hotkeys.push(hotkeyObj);

    return hotkeyObj;
  }

  _startCapture() {
    document.addEventListener('mouseover', this, true);
    document.addEventListener('mouseout', this, true);
    document.addEventListener('click', this, true);
  }

  _stopCapture() {
    document.removeEventListener('mouseover', this, true);
    document.removeEventListener('mouseout', this, true);
    document.removeEventListener('click', this, true);
  }
}

export default CapturerPanel
