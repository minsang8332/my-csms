import { IpcChannel } from '../shared/constant'
import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppApi,
  ItemInput,
  SerialPortInfo,
  StoredItem,
} from '../shared/api'

const api: AppApi = {
  isElectron: true,
  isWeb: false,
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.APP_INFO),
  app: {
    closeWindow: () => ipcRenderer.invoke(IpcChannel.APP_CLOSE_WINDOW),
    showWindow: () => ipcRenderer.invoke(IpcChannel.APP_SHOW_WINDOW),
    quit: () => ipcRenderer.invoke(IpcChannel.APP_QUIT)
  },
  setting: {
    getSerialPortList: () => ipcRenderer.invoke(IpcChannel.SETTING_GET_SERIAL_PORT_LIST),
    getSerialPortSetting: () => ipcRenderer.invoke(IpcChannel.SETTING_GET_SERIAL_PORT_SETTING),
    toggleSerialPort: (port: SerialPortInfo) =>
      ipcRenderer.invoke(IpcChannel.SETTING_TOGGLE_SERIAL_PORT, port),
    setSerialCommand: (command: string) =>
      ipcRenderer.invoke(IpcChannel.SETTING_SET_SERIAL_COMMAND, command),
    onSerialPortListChanged: (callback) => {
      const listener = (_: Electron.IpcRendererEvent, ports: SerialPortInfo[]) =>
        callback(ports)
      ipcRenderer.on(IpcChannel.SETTING_SERIAL_PORT_LIST_CHANGED, listener)

      return () => ipcRenderer.removeListener(IpcChannel.SETTING_SERIAL_PORT_LIST_CHANGED, listener)
    },
    onSerialPortData: (callback) => {
      const listener = (
        _: Electron.IpcRendererEvent,
        payload: { path: string; data: string }
      ) => callback(payload)
      ipcRenderer.on(IpcChannel.SETTING_SERIAL_PORT_DATA, listener)

      return () => ipcRenderer.removeListener(IpcChannel.SETTING_SERIAL_PORT_DATA, listener)
    },
  },

  item: {
    readAll: () => ipcRenderer.invoke(IpcChannel.ITEM_READ_ALL),
    create: (item: ItemInput) => ipcRenderer.invoke(IpcChannel.ITEM_CREATE, item),
    edit: (item: StoredItem) => ipcRenderer.invoke(IpcChannel.ITEM_EDIT, item),
    remove: (id: string) => ipcRenderer.invoke(IpcChannel.ITEM_REMOVE, id)
  },
  cs: {
    readAll: () => ipcRenderer.invoke(IpcChannel.CS_READ_ALL),
    create: (branch) => ipcRenderer.invoke(IpcChannel.CS_CREATE, branch),
    edit: (branch) => ipcRenderer.invoke(IpcChannel.CS_EDIT, branch),
    remove: (id: string) => ipcRenderer.invoke(IpcChannel.CS_REMOVE, id),
    getStatuses: () => ipcRenderer.invoke(IpcChannel.CS_GET_STATUSES),
    uploadLicense: () => ipcRenderer.invoke(IpcChannel.CS_UPLOAD_LICENSE),
    createReply: (csId: string, content: string) => ipcRenderer.invoke(IpcChannel.CS_CREATE_REPLY, csId, content),
    editReply: (replyId: string, content: string) => ipcRenderer.invoke(IpcChannel.CS_EDIT_REPLY, replyId, content),
    removeReply: (replyId: string) => ipcRenderer.invoke(IpcChannel.CS_REMOVE_REPLY, replyId)
  },
  user: {
    readAll: () => ipcRenderer.invoke(IpcChannel.USER_READ_ALL)
  },
  native: {
    minimize: () => ipcRenderer.invoke(IpcChannel.NATIVE_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IpcChannel.NATIVE_MAXIMIZE),
    close: () => ipcRenderer.invoke(IpcChannel.NATIVE_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IpcChannel.NATIVE_IS_MAXIMIZED),
    onMaximizedChange: (callback) => {
      const listener = (_: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on(IpcChannel.NATIVE_MAXIMIZED_CHANGE, listener)

      return () => ipcRenderer.removeListener(IpcChannel.NATIVE_MAXIMIZED_CHANGE, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
