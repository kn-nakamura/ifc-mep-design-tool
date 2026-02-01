import { create } from 'zustand';

type ActivePanel = 'spaces' | 'properties' | 'calculation' | 'filter' | 'export-import' | 'grouping' | null;

interface UIStore {
  activePanel: ActivePanel;
  showViewer: boolean;
  sidebarWidth: number;
  isSidebarOpen: boolean;

  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  setShowViewer: (show: boolean) => void;
  setSidebarWidth: (width: number) => void;
  togglePanel: (panel: ActivePanel) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  activePanel: 'spaces',
  showViewer: true,
  sidebarWidth: 320,
  isSidebarOpen: true,

  setActivePanel: (activePanel) => set({ activePanel }),
  setShowViewer: (showViewer) => set({ showViewer }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

  togglePanel: (panel) => {
    const { activePanel } = get();
    set({ activePanel: activePanel === panel ? null : panel });
  },

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  toggleSidebar: () => {
    const { isSidebarOpen } = get();
    set({ isSidebarOpen: !isSidebarOpen });
  },
}));
