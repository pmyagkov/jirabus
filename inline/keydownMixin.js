/**
 * @mixin KeydownMixin
 */
export default {
  isEventTimeoutExpired (delta) {
    if (!this.__eventTimestamp) {
      return true;
    }

    console.log(`Compare timeout ${Date.now()} - ${this.__eventTimestamp}`,
      Date.now() - this.__eventTimestamp < delta ? '<' : '>', `${delta}`);

    return Date.now() - this.__eventTimestamp > delta;
  },

  setEventTimestamp () {
    this.__eventTimestamp = Date.now();
    console.log(`Timeout set ${this.__eventTimestamp}`);
  },

  cutSymbolFromArray (arr, symbol, index) {
    index = Number.isInteger(index) ? index : arr.findIndex(s => s === symbol);

    if (index === -1) {
      return arr;
    }

    return [].concat(arr.slice(0, index), arr.slice(index + 1));
  },

  areKeydownsEmpty () {
    return this.__keydownSymbols.length === 0;
  },

  addKeydownSymbol (symbol) {
    this.__keydownSymbols = this.__keydownSymbols || [];

    if (!this.__keydownSymbols.includes(symbol)) {
      this.__keydownSymbols.push(symbol);
    }
  },

  removeKeydownSymbol (symbol) {
    this.__keydownSymbols = this.cutSymbolFromArray(this.__keydownSymbols, symbol);
  },

  clearKeydownSymbols() {
    this.__keydownSymbols = [];
  },

  formatKeydowns () {
    let index;
    let unformatted = [...this.__keydownSymbols];
    let formatted = [];
    while ((index = unformatted.findIndex(key => ['⌥', '⇧', '^', '⌘'].includes(key))) !== -1) {
      formatted.push(unformatted[index]);
      unformatted =
        this.cutSymbolFromArray(unformatted, null, index);
    }

    formatted = formatted.concat(unformatted);

    return formatted.join(' + ').toLowerCase();
  }
}
