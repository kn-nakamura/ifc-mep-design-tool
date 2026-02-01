import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンなど必要に応じて追加）
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // ネットワークエラー（バックエンドに接続できない場合）
    if (error.code === 'ERR_NETWORK' || !error.response) {
      error.userMessage = `バックエンドサーバーに接続できません。\nAPI URL: ${API_BASE_URL}\n\nバックエンドが起動しているか確認してください。`;
    }
    // CORSエラー
    else if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      error.userMessage = 'CORSエラーが発生しました。バックエンドのCORS設定を確認してください。';
    }
    // HTTPエラー
    else if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 400) {
        error.userMessage = detail || 'リクエストが不正です。';
      } else if (status === 413) {
        error.userMessage = 'ファイルサイズが大きすぎます。100MB以下のファイルを選択してください。';
      } else if (status === 500) {
        error.userMessage = detail || 'サーバーエラーが発生しました。IFCファイルの形式を確認してください。';
      } else {
        error.userMessage = detail || `エラーが発生しました (HTTP ${status})`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
