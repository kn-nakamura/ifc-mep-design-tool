import api from './api';
import type { IFCUploadResponse, IFCModelInfo, SpaceList, Space } from '@/types/ifc.types';

export const ifcService = {
  /**
   * バックエンドの接続状態を確認
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      await api.get('/health');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * IFCファイルをアップロード
   */
  uploadIFC: async (file: File): Promise<IFCUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<IFCUploadResponse>('/api/ifc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * IFCモデル情報を取得
   */
  getModelInfo: async (modelId: string): Promise<IFCModelInfo> => {
    const response = await api.get<IFCModelInfo>(`/api/ifc/${modelId}/info`);
    return response.data;
  },

  /**
   * スペース一覧を取得
   */
  getSpaces: async (modelId: string): Promise<SpaceList> => {
    const response = await api.get<SpaceList>(`/api/ifc/${modelId}/spaces`);
    return response.data;
  },

  /**
   * 特定のスペース詳細を取得
   */
  getSpaceDetail: async (modelId: string, spaceId: string): Promise<Space> => {
    const response = await api.get<Space>(`/api/ifc/${modelId}/spaces/${spaceId}`);
    return response.data;
  },

  /**
   * IFCモデルを削除
   */
  deleteModel: async (modelId: string): Promise<void> => {
    await api.delete(`/api/ifc/${modelId}`);
  },
};
