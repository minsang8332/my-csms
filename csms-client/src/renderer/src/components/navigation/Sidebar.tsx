import type { StoredMenu } from '../../../../shared/api'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type SidebarProps = { menus: StoredMenu[]; activeMenuId: string; onMenuChange: (menuId: string) => void }
type MenuNodeProps = Omit<SidebarProps, 'menus'> & { menu: StoredMenu; depth: number }

function MenuNode({ menu, depth, activeMenuId, onMenuChange }: MenuNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const children = menu.children ?? []
  const hasChildren = children.length > 0

  return <div className="space-y-1">
    <button
      className={['flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none', activeMenuId === menu.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'].join(' ')}
      style={{ paddingLeft: `${12 + depth * 12}px` }} type="button"
      onClick={() => hasChildren ? setExpanded((value) => !value) : onMenuChange(menu.id)}
    >
      <span className="flex-1">{menu.label}</span>
      {hasChildren && <span aria-hidden="true" className="text-current opacity-70">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>}
    </button>
    {hasChildren && expanded && children.map((child) => <MenuNode key={child.id} menu={child} depth={depth + 1} activeMenuId={activeMenuId} onMenuChange={onMenuChange} />)}
  </div>
}

function Sidebar({ menus, activeMenuId, onMenuChange }: SidebarProps) {
  if (menus.length === 0) return null
  return <nav className="flex-1 space-y-1 overflow-y-auto px-1 py-2">
    {menus.map((menu) => <MenuNode key={menu.id} menu={menu} depth={0} activeMenuId={activeMenuId} onMenuChange={onMenuChange} />)}
  </nav>
}

export default Sidebar
