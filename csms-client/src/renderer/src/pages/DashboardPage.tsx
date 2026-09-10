import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useThemeEffect } from '../hooks/useThemeEffect'
import { useMenuStore } from '../stores/useMenuStore'

function DashboardPage() {
  useThemeEffect()

  const menus = useMenuStore((state) => state.menus)
  const activeMenu = useMenuStore((state) => state.activeMenu)
  const activeMenuId = useMenuStore((state) => state.activeMenuId)
  const loadMenus = useMenuStore((state) => state.loadMenus)
  const setActiveMenuId = useMenuStore((state) => state.setActiveMenuId)

  // Show splash on every initial page load / refresh (F5) or new entry
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)

  useEffect(() => {
    loadMenus()

    const handlePopState = () => {
      const menus = useMenuStore.getState().menus
      const path = window.location.pathname.replace(/\/$/, '') || '/'
      const matched = menus.find((m) => m.path === path || m.path === `/${path}`) || menus.find((m) => m.id === 'cs-list')
      if (matched) {
        useMenuStore.getState().setActiveMenuId(matched.id, false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [loadMenus])

  useEffect(() => {
    if (!showSplash) {
      return
    }

    const fadeTimer = window.setTimeout(() => setFadeSplash(true), 450)
    const hideTimer = window.setTimeout(() => {
      setShowSplash(false)
    }, 950)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showSplash])

  return (
    <>
      <AppLayout
        activeMenu={activeMenu}
        activeMenuId={activeMenuId}
        menus={menus}
        onMenuChange={setActiveMenuId}
      />

      {showSplash ? (
        <div
          className={[
            'fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950 transition-all duration-500 ease-out select-none',
            fadeSplash ? 'opacity-0 backdrop-blur-2xl pointer-events-none' : 'opacity-100'
          ].join(' ')}
        >
          {/* Ambient Emerald Aura Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/75 to-slate-950" />

          {/* Smoke Cloud Particles Atmosphere */}
          <div
            className={[
              'absolute h-96 w-96 rounded-full bg-emerald-500/20 blur-[100px] transition-all duration-500 ease-out',
              fadeSplash ? 'scale-[2.2] opacity-0 blur-[140px]' : 'scale-100 opacity-100'
            ].join(' ')}
          />
          <div
            className={[
              'absolute h-80 w-80 rounded-full bg-teal-400/15 blur-[90px] transition-all duration-500 ease-out delay-75',
              fadeSplash ? 'scale-[2.0] opacity-0 blur-[120px] -translate-y-8' : 'scale-100 opacity-100'
            ].join(' ')}
          />

          {/* Center Text with Vapor/Smoke Dissipation Motion */}
          <div
            className={[
              'relative z-10 flex flex-col items-center gap-2 text-center transition-all duration-500 ease-out',
              fadeSplash
                ? 'scale-125 opacity-0 blur-xl -translate-y-8 filter saturate-200 brightness-125'
                : 'scale-100 opacity-100 blur-0 translate-y-0'
            ].join(' ')}
          >
            {/* Title Text with Emerald Gradient */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.45)]">
              CSMS 클라이언트
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/70">
              Battery Management System
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default DashboardPage
