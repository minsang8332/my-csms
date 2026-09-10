import { IpcChannel } from '../../shared/constant'
import { ipcMain } from 'electron'
import * as serialPort from '../modules/serial-port'
import type { StoreRepository } from '../modules/electron-store'
import { getMainWindow } from '../modules/window'

type SettingHandlerOptions = {
  storeRepository: StoreRepository
}

export function registerSettingHandlers({
  storeRepository
}: SettingHandlerOptions): void {
  serialPort.init({
    storeRepository,
    onListChanged: (ports) => {
      getMainWindow()?.webContents.send(IpcChannel.SETTING_SERIAL_PORT_LIST_CHANGED, ports)
    },
    onDataReceived: (payload) =>
      getMainWindow()?.webContents.send(IpcChannel.SETTING_SERIAL_PORT_DATA, payload)
  })

  ipcMain.handle(IpcChannel.SETTING_GET_SERIAL_PORT_LIST, async () => {
    return serialPort.refreshList()
  })

  ipcMain.handle(IpcChannel.SETTING_GET_SERIAL_PORT_SETTING, () => serialPort.getSetting())
  ipcMain.handle(IpcChannel.SETTING_TOGGLE_SERIAL_PORT, (_, port) =>
    serialPort.toggleSelectedPort(port)
  )
  ipcMain.handle(IpcChannel.SETTING_SET_SERIAL_COMMAND, (_, command: string) =>
    serialPort.setCommand(command)
  )
}
