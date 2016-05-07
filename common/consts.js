const CONSTS = {
  extensionName: 'JIRABus',

  allowedDomains: ['jira.mail.ru'],

  command: {
    getCode: 'jb-get-code',
    getConfig: 'jb-get-config',
    setConfig: 'jb-set-config',
    sendFeedback: 'jb-send-feedback'
  },

  event: {
    configSet: 'jb-config-set',
    feedbackSent: 'jb-feedback-sent',
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
