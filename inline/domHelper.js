const $ = jQuery;

const DomHelper = {
  toggleMod ($target, mod, value) {
    $target = $($target);
    if (!$target[0].classList) {
      return;
    }

    mod.split(' ')
      .forEach((m) => $target.toggleClass(`${$target[0].classList[0]}_${m}`, value));
  }
};

export default DomHelper
