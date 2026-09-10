import { useEffect } from 'react'
import { useThemeStore } from '../stores/useThemeStore'

export function useThemeEffect() {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const shouldUseDark = mode === 'dark' || (mode === 'system' && mediaQuery.matches)
      document.documentElement.classList.toggle('dark', shouldUseDark)
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)

    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [mode])
}
