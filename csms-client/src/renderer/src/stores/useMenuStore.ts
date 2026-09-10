import { create } from "zustand";
import type { StoredMenu } from "../../../shared/api";

const defaultMenus: StoredMenu[] = [
  {
    id: "item-management",
    label: "재고 관리",
    subLabel: "CS 관리에 사용되는 품목 및 재고 수량을 관리합니다.",
    path: "/item-management",
    order: 5,
    closable: false,
  },
  {
    id: "cs-management",
    label: "CS 관리",
    subLabel: "CS 문의를 접수하고 처리 할 수 있습니다.",
    path: "/cs-management",
    order: 1,
    closable: false,
  },
  {
    id: "cs-list",
    label: "CS 목록",
    subLabel: "접수된 CS 목록을 확인 할 수 있습니다",
    path: "/cs-list",
    order: 11,
    closable: false,
    parentId: "cs-management",
  },
  {
    id: "cs-history",
    label: "CS 히스토리",
    subLabel: "접수된 CS 이력을 확인 할 수 있습니다",
    path: "/cs-history",
    order: 12,
    closable: false,
    parentId: "cs-management",
  },
  {
    id: "epaper-design",
    label: "전자종이 디자인 투표",
    subLabel: "전자종이 디자인 시안 검토 및 투표",
    path: "/epaper-design",
    order: 5,
    closable: false,
  },
];

type MenuState = {
  menus: StoredMenu[];
  activeMenuId: string;
  activeMenu?: StoredMenu;
  loadMenus: () => Promise<void>;
  setActiveMenuId: (menuId: string, pushHistory?: boolean) => void;
};

function getMenuFromPath(menus: StoredMenu[]): StoredMenu {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const csListMenu = menus.find((m) => m.id === "cs-list") || menus[0];

  if (currentPath === "/" || currentPath === "" || currentPath === "/cs-list") {
    return csListMenu;
  }

  const matched = menus.find(
    (m) => m.path === currentPath || m.path === `/${currentPath}`,
  );
  return matched || csListMenu;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  activeMenuId: "cs-list",
  activeMenu: undefined,
  loadMenus: async () => {
    const menus = [...defaultMenus].sort((a, b) => a.order - b.order);
    const matchedMenu = getMenuFromPath(menus);

    if (window.location.pathname === "/" || window.location.pathname === "") {
      window.history.replaceState({}, "", matchedMenu.path);
    }

    set({
      menus,
      activeMenu: matchedMenu,
      activeMenuId: matchedMenu.id,
    });
  },
  setActiveMenuId: (menuId, pushHistory = true) => {
    const activeMenu = get().menus.find((menu) => menu.id === menuId);
    if (!activeMenu) return;

    if (pushHistory && window.location.pathname !== activeMenu.path) {
      window.history.pushState({}, "", activeMenu.path);
    }

    set({
      activeMenuId: menuId,
      activeMenu,
    });
  },
}));
