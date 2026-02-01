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
  customFilters: Record<string, string>; // カスタムパラメーターフィルター
}

export interface SpaceGrouping {
  enabled: boolean;
  propertyKey: string | null;
}

interface IFCStore {
  modelId: string | null;
  modelInfo: IFCModelInfo | null;
  spaces: Space[];
  selectedSpaceIds: string[];
  filters: SpaceFilters;
  grouping: SpaceGrouping;
  colorByProperty: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setModelId: (modelId: string | null) => void;
  setModelInfo: (info: IFCModelInfo | null) => void;
  setSpaces: (spaces: Space[]) => void;
  updateSpaceProperties: (spaceId: string, properties: Record<string, any>) => void;
  updateMultipleSpaces: (updates: Array<{ id: string; properties: Record<string, any> }>) => void;
  setSelectedSpaceIds: (spaceIds: string[]) => void;
  addSelectedSpaceId: (spaceId: string) => void;
  removeSelectedSpaceId: (spaceId: string) => void;
  toggleSelectedSpaceId: (spaceId: string) => void;
  setFilters: (filters: Partial<SpaceFilters>) => void;
  resetFilters: () => void;
  setGrouping: (grouping: Partial<SpaceGrouping>) => void;
  setColorByProperty: (propertyKey: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  selectedSpaces: () => Space[];
  filteredSpaces: () => Space[];
  groupedSpaces: () => Record<string, Space[]>;
  availableFloorLevels: () => string[];
  availablePropertyKeys: () => string[];
  availablePropertyValues: (propertyKey: string) => string[];
}

const defaultFilters: SpaceFilters = {
  floorLevels: [],
  minArea: null,
  maxArea: null,
  minVolume: null,
  maxVolume: null,
  minHeight: null,
  maxHeight: null,
  customFilters: {},
};

const defaultGrouping: SpaceGrouping = {
  enabled: false,
  propertyKey: null,
};

export const useIFCStore = create<IFCStore>((set, get) => ({
  modelId: null,
  modelInfo: null,
  spaces: [],
  selectedSpaceIds: [],
  filters: defaultFilters,
  grouping: defaultGrouping,
  colorByProperty: null,
  isLoading: false,
  error: null,

  setModelId: (modelId) => set({ modelId }),
  setModelInfo: (modelInfo) => set({ modelInfo }),
  setSpaces: (spaces) => set({ spaces }),

  updateSpaceProperties: (spaceId, properties) => {
    const { spaces } = get();
    const updatedSpaces = spaces.map(space =>
      space.id === spaceId
        ? { ...space, properties: { ...space.properties, ...properties } }
        : space
    );
    set({ spaces: updatedSpaces });
  },

  updateMultipleSpaces: (updates) => {
    const { spaces } = get();
    const updateMap = new Map(updates.map(u => [u.id, u.properties]));
    const updatedSpaces = spaces.map(space => {
      const update = updateMap.get(space.id);
      return update
        ? { ...space, properties: { ...space.properties, ...update } }
        : space;
    });
    set({ spaces: updatedSpaces });
  },

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

  setGrouping: (grouping) => {
    const currentGrouping = get().grouping;
    set({ grouping: { ...currentGrouping, ...grouping } });
  },

  setColorByProperty: (colorByProperty) => set({ colorByProperty }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () => set({
    modelId: null,
    modelInfo: null,
    spaces: [],
    selectedSpaceIds: [],
    filters: defaultFilters,
    grouping: defaultGrouping,
    colorByProperty: null,
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

      // カスタムフィルター
      for (const [key, value] of Object.entries(filters.customFilters)) {
        if (value && space.properties[key] !== value) {
          return false;
        }
      }

      return true;
    });
  },

  groupedSpaces: () => {
    const { grouping } = get();
    const filteredSpaces = get().filteredSpaces();

    if (!grouping.enabled || !grouping.propertyKey) {
      return { 'すべて': filteredSpaces };
    }

    const grouped: Record<string, Space[]> = {};

    filteredSpaces.forEach(space => {
      const value = space.properties[grouping.propertyKey!];
      const key = value !== undefined && value !== null ? String(value) : '(未設定)';

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(space);
    });

    return grouped;
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

  availablePropertyKeys: () => {
    const { spaces } = get();
    const keys = new Set<string>();
    spaces.forEach(space => {
      Object.keys(space.properties).forEach(key => keys.add(key));
    });
    return Array.from(keys).sort();
  },

  availablePropertyValues: (propertyKey: string) => {
    const { spaces } = get();
    const values = new Set<string>();
    spaces.forEach(space => {
      const value = space.properties[propertyKey];
      if (value !== undefined && value !== null) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  },
}));
