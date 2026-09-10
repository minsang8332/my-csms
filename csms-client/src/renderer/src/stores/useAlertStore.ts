import { create } from 'zustand'

type AlertType = 'success' | 'info' | 'error'

type AlertState = {
  open: boolean
  type: AlertType
  message: string
  showAlert: (message: string, type?: AlertType) => void
  hideAlert: () => void
}

let alertTimer: number | null = null

export const useAlertStore = create<AlertState>((set) => ({
  open: false,
  type: 'info',
  message: '',
  showAlert: (message, type = 'info') => {
    if (alertTimer) {
      window.clearTimeout(alertTimer)
    }

    set({
      open: true,
      type,
      message
    })

    alertTimer = window.setTimeout(() => {
      set({ open: false })
      alertTimer = null
    }, 2400)
  },
  hideAlert: () => {
    if (alertTimer) {
      window.clearTimeout(alertTimer)
      alertTimer = null
    }

    set({ open: false })
  }
}))
