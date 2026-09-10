import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import { IpcChannel } from '../shared/constant'
import { createStoreRepository } from './modules/electron-store'
import { registerAppHandlers } from './handlers/app'
import { registerItemHandlers } from './handlers/item'
import { registerSettingHandlers } from './handlers/setting'
import { registerCsHandlers } from './handlers/cs'
import { registerUserHandlers } from './handlers/user'
import { registerNativeHandlers } from './handlers/native'

import { createAppTray, destroyAppTray } from './modules/tray'
import { startPolling as startSerialPortPolling, stopPolling as stopSerialPortPolling } from './modules/serial-port'
import { setMainWindow } from './modules/window'

const { autoUpdater } = electronUpdater
let isQuitting = false

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  setMainWindow(window)

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      window.hide()
    }
  })

  window.on('closed', () => {
    setMainWindow(null)
  })

  window.on('maximize', () => {
    window.webContents.send(IpcChannel.NATIVE_MAXIMIZED_CHANGE, true)
  })

  window.on('unmaximize', () => {
    window.webContents.send(IpcChannel.NATIVE_MAXIMIZED_CHANGE, false)
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev) {
    window.webContents.once('did-finish-load', () => {
      window.webContents.openDevTools({ mode: 'detach' })
    })
  }

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.csms.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const storeRepository = createStoreRepository()
  registerAppHandlers()
  registerItemHandlers()
  registerSettingHandlers({ storeRepository })
  registerCsHandlers()
  registerUserHandlers()
  registerNativeHandlers()

  const window = createWindow()

  createAppTray(window)
  startSerialPortPolling()

  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => undefined)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  stopSerialPortPolling()
  destroyAppTray()
})
