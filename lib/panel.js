'use babel'

const drivelist = require('drivelist');
const fs = require("fs");
const umount = require('umount')
const ejectMedia = require('eject-media');

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
    const filesDiff = create_element(['sinumerik-usb-flash-files-diff-div'], panel)
    updatePanel()
    return panel
}

export const updatePanel = () => {
    console.log('updatePanel')
    selectedDevice = null
    activeDevices = []
    new Promise(() => {
        drivelist.list()
            .then(d => {
                activeDevices = d.filter(d => d.description.length).filter(d => d.busType === 'USB').filter(d => d.mountpoints.length)
                updateDeviceList()
            })
    })
}

const updateDeviceList = () => {
    const list = View.sinumerikUsbFlashView.element.querySelector('.sinumerik-usb-flash-device-list')
    while (list.children.length) {
        list.removeChild(list.children[0])
    }
    activeDevices.forEach((d) => {
        const item = create_element(['sinumerik-usb-flash-device-list-item'], list, d.description, 'li')
    })
    if (activeDevices.length) {
        selectDevice(activeDevices[0].description)
    }
}

const selectDevice = (description) => {
    selectedDevice = activeDevices.filter(d => d.description === description)[0]

    const list = View.sinumerikUsbFlashView.element.querySelector('.sinumerik-usb-flash-device-list')
    while (list.querySelector('.sinumerik-usb-flash-device-list-item-selected') !== null) {
        list.querySelector('.sinumerik-usb-flash-device-list-item-selected').classList.remove('sinumerik-usb-flash-device-list-item-selected')
    }
    Array.from(list.children).find(el => el.innerText === description).classList.add('sinumerik-usb-flash-device-list-item-selected')

    const filesDiffDiv = View.sinumerikUsbFlashView.element.querySelector('.sinumerik-usb-flash-files-diff-div')
    while (filesDiffDiv.children.length) {
        filesDiffDiv.removeChild(filesDiffDiv.children[0])
    }

    const folderExists = searchFolder()
    if (folderExists) {
        const {folderPath, separator} = getActiveFolderPath()
        const activeFileName = atom.workspace.getActiveTextEditor().getFileName()
        fs.readdirSync(folderPath)
            .forEach(f => {
                const originFilePath = folderPath + separator + f
                const usbFilePath = selectedDevice.mountpoints[0].path + separator + getActiveFolderName().folderName + separator + f
                if (!fs.existsSync(usbFilePath) ||
                    fs.statSync(originFilePath).size !== fs.statSync(usbFilePath).size
                    || fs.readFileSync(originFilePath).toString() !== fs.readFileSync(usbFilePath).toString()
                ) {
                    const fileDiff = create_element(['sinumerik-usb-flash-files-diff-element'], filesDiffDiv)
                    const fileDiffName = create_element(['sinumerik-usb-flash-files-diff-name'], fileDiff, f)
                    const fileDiffCheckbox = create_element(['sinumerik-usb-flash-files-diff-checkbox'], fileDiff, null, 'input')
                    fileDiffCheckbox.type = 'checkbox'
                    fileDiffCheckbox.checked = f === activeFileName
                }
            })
        if (filesDiffDiv.children.length) {
            const saveFiles = create_element(['sinumerik-usb-flash-button'], filesDiffDiv, `Save files to device`, 'button')
            saveFiles.addEventListener('click', () => {
                Array.from(filesDiffDiv.querySelectorAll('.sinumerik-usb-flash-files-diff-element'))
                    .filter(div => div.querySelector('input').checked)
                    .map(div => div.querySelector('.sinumerik-usb-flash-files-diff-name').innerText)
                    .forEach(filename => {
                        const originFilePath = folderPath + separator + filename
                        const usbFilePath = selectedDevice.mountpoints[0].path + separator + getActiveFolderName().folderName + separator + filename
                        fs.writeFileSync(usbFilePath, fs.readFileSync(originFilePath))
                    })
                selectDevice(description)
            })
        }
        if (selectedDevice !== null) {
            const ejectBtn = create_element(['sinumerik-usb-flash-button'], filesDiffDiv, `Eject device`, 'button')
            ejectBtn.addEventListener('click', () => {
                umount.umount(selectedDevice.device, (error) => {
                    if (!error) {
                        ejectMedia.eject(selectedDevice.device, (error) => {
                            if (!error) View.toggle()
                            filesDiffDiv.removeChild(ejectBtn)
                        })
                    }
                })
            })
        }
    } else {
        const {folderName, separator} = getActiveFolderName()
        const createFolderBtn = create_element(['sinumerik-usb-flash-button'], filesDiffDiv, `Create folder "${folderName}"`, 'button')
        createFolderBtn.addEventListener('click', () => {
            fs.mkdirSync(selectedDevice.mountpoints[0].path + separator + getActiveFolderName().folderName)
            selectDevice(description)
        })
    }
}

const getActiveFolderPath = () => {
    const Editor = atom.workspace.getActiveTextEditor()
    const path = Editor.getPath()
    const separator = path.match('/') ? '/' : '\\'
    const folderPath = path.substring(0, path.lastIndexOf(separator))
    return {folderPath, separator}
}

const getActiveFolderName = () => {
    const {folderPath, separator} = getActiveFolderPath()
    const folderName = folderPath.substring(folderPath.lastIndexOf(separator) + 1)
    return {folderName, separator}
}

const searchFolder = () => {
    const {folderName, separator} = getActiveFolderName()
    return fs.existsSync(selectedDevice.mountpoints[0].path + separator + folderName)
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
