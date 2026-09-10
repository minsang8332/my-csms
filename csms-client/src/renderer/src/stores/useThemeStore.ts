import { create } from 'zustand'

export type ThemeMode = 'system' | 'light' | 'dark'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const themeStorageKey = 'csms:theme-mode'

function getInitialMode(): ThemeMode {
  const savedMode = localStorage.getItem(themeStorageKey)

  if (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark') {
    return savedMode
  }

  return 'system'
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialMode(),
  setMode: (mode) => {
    localStorage.setItem(themeStorageKey, mode)
    set({ mode })
  }
}))
