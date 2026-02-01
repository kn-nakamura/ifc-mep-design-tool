import React, { useState, useEffect } from 'react';
import { useIFCStore } from '@/store/ifcStore';
import { useUIStore } from '@/store/uiStore';
import { ifcService } from '@/services/ifcService';
import { SpaceListPanel } from '../panels/SpaceListPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { CalculationPanel } from '../panels/CalculationPanel';
import { FilterPanel } from '../panels/FilterPanel';

interface SidebarProps {
  width: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  const { modelId, setModelId, setModelInfo, setSpaces, setLoading, reset } = useIFCStore();
  const { activePanel, setActivePanel } = useUIStore();

  // APIの接続状態を確認
  useEffect(() => {
    const checkApiStatus = async () => {
      const isConnected = await ifcService.checkHealth();
      setApiStatus(isConnected ? 'connected' : 'disconnected');
    };
    checkApiStatus();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setLoading(true);

    try {
      // IFCファイルをアップロード
      const uploadResponse = await ifcService.uploadIFC(file);
      
      // モデルIDを保存
      setModelId(uploadResponse.modelId);
      
      // モデル情報を取得
      const modelInfo = await ifcService.getModelInfo(uploadResponse.modelId);
      setModelInfo(modelInfo);
      
      // スペース一覧を取得
      const spacesData = await ifcService.getSpaces(uploadResponse.modelId);
      setSpaces(spacesData.spaces);
      
      // デフォルトでスペースパネルを表示
      setActivePanel('spaces');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      // userMessageがあればそれを使用、なければレスポンスのdetail、最後にデフォルトメッセージ
      const errorMessage = error.userMessage || error.response?.data?.detail || 'ファイルのアップロードに失敗しました';
      setUploadError(errorMessage);
      reset();
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    if (window.confirm('新しいプロジェクトを開始しますか？現在のデータは失われます。')) {
      reset();
      setUploadError(null);
    }
  };

  return (
    <div
      className="app-sidebar"
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
    >
      {/* タブメニュー */}
      {modelId && (
        <div
          className="app-sidebar-tabs"
        >
          <TabButton
            active={activePanel === 'spaces'}
            onClick={() => setActivePanel('spaces')}
          >
            スペース
          </TabButton>
          <TabButton
            active={activePanel === 'filter'}
            onClick={() => setActivePanel('filter')}
          >
            フィルター
          </TabButton>
          <TabButton
            active={activePanel === 'properties'}
            onClick={() => setActivePanel('properties')}
          >
            プロパティ
          </TabButton>
          <TabButton
            active={activePanel === 'calculation'}
            onClick={() => setActivePanel('calculation')}
          >
            換気計算
          </TabButton>
        </div>
      )}

      {/* コンテンツエリア */}
      <div className="app-sidebar-content">
        {!modelId ? (
          /* ファイルアップロードUI */
          <div>
            <h3 className="app-sidebar-heading">
              新しいプロジェクト
            </h3>

            {/* API接続状態 */}
            {apiStatus === 'disconnected' && (
              <div
                className="app-sidebar-warning"
              >
                <strong>警告:</strong> バックエンドサーバーに接続できません。
                <br />
                サーバーが起動しているか確認してください。
              </div>
            )}

            <label
              htmlFor="ifc-file-input"
              className="app-upload"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#3498db';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2c3e50';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#2c3e50';
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = document.getElementById('ifc-file-input') as HTMLInputElement;
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  input.files = dataTransfer.files;
                  handleFileUpload({ target: input } as any);
                }
              }}
            >
              <div className="app-upload-icon">📁</div>
              <div className="app-upload-title">
                IFCファイルをドラッグ＆ドロップ
              </div>
              <div className="app-upload-subtitle">
                またはクリックしてファイルを選択
              </div>
              <input
                id="ifc-file-input"
                type="file"
                accept=".ifc"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
            </label>

            {isUploading && (
              <div
                className="app-upload-status"
              >
                アップロード中...
              </div>
            )}

            {uploadError && (
              <div
                className="app-upload-error"
              >
                {uploadError}
              </div>
            )}
          </div>
        ) : (
          /* パネル表示 */
          <>
            <button
              onClick={handleNewProject}
              className="app-new-project"
            >
              新しいプロジェクト
            </button>

            {activePanel === 'spaces' && <SpaceListPanel />}
            {activePanel === 'filter' && <FilterPanel />}
            {activePanel === 'properties' && <PropertyPanel />}
            {activePanel === 'calculation' && <CalculationPanel />}
          </>
        )}
      </div>
    </div>
  );
};

// タブボタンコンポーネント
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`app-sidebar-tab${active ? ' is-active' : ''}`}
  >
    {children}
  </button>
);
