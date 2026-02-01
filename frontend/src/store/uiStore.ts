import { create } from 'zustand';

type ActivePanel = 'spaces' | 'properties' | 'calculation' | null;

interface UIStore {
  activePanel: ActivePanel;
  showViewer: boolean;
  sidebarWidth: number;
  
  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  setShowViewer: (show: boolean) => void;
  setSidebarWidth: (width: number) => void;
  togglePanel: (panel: ActivePanel) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  activePanel: 'spaces',
  showViewer: true,
  sidebarWidth: 320,
  
  setActivePanel: (activePanel) => set({ activePanel }),
  setShowViewer: (showViewer) => set({ showViewer }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  
  togglePanel: (panel) => {
    const { activePanel } = get();
    set({ activePanel: activePanel === panel ? null : panel });
  },
}));
