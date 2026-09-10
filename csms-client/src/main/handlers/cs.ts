import { IpcChannel } from '../../shared/constant'
import { ipcMain, dialog, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import type { CsBranch } from '../../shared/api'

const DOMAIN = process.env.DOMAIN || '127.0.0.1'
const API_URL = `http://${DOMAIN}/v1/api`

export function registerCsHandlers(): void {
  ipcMain.handle(IpcChannel.CS_READ_ALL, async () => {
    const response = await fetch(`${API_URL}/cs`)
    if (!response.ok) throw new Error('Failed to fetch cs branches')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_CREATE, async (_, branchInput: Omit<CsBranch, 'id' | 'createdAt'>) => {
    const response = await fetch(`${API_URL}/cs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchInput)
    })
    if (!response.ok) throw new Error('Failed to create cs branch')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_EDIT, async (_, branch: CsBranch) => {
    const response = await fetch(`${API_URL}/cs/${branch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    })
    if (!response.ok) throw new Error('Failed to edit cs branch')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_REMOVE, async (_, id: string) => {
    const response = await fetch(`${API_URL}/cs/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to remove cs branch')
    return true
  })

  ipcMain.handle(IpcChannel.CS_GET_STATUSES, async () => {
    const response = await fetch(`${API_URL}/cs/statuses`)
    if (!response.ok) throw new Error('Failed to get statuses')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_UPLOAD_LICENSE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '사업자 등록증 업로드',
      filters: [
        { name: '이미지 및 PDF 파일', extensions: ['jpg', 'jpeg', 'png', 'pdf'] }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const srcPath = filePaths[0]
    const ext = path.extname(srcPath)
    const uuidFilename = `${crypto.randomUUID()}${ext}`
    
    // Create Documents/csms-client directory if it doesn't exist
    const docPath = app.getPath('documents')
    const destDir = path.join(docPath, 'csms-client')
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    const destPath = path.join(destDir, uuidFilename)
    fs.copyFileSync(srcPath, destPath)

    return {
      path: destPath,
      name: path.basename(srcPath)
    }
  })

  ipcMain.handle(IpcChannel.CS_CREATE_REPLY, async (_, csId: string, content: string) => {
    const response = await fetch(`${API_URL}/cs/${csId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    if (!response.ok) throw new Error('Failed to create cs reply')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_EDIT_REPLY, async (_, replyId: string, content: string) => {
    const response = await fetch(`${API_URL}/cs/replies/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    if (!response.ok) throw new Error('Failed to edit cs reply')
    return response.json()
  })

  ipcMain.handle(IpcChannel.CS_REMOVE_REPLY, async (_, replyId: string) => {
    const response = await fetch(`${API_URL}/cs/replies/${replyId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to remove cs reply')
    return true
  })
}
