import { IpcChannel } from '../../shared/constant'
import { ipcMain } from 'electron'
import type { ItemInput, StoredItem } from '../../shared/api'

const DOMAIN = process.env.DOMAIN || '127.0.0.1'
const API_URL = `http://${DOMAIN}/v1/api`

export function registerItemHandlers(): void {
  ipcMain.handle(IpcChannel.ITEM_READ_ALL, async () => {
    const response = await fetch(`${API_URL}/items`)
    if (!response.ok) throw new Error('Failed to fetch items')
    return response.json()
  })

  ipcMain.handle(IpcChannel.ITEM_CREATE, async (_, item: ItemInput) => {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to create item')
    return response.json()
  })

  ipcMain.handle(IpcChannel.ITEM_EDIT, async (_, item: StoredItem) => {
    const response = await fetch(`${API_URL}/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to edit item')
    return response.json()
  })

  ipcMain.handle(IpcChannel.ITEM_REMOVE, async (_, id: string) => {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to remove item')
    return true
  })
}
