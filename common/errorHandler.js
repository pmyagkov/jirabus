import EventDispatcher from './eventDispatcher'
import CONSTS from './consts'

class ErrorHandler {
  constructor() {
    for (let key in this) {
      if (typeof this[key] === 'function') {
        let originalFunction = this[key];
        this[key] = function() {
          try {
            originalFunction.apply(this, arguments);
          } catch (e) {
            EventDispatcher.dispatchEvent(CONSTS.command.sendFeedback, {
              name: 'me',
              text: `Error:\n${e.message}\n\n${e.stack}`
            });
          }
        }.bind(this);
      }
    }
  }
}

export default ErrorHandler
