import { IpcChannel } from '../../shared/constant'
import { ipcMain } from 'electron'

const DOMAIN = process.env.DOMAIN || '127.0.0.1'
const API_URL = `http://${DOMAIN}/v1/api`

export function registerUserHandlers(): void {
  ipcMain.handle(IpcChannel.USER_READ_ALL, async () => {
    const response = await fetch(`${API_URL}/auth/users`)
    if (!response.ok) throw new Error('Failed to fetch users')
    return response.json()
  })
}
