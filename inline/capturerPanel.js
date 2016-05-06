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

    $(`<div class="hotkeys-item__commands"></div>`)
      .appendTo($container)
      .append(`<a href="#" title="Remove" class="command command_remove">Remove</a>`);

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

    this._$panel.on('click', '.command_remove', this._onRemoveHotkeyClick.bind(this));

    $(document)
      .on('set-config-success', this._onConfigSet.bind(this))
      .on('jirabus-hotkey', this._onHotkey.bind(this));

  }

  _onRemoveHotkeyClick (evt) {
    evt.preventDefault();

    const $hotkeyContainer = $(evt.target).closest('[data-id]');
    const id = $hotkeyContainer.data('id');

    $hotkeyContainer.remove();

    this._removeHotkeyFromConfig(id);
  }

  _removeHotkeyFromConfig (id) {
    this._config.hotkeys = this._config.hotkeys.filter((hotkeyObj) => hotkeyObj.id !== id);
    this._saveConfig();
  }

  _onHotkey (evt) {
    const hotkey = evt.originalEvent.detail;

    let hotkeyObj = this._getHotkeyObjByHotkey(hotkey);
    if (!hotkeyObj) {
      return;
    }

    this._doAction(hotkeyObj);
  }

  _doAction (hotkeyObj) {
    const { selector, action } = hotkeyObj;

    let elem = $(selector)[0];
    if (!elem) {
      console.error(`No elem with '${selector}' found. Can't do action '${action}'!`);
      return;
    }

    if (typeof elem[action] !== 'function') {
      console.error(`Elem '${selector}' doesn't contain action '${action}'!`);
      return;
    }

    elem[action]();
  }

  _getHotkeyObjByHotkey (hotkey) {
    return this._config.hotkeys.find((hotkeyObj) => hotkeyObj.hotkey === hotkey);
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

    let $selected = $(selector);
    if (!$selected.length) {
      return;
    }

    $selected.toggleClass('jirabus-border', hoverValue);

    let selectedOffset = $selected.offset();
    let panelOffset = this._$panel.offset();

    const toggleOpacityValue = panelOffset.left < selectedOffset.left
      && selectedOffset.left < panelOffset.left + this._$panel.width()
      && panelOffset.top < selectedOffset.top
      && selectedOffset.top < panelOffset.top + this._$panel.height();

    this._$panel.toggleClass('opaque', toggleOpacityValue);
  }

  _onCaptureChange (evt) {
    this[evt.target.checked ? '_startCapture' : '_stopCapture']();
  }

  /**
   *
   * @param {Boolean?} value
   * @private
   */
  _toggleOpenness (value) {
    let baseClass = this._$panel[0].classList[0];

    this._$panel.toggleClass(baseClass + '_opened', value);
  }

  _onArrowClick () {
    this._toggleOpenness();
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

    this._stopCapture();
    // TODO: this time is hardcoded (see animation length in inline.styl)
    setTimeout(() => $hotkeyItem.find('.hotkey').focus(), 550);
  }

  /**
   * Build a selector to find the passed element in DOM.
   *
   * Requirements to the selector:
   * 1. It should query single element.
   *
   * Building selector strategy:
   * – Case 1. Element has an `id` — `#id`
   * – No closest elements with `id` — first class from the classList (`.ui-element.button` → `.ui-element`)
   * – Element has closest parent with an `id` — `#id .first_class`
   *   But in this case we need to check how many elements will be found using this selector.
   *   If several found add `:eq(n)` to find the exact node.
   *
   *
   * @param {HtmlElement} target
   * @returns {String|undefined}
   * @private
   */
  _calculateSelector (target) {
    let $idClosest = $(target).closest('[id]');
    let selector;

    if ($idClosest[0] === target) {
      return `#${$idClosest.attr('id')}`;
    }

    let firstClass = target.classList[0];
    // we can't continue building the selector without at least one class
    if (!firstClass) {
      return;
    }

    // we think the first class is the best one
    selector = `.${firstClass}`;
    if ($idClosest.length) {
      selector = `#${$idClosest.attr('id')} ${selector}`;
    }

    // trying to count elements queried with this selector
    var queriedSelector = $(selector);
    // this selector is correct
    if (queriedSelector.length === 1) {
      return selector;
    } else {
      // find index of target among found elements and add `:eq(n)` suffix
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
      action: 'click',
      description: ''
    };

    this._config.hotkeys.push(hotkeyObj);

    return hotkeyObj;
  }

  _startCapture() {
    this._capturing = true;
    this._$panel.find('.indicator-checkbox').attr('checked', this._capturing);

    console.log('CapturerPanel._onChange', 'Capturing is turned ', this._capturing ? 'on' : 'off');

    document.addEventListener('mouseover', this, true);
    document.addEventListener('mouseout', this, true);
    document.addEventListener('click', this, true);

    this._toggleOpenness(!this._capturing);
  }

  _stopCapture() {
    this._capturing = false;
    this._$panel.find('.indicator-checkbox').attr('checked', this._capturing);

    document.removeEventListener('mouseover', this, true);
    document.removeEventListener('mouseout', this, true);
    document.removeEventListener('click', this, true);

    this._toggleOpenness(!this._capturing);
  }
}

export default CapturerPanel
