import type { StoredMenu } from '../../../../shared/api'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type SidebarProps = {
  menus: StoredMenu[]
  activeMenuId: string
  onMenuChange: (menuId: string) => void
}

function Sidebar({ menus, activeMenuId, onMenuChange }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const groupedMenus = useMemo(() => {
    const topLevelMenus = menus.filter((menu) => !menu.parentId)
    const childrenByParent = new Map<string, StoredMenu[]>()

    for (const menu of menus) {
      if (!menu.parentId) {
        continue
      }

      const children = childrenByParent.get(menu.parentId) ?? []
      children.push(menu)
      childrenByParent.set(menu.parentId, children)
    }

    return topLevelMenus.map((menu) => ({
      menu,
      children: (childrenByParent.get(menu.id) ?? []).sort((left, right) => left.order - right.order)
    }))
  }, [menus])

  const toggleGroup = (menuId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [menuId]: !current[menuId]
    }))
  }

  if (groupedMenus.length === 0) {
    return null
  }

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-1 py-2">
      {groupedMenus.map(({ menu, children }) => {
        const isExpanded = expandedGroups[menu.id] ?? true
        const hasChildren = children.length > 0

        return (
          <div key={menu.id} className="space-y-1">
            <button
              className={[
                'flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
                activeMenuId === menu.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
              ].join(' ')}
              type="button"
              onClick={() => {
                if (hasChildren) {
                  toggleGroup(menu.id)
                } else {
                  onMenuChange(menu.id)
                }
              }}
            >
              <span className="flex-1">{menu.label}</span>
              {hasChildren ? (
                <span
                  aria-hidden="true"
                  className="text-current opacity-70"
                >
                  {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
              ) : null}
            </button>

            {hasChildren && isExpanded ? (
              <div className="space-y-1 pl-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={[
                      'flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
                      activeMenuId === child.id
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
                    ].join(' ')}
                    type="button"
                    onClick={() => onMenuChange(child.id)}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export default Sidebar
