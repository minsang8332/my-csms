import type { AppApi, CsBranch, CsReply, ItemInput, StoredItem } from '../../../shared/api'

const API_BASE = '/v1/api'

export function createWebAdapter(): AppApi {
  return {
    isElectron: false,
    isWeb: true,
    getAppInfo: async () => ({
      version: '0.1.0 (Web)',
      now: new Date().toISOString(),
      sample: 'CSMS Web Client'
    }),
    app: {
      closeWindow: async () => false,
      showWindow: async () => true,
      quit: async () => false
    },
    setting: {
      getSerialPortList: async () => [],
      getSerialPortSetting: async () => ({ selectedPort: null, command: '' }),
      toggleSerialPort: async () => ({ selectedPort: null, command: '' }),
      setSerialCommand: async (cmd: string) => cmd,
      onSerialPortListChanged: () => () => {},
      onSerialPortData: () => () => {}
    },
    item: {
      readAll: async () => {
        const res = await fetch(`${API_BASE}/items`)
        if (!res.ok) throw new Error('Failed to fetch items')
        return res.json()
      },
      create: async (item: ItemInput) => {
        const res = await fetch(`${API_BASE}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        if (!res.ok) throw new Error('Failed to create item')
        return res.json()
      },
      edit: async (item: StoredItem) => {
        const res = await fetch(`${API_BASE}/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        if (!res.ok) throw new Error('Failed to edit item')
        return res.json()
      },
      remove: async (id: string) => {
        const res = await fetch(`${API_BASE}/items/${id}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to remove item')
        return true
      }
    },
    cs: {
      readAll: async () => {
        const res = await fetch(`${API_BASE}/cs`)
        if (!res.ok) throw new Error('Failed to fetch cs branches')
        return res.json()
      },
      create: async (branch: Omit<CsBranch, 'id' | 'createdAt'>) => {
        const res = await fetch(`${API_BASE}/cs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch)
        })
        if (!res.ok) throw new Error('Failed to create cs branch')
        return res.json()
      },
      edit: async (branch: CsBranch) => {
        const res = await fetch(`${API_BASE}/cs/${branch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch)
        })
        if (!res.ok) throw new Error('Failed to edit cs branch')
        return res.json()
      },
      remove: async (id: string) => {
        const res = await fetch(`${API_BASE}/cs/${id}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to remove cs branch')
        return true
      },
      getStatuses: async () => {
        const res = await fetch(`${API_BASE}/cs/statuses`)
        if (!res.ok) throw new Error('Failed to get statuses')
        return res.json()
      },
      uploadLicense: async () => {
        alert('웹 환경에서는 사업자등록증 로컬 저장이 지원되지 않습니다.')
        return null
      },
      createReply: async (csId: string, content: string): Promise<CsReply> => {
        const res = await fetch(`${API_BASE}/cs/${csId}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        })
        if (!res.ok) throw new Error('Failed to create cs reply')
        return res.json()
      },
      editReply: async (replyId: string, content: string): Promise<CsReply> => {
        const res = await fetch(`${API_BASE}/cs/replies/${replyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        })
        if (!res.ok) throw new Error('Failed to edit cs reply')
        return res.json()
      },
      removeReply: async (replyId: string) => {
        const res = await fetch(`${API_BASE}/cs/replies/${replyId}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to remove cs reply')
        return true
      }
    },
    user: {
      readAll: async () => []
    },
    native: {
      minimize: async () => false,
      maximize: async () => false,
      close: async () => false,
      isMaximized: async () => false,
      onMaximizedChange: () => () => {}
    }
  }
}

export function initApi(): void {
  if (typeof window !== 'undefined' && !window.api) {
    window.api = createWebAdapter()
  }
}
