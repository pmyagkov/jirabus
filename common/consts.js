const CONSTS = {
  extensionName: 'JIRABus',

  allowedDomains: ['jira.mail.ru'],

  command: {
    getCode: 'jb-get-code',
    getConfig: 'jb-get-config',
    setConfig: 'jb-set-config'
  },

  event: {
    configSet: 'jb-config-set',
    hotkey: 'jb-hotkey',
    toggleOpenness: 'jb-toggle-openness',
    toggleOpacity: 'jb-toggle-opacity'
  },

  dom: {
    disabledOutlineClass: 'jb-disabled-outline',
    outlineClass: 'jb-outline',
    disabledClass: 'jb-disabled',
    loadingClass: 'jb-loading',
    hotkeyLabelClass: 'jb-hotkey-label',

    processedAttr: 'jb-processed'

  }
};

export default CONSTS
