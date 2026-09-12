import { create } from 'zustand'
import type { StoredMenu } from '../../../shared/api'

// 배열에 선언한 순서가 화면의 위에서 아래 순서입니다.
const defaultMenus: StoredMenu[] = [
  {
    id: 'cs-management', label: 'CS 관리', subLabel: 'CS 문의를 접수하고 처리합니다.', path: '/cs-management', closable: false,
    children: [
      { id: 'cs-list', label: 'CS 목록', subLabel: '접수된 CS 목록을 확인합니다.', path: '/cs-list', closable: false },
      { id: 'cs-history', label: 'CS 히스토리', subLabel: '접수된 CS 이력을 확인합니다.', path: '/cs-history', closable: false }
    ]
  },
  { id: 'item-management', label: '재고 관리', subLabel: 'CS 관리에 사용하는 품목과 재고 수량을 관리합니다.', path: '/item-management', closable: false }
]

export function flattenMenus(menus: StoredMenu[]): StoredMenu[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children ?? [])])
}

type MenuState = {
  menus: StoredMenu[]
  activeMenuId: string
  activeMenu?: StoredMenu
  loadMenus: () => Promise<void>
  setActiveMenuId: (menuId: string, pushHistory?: boolean) => void
}

function getMenuFromPath(menus: StoredMenu[]): StoredMenu {
  const allMenus = flattenMenus(menus)
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
  const fallback = allMenus.find((menu) => menu.id === 'cs-list') ?? allMenus[0]
  return allMenus.find((menu) => menu.path === currentPath) ?? fallback
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [], activeMenuId: 'cs-list', activeMenu: undefined,
  loadMenus: async () => {
    const menus = defaultMenus
    const matchedMenu = getMenuFromPath(menus)
    if (window.location.pathname === '/' || window.location.pathname === '') window.history.replaceState({}, '', matchedMenu.path)
    set({ menus, activeMenu: matchedMenu, activeMenuId: matchedMenu.id })
  },
  setActiveMenuId: (menuId, pushHistory = true) => {
    const activeMenu = flattenMenus(get().menus).find((menu) => menu.id === menuId)
    if (!activeMenu) return
    if (pushHistory && window.location.pathname !== activeMenu.path) window.history.pushState({}, '', activeMenu.path)
    set({ activeMenuId: menuId, activeMenu })
  }
}))
