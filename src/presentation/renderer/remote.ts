import electron = require("electron");

export const useCases = electron.remote.require('../../domain/useCases')
export const tray = electron.remote.require('./tray')
export const dialog = electron.remote.dialog