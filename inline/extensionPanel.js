import CapturerPanel from './capturerPanel'
import FeedbackPanel from './feedbackPanel'
import ErrorHandler from 'common/errorHandler'
import CONSTS from 'common/consts'

const $ = jQuery;

class ExtensionPanel extends ErrorHandler {
  constructor (config) {
    super();

    this._createPanelDOM();

    this._bindEvents();

    let $container = this._$panel.find('.extension-panel__inner');
    
    this._capturerPanel = new CapturerPanel({ config, $container});
    this._feedbackPanel = new FeedbackPanel($container);
  }

  _bindEvents () {
    $(document).on(CONSTS.event.toggleOpenness,
      ($evt) => this._toggleOpenness($evt.originalEvent.detail));

    $(document).on(CONSTS.event.toggleOpacity,
      ($evt) => this._toggleOpacity($evt.originalEvent.detail));

    this._$panel.on('click', '.open-toggler', () => this._toggleOpenness());
  }

  _toggleOpacity (value) {
    let baseClass = this._$panel[0].classList[0];

    this._$panel.toggleClass(baseClass + '_opaque', value);
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
  
  _createPanelDOM () {
    this._$panel = $(`<div class="extension-panel">
      <a class="open-toggler" href="#"></a>
      <div class="extension-panel__inner"></div>
    </div>`)
      .appendTo(document.body);
  }
}

export default ExtensionPanel
