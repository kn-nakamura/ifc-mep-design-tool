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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar width={sidebarWidth} />
        <div style={{ flex: 1, position: 'relative' }}>
          {showViewer && modelId ? (
            <IFCViewer />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#f5f5f5',
                color: '#666',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                  IFCファイルをアップロードしてください
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
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
