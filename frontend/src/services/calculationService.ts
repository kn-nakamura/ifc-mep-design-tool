import api from './api';
import type {
  VentilationCalculationInput,
  VentilationCalculationResult,
  VentilationBatchResult
} from '@/types/calculation.types';

export const calculationService = {
  /**
   * 単一スペースの換気計算
   */
  calculateVentilation: async (
    input: VentilationCalculationInput,
    modelId?: string
  ): Promise<VentilationCalculationResult> => {
    const params = modelId ? { model_id: modelId } : {};
    const response = await api.post<VentilationCalculationResult>(
      '/api/calculations/ventilation',
      input,
      { params }
    );
    return response.data;
  },

  /**
   * 複数スペースの換気計算（一括）
   */
  calculateVentilationBatch: async (
    inputs: VentilationCalculationInput[],
    modelId?: string
  ): Promise<VentilationBatchResult> => {
    const params = modelId ? { model_id: modelId } : {};
    const response = await api.post<VentilationBatchResult>(
      '/api/calculations/ventilation/batch',
      inputs,
      { params }
    );
    return response.data;
  },

  /**
   * モデル内の全スペースの換気計算
   */
  calculateAllSpacesVentilation: async (
    modelId: string,
    method: string = 'building_code'
  ): Promise<VentilationBatchResult> => {
    const response = await api.post<VentilationBatchResult>(
      `/api/calculations/${modelId}/ventilation/all`,
      null,
      { params: { method } }
    );
    return response.data;
  },
};
