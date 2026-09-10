import { IpcChannel } from '../../shared/constant'
import { ipcMain } from 'electron'
import { getMainWindow } from '../modules/window'

export function registerNativeHandlers(): void {
  ipcMain.handle(IpcChannel.NATIVE_MINIMIZE, () => {
    getMainWindow()?.minimize()
    return true
  })

  ipcMain.handle(IpcChannel.NATIVE_MAXIMIZE, () => {
    const window = getMainWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
    return true
  })

  ipcMain.handle(IpcChannel.NATIVE_CLOSE, () => {
    getMainWindow()?.close()
    return true
  })

  ipcMain.handle(IpcChannel.NATIVE_IS_MAXIMIZED, () => {
    return getMainWindow()?.isMaximized() ?? false
  })
}
