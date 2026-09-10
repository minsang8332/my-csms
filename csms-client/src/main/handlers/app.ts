import { IpcChannel } from '../../shared/constant'
import { app, ipcMain } from 'electron'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { getMainWindow } from '../modules/window'

export function registerAppHandlers(): void {
  ipcMain.handle(IpcChannel.APP_INFO, () => ({
    version: app.getVersion(),
    now: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    sample: lodash.startCase('electron vite react tailwind')
  }))

  ipcMain.handle(IpcChannel.APP_CLOSE_WINDOW, () => {
    getMainWindow()?.hide()
    return true
  })

  ipcMain.handle(IpcChannel.APP_SHOW_WINDOW, () => {
    const window = getMainWindow()
    window?.show()
    window?.focus()
    return true
  })

  ipcMain.handle(IpcChannel.APP_QUIT, () => {
    app.quit()
    return true
  })
}
