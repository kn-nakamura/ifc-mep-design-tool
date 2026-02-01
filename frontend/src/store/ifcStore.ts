import { create } from 'zustand';
import type { Space, IFCModelInfo } from '@/types/ifc.types';

interface IFCStore {
  modelId: string | null;
  modelInfo: IFCModelInfo | null;
  spaces: Space[];
  selectedSpaceId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setModelId: (modelId: string | null) => void;
  setModelInfo: (info: IFCModelInfo | null) => void;
  setSpaces: (spaces: Space[]) => void;
  setSelectedSpaceId: (spaceId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Computed
  selectedSpace: () => Space | null;
}

export const useIFCStore = create<IFCStore>((set, get) => ({
  modelId: null,
  modelInfo: null,
  spaces: [],
  selectedSpaceId: null,
  isLoading: false,
  error: null,
  
  setModelId: (modelId) => set({ modelId }),
  setModelInfo: (modelInfo) => set({ modelInfo }),
  setSpaces: (spaces) => set({ spaces }),
  setSelectedSpaceId: (selectedSpaceId) => set({ selectedSpaceId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    modelId: null,
    modelInfo: null,
    spaces: [],
    selectedSpaceId: null,
    isLoading: false,
    error: null,
  }),
  
  selectedSpace: () => {
    const { spaces, selectedSpaceId } = get();
    return spaces.find(s => s.id === selectedSpaceId) || null;
  },
}));
