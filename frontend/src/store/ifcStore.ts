import { create } from 'zustand';
import type { Space, IFCModelInfo } from '@/types/ifc.types';

export interface SpaceFilters {
  floorLevels: string[];
  minArea: number | null;
  maxArea: number | null;
  minVolume: number | null;
  maxVolume: number | null;
  minHeight: number | null;
  maxHeight: number | null;
}

interface IFCStore {
  modelId: string | null;
  modelInfo: IFCModelInfo | null;
  spaces: Space[];
  selectedSpaceIds: string[];
  filters: SpaceFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  setModelId: (modelId: string | null) => void;
  setModelInfo: (info: IFCModelInfo | null) => void;
  setSpaces: (spaces: Space[]) => void;
  setSelectedSpaceIds: (spaceIds: string[]) => void;
  addSelectedSpaceId: (spaceId: string) => void;
  removeSelectedSpaceId: (spaceId: string) => void;
  toggleSelectedSpaceId: (spaceId: string) => void;
  setFilters: (filters: Partial<SpaceFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  selectedSpaces: () => Space[];
  filteredSpaces: () => Space[];
  availableFloorLevels: () => string[];
}

const defaultFilters: SpaceFilters = {
  floorLevels: [],
  minArea: null,
  maxArea: null,
  minVolume: null,
  maxVolume: null,
  minHeight: null,
  maxHeight: null,
};

export const useIFCStore = create<IFCStore>((set, get) => ({
  modelId: null,
  modelInfo: null,
  spaces: [],
  selectedSpaceIds: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setModelId: (modelId) => set({ modelId }),
  setModelInfo: (modelInfo) => set({ modelInfo }),
  setSpaces: (spaces) => set({ spaces }),
  setSelectedSpaceIds: (selectedSpaceIds) => set({ selectedSpaceIds }),

  addSelectedSpaceId: (spaceId) => {
    const { selectedSpaceIds } = get();
    if (!selectedSpaceIds.includes(spaceId)) {
      set({ selectedSpaceIds: [...selectedSpaceIds, spaceId] });
    }
  },

  removeSelectedSpaceId: (spaceId) => {
    const { selectedSpaceIds } = get();
    set({ selectedSpaceIds: selectedSpaceIds.filter(id => id !== spaceId) });
  },

  toggleSelectedSpaceId: (spaceId) => {
    const { selectedSpaceIds } = get();
    if (selectedSpaceIds.includes(spaceId)) {
      set({ selectedSpaceIds: selectedSpaceIds.filter(id => id !== spaceId) });
    } else {
      set({ selectedSpaceIds: [...selectedSpaceIds, spaceId] });
    }
  },

  setFilters: (filters) => {
    const currentFilters = get().filters;
    set({ filters: { ...currentFilters, ...filters } });
  },

  resetFilters: () => set({ filters: defaultFilters }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () => set({
    modelId: null,
    modelInfo: null,
    spaces: [],
    selectedSpaceIds: [],
    filters: defaultFilters,
    isLoading: false,
    error: null,
  }),

  selectedSpaces: () => {
    const { spaces, selectedSpaceIds } = get();
    return spaces.filter(s => selectedSpaceIds.includes(s.id));
  },

  filteredSpaces: () => {
    const { spaces, filters } = get();
    return spaces.filter(space => {
      // 階フィルター
      if (filters.floorLevels.length > 0 && space.floorLevel) {
        if (!filters.floorLevels.includes(space.floorLevel)) {
          return false;
        }
      }

      // 面積フィルター
      if (filters.minArea !== null && space.area !== undefined) {
        if (space.area < filters.minArea) return false;
      }
      if (filters.maxArea !== null && space.area !== undefined) {
        if (space.area > filters.maxArea) return false;
      }

      // 容積フィルター
      if (filters.minVolume !== null && space.volume !== undefined) {
        if (space.volume < filters.minVolume) return false;
      }
      if (filters.maxVolume !== null && space.volume !== undefined) {
        if (space.volume > filters.maxVolume) return false;
      }

      // 天井高フィルター
      if (filters.minHeight !== null && space.height !== undefined) {
        if (space.height < filters.minHeight) return false;
      }
      if (filters.maxHeight !== null && space.height !== undefined) {
        if (space.height > filters.maxHeight) return false;
      }

      return true;
    });
  },

  availableFloorLevels: () => {
    const { spaces } = get();
    const levels = new Set<string>();
    spaces.forEach(space => {
      if (space.floorLevel) {
        levels.add(space.floorLevel);
      }
    });
    return Array.from(levels).sort();
  },
}));
