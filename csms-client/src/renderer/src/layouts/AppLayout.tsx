import { useEffect, useState } from 'react'
import { Menu, X, Settings } from 'lucide-react'
import GlobalAlert from '../components/feedback/GlobalAlert'
import Sidebar from '../components/navigation/Sidebar'
import SettingsModal from '../components/settings/SettingsModal'
import Header from '../components/layout/Header'
import ThemeModeSwitch from '../components/theme/ThemeModeSwitch'
import { useThemeStore } from '../stores/useThemeStore'
import ItemManagementPage from '../pages/ItemManagementPage'
import CsPage from '../pages/CsPage'
import CsHistoryPage from '../pages/CsHistoryPage'
import type { StoredMenu } from '../../../shared/api'

type AppLayoutProps = {
  menus: StoredMenu[]
  activeMenu?: StoredMenu
  activeMenuId: string
  onMenuChange: (menuId: string) => void
}

function AppLayout({ menus, activeMenu, activeMenuId, onMenuChange }: AppLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }, [mode])

  const handleSelectMenu = (id: string) => {
    onMenuChange(id)
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden text-slate-950 transition-colors dark:text-white">
      {window.api?.isElectron ? (
        <Header onSettingsOpen={() => setSettingsOpen(true)} />
      ) : (
        /* Web Mobile Header Bar */
        <header className="flex h-14 items-center justify-between border-b border-emerald-500/15 bg-white/70 px-4 backdrop-blur-md dark:border-emerald-900/15 dark:bg-slate-950/70 md:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-100/80 bg-white/80 text-slate-700 shadow-xs transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {window.api?.isElectron && (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </header>
      )}

      <div className="flex flex-1 min-h-0 p-2 gap-2 relative overflow-hidden">
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar (Desktop Sidebar & Mobile Drawer) */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-500/15 bg-white/95 backdrop-blur-2xl transition-transform duration-300 dark:border-emerald-900/15 dark:bg-slate-950/95 md:static md:z-auto md:w-64 md:translate-x-0 md:rounded-lg md:border md:bg-white/55 md:dark:bg-slate-950/45',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          ].join(' ')}
        >
          {/* Mobile Drawer Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-emerald-500/15 shrink-0 md:hidden">
            <div className="flex items-center gap-2">
              <Menu size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 dark:text-slate-400 cursor-pointer"
              aria-label="Close menu drawer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <Sidebar
              activeMenuId={activeMenuId}
              menus={menus}
              onMenuChange={handleSelectMenu}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto p-1 sm:p-2 pt-0 flex flex-col h-full">
            {activeMenu?.id === 'item-management' ? (
              <ItemManagementPage title={activeMenu.label} subLabel={activeMenu.subLabel} />
            ) : activeMenu?.id === 'cs-list' || activeMenu?.id === 'branch-management' ? (
              <CsPage title={activeMenu.label} subLabel={activeMenu.subLabel} />
            ) : activeMenu?.id === 'cs-history' ? (
              <CsHistoryPage title={activeMenu.label} subLabel={activeMenu.subLabel} />
            ) : (
              <div className="glass-panel p-5">
                <h2 className="text-lg font-semibold">{activeMenu?.label ?? '대시보드'}</h2>
              </div>
            )}
          </div>
        </section>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ThemeModeSwitch />
      <GlobalAlert />
    </div>
  )
}

export default AppLayout
