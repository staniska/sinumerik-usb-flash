'use babel';

import SinumerikUsbFlashView from './sinumerik-usb-flash-view';
import {CompositeDisposable} from 'atom';
import {updatePanel} from "./panel";

export default {

    sinumerikUsbFlashView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.sinumerikUsbFlashView = new SinumerikUsbFlashView(state.sinumerikUsbFlashViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.sinumerikUsbFlashView.getElement(),
            visible: false,
            autoFocus: true
        });

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'sinumerik-usb-flash:toggle': () => this.toggle()
        }));
    },

    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.sinumerikUsbFlashView.destroy();
    },

    serialize() {
        return {
            sinumerikUsbFlashViewState: this.sinumerikUsbFlashView.serialize()
        };
    },

    toggle() {
        if (this.modalPanel.isVisible()) {
            this.modalPanel.hide()
            this.modalPanel.element.removeEventListener('keydown', this.handleKeyboard)
        } else {
            this.modalPanel.show()
            updatePanel()
            this.modalPanel.element.addEventListener('keydown', this.handleKeyboard.bind(this))
        }
    },

    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.toggle()
        }
        if (e.key === 'F5') {
            updatePanel()
        }
    }

};
