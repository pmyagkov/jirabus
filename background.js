const RELATIVE_HOTKEYS_CONFIG = [
  {
    hotkey: 's, 1',
    selector: '#opsbar-opsbar-transitions .issueaction-workflow-transition:eq(0)',
    action: 'click',
    description: 'Первый статус тикета'
  },

  {
    hotkey: 's, 2',
    selector: '#opsbar-opsbar-transitions .issueaction-workflow-transition:eq(1)',
    action: 'click',
    description: 'Второй статус тикета'
  },

  {
    hotkey: 's, 3',
    selector: '#opsbar-opsbar-transitions .issueaction-workflow-transition:eq(2)',
    action: 'click',
    description: 'Третий статус тикета'
  },

  {
    hotkey: 's, 4',
    selector: '#opsbar-opsbar-transitions .issueaction-workflow-transition:eq(3)',
    action: 'click',
    description: 'Четвертый статус тикета'
  }
];

/*const ABSOLUTE_HOTKEYS_CONFIG = {
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

};*/

const COMMON_HOTKEYS_CONFIG = [
  {
    hotkey: 'n',
    selector: '#commit-message-copy',
    action: 'click',
    description: 'Копирование commit-сообщения'
  }
];

const REST_CONFIG = {
  'delay': 500
};

const CONFIG_STORAGE_KEY = 'config';

class BackgroundPage {

  checkConfigInStorage () {
    console.group('Background.checkConfigInStorage');

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(CONFIG_STORAGE_KEY, (value) => {
        console.log('Storage value', value);
        if (!Object.keys(value).length) {
          console.log('Config NOT found in storage. Set default config there.');
          chrome.storage.sync.set({ [CONFIG_STORAGE_KEY] : this.getDefaultConfigObj() }, () => {
            if (chrome.runtime.lastError) {
              console.log('Error during setting config in storage', chrome.runtime.lastError);
              reject();
            } else {
              console.log('Config was saved in storage.');
              resolve();
            }
          });
        } else {
          console.log('Config found in storage. OK');
          resolve();
        }
      })
    }).then(() => console.groupEnd());
  }

  getDefaultConfigObj () {
    return Object.assign({}, {
      hotkeys: [].concat(RELATIVE_HOTKEYS_CONFIG, COMMON_HOTKEYS_CONFIG)
    }, REST_CONFIG);
  }

  getConfig () {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(CONFIG_STORAGE_KEY, (value) => {
        if (!value) {
          console.error(`No config in storage!`);
          reject();
          return;
        }

        resolve(value);
      });
    });
  }

  setConfig (config) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [CONFIG_STORAGE_KEY] : config }, () => {
        if (!chrome.runtime.lastError) {
          console.log('Config set successfully');
          resolve();
        } else {
          console.error(`Storage save error! ${chrome.runtime.lastError}`);
          reject();
        }
      });
    });
  }

  constructor () {

    this.checkConfigInStorage().then(() => {
      this.registerListeners();

      this.FILE_CACHE = {};
      this.ALLOWED_DOMAINS = ['jira.mail.ru'];

      console.log('Background page constructed');
    });
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

    console.log(`${request.command} command came`);

    switch (request.command) {
      case 'get-code':
        Promise.all([this.readFile('inline/inline.js'), this.readFile('inline/inline.css'), this.getConfig()])
          .then((promiseValues) => {
            console.log('Code and config got', promiseValues);

            let response = {
              command: request.command,
              data: Object.assign({}, ...promiseValues)
            };

            console.log('Sending response', response);

            sendResponse(response);
          }, this.errorHandler, this)
          .then(() => console.groupEnd());

        this.connectTab(sender);

        return true;

      case 'get-config':
        this.getConfig()
          .then((data) => {
            let response = {
              command: request.command,
              data: data
            };

            console.log('Sending response', response);

            sendResponse(response);
          }, this.errorHandler, this)
          .then(() => console.groupEnd());

        return true;

      case 'set-config':
        this.setConfig(request.data)
          .then(() => {
            let response = {
              command: request.command
            };

            console.log('Sending response', response);

            sendResponse(response);
          })
    }
  }

  errorHandler () {
    console.log(...Array.from(arguments));

    console.groupEnd();
  }
}

new BackgroundPage;
