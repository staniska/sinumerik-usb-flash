'use babel'

const drivelist = require('drivelist');

import View from './sinumerik-usb-flash'

let activeDevices = []
let selectedDevice = null

export const panel = () => {
    const panel = create_element(['sinumerik-usb-flash', 'native-key-bindings'], null, '', 'div')
    const closeButton = create_element(['sinumerik-usb-flash-close-button', 'icon-x'], panel, '', 'button')
    closeButton.addEventListener('click', () => {
        View.toggle()
    })
    const deviceListDiv = create_element(['sinumerik-usb-flash-device-list-div'], panel)
    const deviceList = create_element(['sinumerik-usb-flash-device-list'], deviceListDiv, null, 'ul')
    deviceList.addEventListener('click', (e) => {
        if (!e.target.innerText.length) return
        selectDevice(e.target.innerText)
    })
    updatePanel()
    return panel
}

const updatePanel = () => {
    selectedDevice = null
    activeDevices = []
    new Promise((resolve, reject) => {
        drivelist.list().then(d => {
            activeDevices = d.filter(d => d.description.length)//.filter(d => d.busType === 'USB')
            console.log(activeDevices)
            updateDeviceList(d)
            resolve()
        });
    })
}

const updateDeviceList = (devices) => {
    const list = View.sinumerikUsbFlashView.element.querySelector('.sinumerik-usb-flash-device-list')
    while (list.children.length) {
        list.removeChild(list.children[0])
    }
    devices.forEach((d, i) => {
        const item = create_element(['sinumerik-usb-flash-device-list-item'], list, d.description, 'li')
    })
    selectDevice(devices[0].description)
}

const selectDevice = (description) => {
    selectedDevice = activeDevices.filter(d => d.description === description)[0]

    const list = View.sinumerikUsbFlashView.element.querySelector('.sinumerik-usb-flash-device-list')
    while (list.querySelector('.sinumerik-usb-flash-device-list-item-selected') !== null) {
        list.querySelector('.sinumerik-usb-flash-device-list-item-selected').classList.remove('sinumerik-usb-flash-device-list-item-selected')
    }
    Array.from(list.children).find(el => el.innerText === description).classList.add('sinumerik-usb-flash-device-list-item-selected')
    console.log(selectedDevice)
}

const create_element = (classes, parent, text, tag) => {
    if (!tag) {
        tag = 'div'
    }
    let element = document.createElement(tag)
    classes.forEach(single_class => {
        element.classList.add(single_class)
    })
    if (text && text.length > 0) {
        element.innerText = text
    }
    if (parent) {
        parent.appendChild(element)
    }
    return element
}
