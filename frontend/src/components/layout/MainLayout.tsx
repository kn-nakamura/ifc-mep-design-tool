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

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar width={sidebarWidth} />
        <div className="app-viewer">
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
      </div>
    </div>
  );
};
