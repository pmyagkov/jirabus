import EventDispatcher from 'common/eventDispatcher'
import CONSTS from 'common/consts'

const $ = jQuery;

class FeedbackPanel {
  constructor ($container) {
    this._createPanelDOM($container);

    this._bindEvents();
  }

  _bindEvents () {
    this._$panel.on('click', '.open-feedback-panel', this._onOpenPanelClick.bind(this));
    this._$panel.on('keydown', '.feedback-text', this._onFeedbackTextKeydown.bind(this));
    this._$panel.on('submit', this._onSubmit.bind(this));
    this._$panel.on('click', '.close-feedback-panel', this._onClosePanelClick.bind(this));

    $(document).on(CONSTS.event.feedbackSent, this._onFeedbackSent.bind(this));
  }

  _clearFeedbackForm () {
    this._$panel
      .find('.feedback-text').val('').end()
      .find('.feedback-login').val('@');
  }

  _toggleError (value, statusCode) {
    let $error = this._$panel.find('.feedback-error');
    $error.toggle(value);
  }

  _onFeedbackSent ($evt) {
    var evt = $evt.originalEvent;
    console.log('FeedbackSent event received', evt);

    let statusCode = evt.detail;

    if (statusCode === 200) {
      setTimeout(() => {
        this._clearFeedbackForm();
        this._toggleMod(this._$panel, 'loading', false);
        this._toggleOpenness();
      }, 1000);
    } else {
      this._toggleError(true, statusCode);
    }
  }

  _onFeedbackTextKeydown () {
    this._toggleMod(this._$panel, 'invalid', false);
  }

  _toggleMod ($target, mod, value) {
    this._$panel.toggleClass(`${$target[0].classList[0]}_${mod}`, value);
  }

  _onSubmit (evt) {
    evt.preventDefault();

    const $text = this._$panel.find('.feedback-text');
    const $login = this._$panel.find('.feedback-login');

    let login = $login.val();

    if (!$text.val().trim()) {
      this._toggleMod(this._$panel, 'invalid', true);
      $text.focus();

      return false;
    }

    this._toggleMod(this._$panel, 'loading', true);

    this.dispatchEvent(CONSTS.command.sendFeedback, {
      name: login,
      text: $text.val()
    });
  }

  _toggleOpenness(value) {
    this._toggleMod(this._$panel, 'opened', value);

    if (!value) {
      this._toggleError(false);
      this._clearFeedbackForm();
    }
  }

  _onClosePanelClick (evt) {
    evt.preventDefault();

    this._toggleOpenness(false);
  }

  _onOpenPanelClick (evt) {
    evt.preventDefault();

    this._toggleOpenness(true);
  }

  _createPanelDOM ($container) {
    this._$panel = $('<form class="feedback-panel"></form>')
      .appendTo($container);

    this._$panel.append(`
      <a href="#" class="open-feedback-panel"></a>
    `);

    let $controlsContainer = $(`<div class="feedback-controls"></div>`)
      .appendTo(this._$panel);

    this._$panel.append(`
      <a target="_blank" href="https://github.com/pmyagkov/jirabus" class="github-link">
        <span class="github-link__part-1"></span>
        <span class="github-link__heart"></span>
        <span class="github-link__part-2"></span>
      </a>`
    );

    $controlsContainer.append(`
      <a href="#" class="close-feedback-panel"></a>
      <label class="feedback-text-label" for="jb-feedback-text">
        <textarea id="jb-feedback-text" class="feedback-text"></textarea>
      </label>`
    );

    $controlsContainer.append(`
      <label class="feedback-login-label" for="jb-feedback-login">
        <div>Leave your contact to be able to contact you!</div>
        <input type="text" id="jb-feedback-login" class="feedback-login" value="@">
        <div class="feedback-login-hint">
          <span class="telegram-logo"></span>
          Telegram is preferred
        </div>
      </label>`
    );

    $controlsContainer.append(`
      <button class="feedback-button"></button>
    `);

    $controlsContainer.append(`
      <div class="feedback-error">
        <span>
          Ooops! Seems Houston has some problems :( Please ping me about it via
          this <a target="_blank" href="https://telegram.me/JIRAbusFeedback">Telegram channel</a>.
          Many thanks!
        </span>
      </div>
    `);
  }
}

Object.assign(FeedbackPanel.prototype, EventDispatcher);

export default FeedbackPanel
