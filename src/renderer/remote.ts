import electron = require("electron");

export const useCases = electron.remote.require('./useCases')
export const tray = electron.remote.require('./tray')