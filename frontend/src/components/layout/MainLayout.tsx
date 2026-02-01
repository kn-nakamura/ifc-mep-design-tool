import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IFCViewer } from '../viewer/IFCViewer';
import { useIFCStore } from '@/store/ifcStore';
import { useUIStore } from '@/store/uiStore';

export const MainLayout: React.FC = () => {
  const modelId = useIFCStore((state) => state.modelId);
  const showViewer = useUIStore((state) => state.showViewer);
  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <div className={`app-sidebar-container ${isSidebarOpen ? 'is-open' : ''}`}>
          <Sidebar width={sidebarWidth} />
        </div>

        <div className="app-viewer">
          {/* モバイル用サイドバートグルボタン */}
          {modelId && (
            <button
              className="app-mobile-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>
          )}

          {showViewer && modelId ? (
            <IFCViewer />
          ) : (
            <div
              className="app-placeholder"
            >
              <div className="app-placeholder-content">
                <div className="app-placeholder-icon">📁</div>
                <div className="app-placeholder-title">
                  IFCファイルをアップロードしてください
                </div>
                <div className="app-placeholder-subtitle">
                  左側のサイドバーからファイルを選択できます
                </div>
              </div>
            </div>
          )}
        </div>

        {/* モバイル用オーバーレイ */}
        {isSidebarOpen && modelId && (
          <div
            className="app-mobile-overlay"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
};
