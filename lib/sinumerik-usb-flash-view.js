'use babel';

import {panel} from "./panel";

export default class SinumerikUsbFlashView {

  constructor(serializedState) {
    // Create root element
    this.element = panel();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
