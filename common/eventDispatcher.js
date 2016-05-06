/**
 * @mixin EventDispatcher
 * @type {{}}
 */
const EventDispatcher = {
  dispatchEvent (event, data) {
    document.dispatchEvent(new CustomEvent(event, { 'detail': data }));
  }
};

export default EventDispatcher
