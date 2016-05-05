import { EXTENSION_NAME } from 'common/consts'

class Logger {
  log () {
    return console.log(...[EXTENSION_NAME].concat(Array.from(arguments)));
  }

  group () {
    return console.group(...[EXTENSION_NAME].concat(Array.from(arguments)));
  }

  groupEnd () {
    return console.groupEnd();
  }

  error () {
    return console.error(...[EXTENSION_NAME].concat(Array.from(arguments)));
  }
}

export default Logger
