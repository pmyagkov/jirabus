const RELATIVE_HOTKEYS_CONFIG = {
  's, 1': {
    actions: ['click #opsbar-opsbar-transitions .issueaction-workflow-transition:eq(0)'],
    description: 'Первый статус тикета'
  },

  's, 2': {
    actions: ['click #opsbar-opsbar-transitions .issueaction-workflow-transition:eq(1)'],
    description: 'Второй статус тикета'
  },

  's, 3': {
    actions: ['click #opsbar-opsbar-transitions .issueaction-workflow-transition:eq(2)'],
    description: 'Третий статус тикета'
  },

  's, 4': {
    actions: ['click #opsbar-opsbar-transitions .issueaction-workflow-transition:eq(3)'],
    description: 'Четвертый статус тикета'
  }
};

const ABSOLUTE_HOTKEYS_CONFIG = {
  's, w': {
    actions: [
      'click #action_id_11',
      'click #action_id_241',
      'click #action_id_71'
    ],
    description: 'В работу (Work)'
  },

  's, f': {
    actions: [
      'click #action_id_31',
      'click #action_id_81'
    ],
    description: 'Готово (Ready)'
  },

  's, p': {
    actions: ['click #action_id_41'],
    description: 'Отложить (Postpone)'
  },

  's, r': {
    actions: [
      'click #action_id_251',
      'click #action_id_281'
    ],
    description: 'Review (Review), Откатить (Roll Back)'
  },

  's, o': {
    actions: [
      'click #action_id_261',
      'click #action_id_151'
    ],
    description: 'На доработку/Открыть снова (Open)'
  },
  's, g': {
    actions: ['click #action_id_271'],
    description: 'Все хорошо (Good)'
  },
  's, t': {
    actions: ['click #action_id_231'],
    description: 'Протестировать (Testing)'
  },
  's, c': {
    actions: [
      'click #action_id_291',
      'click #action_id_21',
      'click #action_id_141'
    ],
    description: 'Закрыть (Close)'
  },
  's, b': {
    actions: [
      'click #action_id_91',
      'click #action_id_111',
      'click #action_id_131'
    ],
    description: 'Есть баги (Bugs)'
  },
  's, s': {
    actions: ['click #action_id_101'],
    description: 'Протестировано (TeSted)'
  },
  's, d': {
    actions: ['click #action_id_121'],
    description: 'Deployed on Production (Deployed)'
  }

};

const COMMON_HOTKEYS_CONFIG = {
  'n': {
    actions: ['click #commit-message-copy'],
    description: 'Копирование commit-сообщения'
  }
};

const REST_CONFIG = {
  'delay': 500
};


class BackgroundPage {

  constructor () {
    this.registerListeners();

    this.FILE_CACHE = {};
    this.ALLOWED_DOMAINS = ['jira.mail.ru'];

    console.log('Background page constructed');
  }

  getDefaultConfig () {
    return {
      config: Object.assign({}, {
        hotkeys: Object.assign({}, RELATIVE_HOTKEYS_CONFIG, COMMON_HOTKEYS_CONFIG)
      }, REST_CONFIG)
    };
  }

  getImagePath (imageName) {
    return `img/${imageName}`;
  }

  readFile (fileName) {
    let fileCache = this.FILE_CACHE;
    
    return new Promise((resolve, reject) => {

      if (fileCache[fileName]) {
        return resolve({ [fileName]: fileCache[fileName] });
      }

      chrome.runtime.getPackageDirectoryEntry((root) => {

        root.getFile(fileName, {}, (fileEntry) => {

          fileEntry.file((file) => {
            var reader = new FileReader();

            /**
             * Don't use lambda here because the result of file read come in `this.result` of the callback function.
             */
            reader.onloadend = function() {
              fileCache[fileName] = this.result;

              resolve({ [fileName]: fileCache[fileName] });
            };
            
            reader.readAsText(file);
            
          }, reject);
        }, reject);
      });
    })
  }

  registerListeners () {
    chrome.tabs.onUpdated.addListener(this.showPageAction.bind(this));

    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  }

  showPageAction (tabId, changeInfo, tab) {
    console.group('Background.showPageAction');

    if (this.ALLOWED_DOMAINS.some((domain) => tab.url.includes(domain))) {
      chrome.pageAction.show(tabId);
      console.log(`Tab ${tabId} activated!`);
      console.log(`It's url`, tab.url);
    } else {
      console.log(`Tab ${tabId} NOT activated because of domain restriction!`);
    }

    console.groupEnd();
  }

  connectTab (sender) {
    if (!sender || !sender.tab) {
      return;
    }

    chrome.pageAction.setIcon({
      tabId: sender.tab.id,
      path: this.getImagePath('jira_connected.png')
    });

    console.log('connectTab', `Tab ${sender.tab.id} is connected`);
  }

  onMessage (request, sender, sendResponse) {
    console.group('Background.onMessage');

    console.log('Received message', sender.tab
      ? 'from a content script:' + sender.tab.url
      : 'from the extension'
    );

    console.log('request', request);
    console.log('sender', sender);

    switch (request.type) {
      case 'get-code':
        Promise.all([this.readFile('inline.js'), this.readFile('inline.css')])
          .then((promiseValues) => {
            console.log('Files read', promiseValues);

            let response = Object.assign({}, ...promiseValues.concat(this.getDefaultConfig()));

            console.log('Sending response', response);

            sendResponse(response);

            console.groupEnd();
          }, this.errorHandler, this);

        this.connectTab(sender);

        return true;
    }
  }

  errorHandler () {
    console.log(...Array.from(arguments));

    console.groupEnd();
  }
}

new BackgroundPage;
