import { create } from 'zustand';
import type { VentilationCalculationResult } from '@/types/calculation.types';

interface CalculationStore {
  ventilationResults: Record<string, VentilationCalculationResult>;
  isCalculating: boolean;
  
  // Actions
  setVentilationResult: (spaceId: string, result: VentilationCalculationResult) => void;
  setVentilationResults: (results: VentilationCalculationResult[]) => void;
  setCalculating: (calculating: boolean) => void;
  clearResults: () => void;
  
  // Computed
  getResultForSpace: (spaceId: string) => VentilationCalculationResult | null;
}

export const useCalculationStore = create<CalculationStore>((set, get) => ({
  ventilationResults: {},
  isCalculating: false,
  
  setVentilationResult: (spaceId, result) =>
    set((state) => ({
      ventilationResults: {
        ...state.ventilationResults,
        [spaceId]: result,
      },
    })),
  
  setVentilationResults: (results) =>
    set({
      ventilationResults: results.reduce((acc, result) => ({
        ...acc,
        [result.spaceId]: result,
      }), {}),
    }),
  
  setCalculating: (isCalculating) => set({ isCalculating }),
  
  clearResults: () => set({ ventilationResults: {}, isCalculating: false }),
  
  getResultForSpace: (spaceId) => {
    const { ventilationResults } = get();
    return ventilationResults[spaceId] || null;
  },
}));
