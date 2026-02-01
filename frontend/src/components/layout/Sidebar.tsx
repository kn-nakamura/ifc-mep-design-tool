import React, { useState } from 'react';
import { useIFCStore } from '@/store/ifcStore';
import { useUIStore } from '@/store/uiStore';
import { ifcService } from '@/services/ifcService';
import { SpaceListPanel } from '../panels/SpaceListPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { CalculationPanel } from '../panels/CalculationPanel';

interface SidebarProps {
  width: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { modelId, setModelId, setModelInfo, setSpaces, setLoading, reset } = useIFCStore();
  const { activePanel, setActivePanel } = useUIStore();

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
      setUploadError(error.response?.data?.detail || 'ファイルのアップロードに失敗しました');
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
      style={{
        width: `${width}px`,
        height: '100%',
        backgroundColor: '#34495e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #2c3e50',
      }}
    >
      {/* タブメニュー */}
      {modelId && (
        <div
          style={{
            display: 'flex',
            backgroundColor: '#2c3e50',
            borderBottom: '1px solid #1a252f',
          }}
        >
          <TabButton
            active={activePanel === 'spaces'}
            onClick={() => setActivePanel('spaces')}
          >
            スペース
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
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {!modelId ? (
          /* ファイルアップロードUI */
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
              新しいプロジェクト
            </h3>
            
            <label
              htmlFor="ifc-file-input"
              style={{
                display: 'block',
                border: '2px dashed #3498db',
                borderRadius: '8px',
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#2c3e50',
                transition: 'all 0.2s',
              }}
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
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
              <div style={{ marginBottom: '8px' }}>
                IFCファイルをドラッグ＆ドロップ
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
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
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#3498db',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                アップロード中...
              </div>
            )}

            {uploadError && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
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
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              新しいプロジェクト
            </button>

            {activePanel === 'spaces' && <SpaceListPanel />}
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
    style={{
      flex: 1,
      padding: '12px 8px',
      backgroundColor: active ? '#34495e' : 'transparent',
      color: active ? 'white' : '#95a5a6',
      border: 'none',
      borderBottom: active ? '2px solid #3498db' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.2s',
    }}
  >
    {children}
  </button>
);
