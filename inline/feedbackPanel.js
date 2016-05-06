const $ = jQuery;

class FeedbackPanel {
  constructor ($container) {
    this._createPanelDOM($container);

    this._bindEvents();
  }

  _bindEvents () {
    this._$panel.on('click', '.open-feedback-panel', this._onOpenPanelClick.bind(this));
  }

  _onOpenPanelClick (evt) {
    evt.preventDefault();

    this._$panel.toggleClass('opened');
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
      <a href="https://github.com/pmyagkov/jirabus" class="github-link">
        <span class="github-link__part-1"></span>
        <span class="github-link__heart"></span>
        <span class="github-link__part-2"></span>
      </a>`
    );

    $controlsContainer.append(`
      <label class="feedback-text-label" for="jb-feedback-text">
        <textarea id="jb-feedback-text" class="feedback-text"></textarea>
      </label>`
    );

    $controlsContainer.append(`
      <label class="feedback-login-label" for="jb-feedback-login">
        <input type="text" id="jb-feedback-login" class="feedback-login" value="@">
      </label>`
    );

    $controlsContainer.append(`
      <button class="feedback-button"></button>
    `);
  }
}

export default FeedbackPanel
