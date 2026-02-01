import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const Header: React.FC = () => {
  const modelInfo = useIFCStore((state) => state.modelInfo);

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#2c3e50',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          IFC MEP Design Tool
        </div>
        {modelInfo && (
          <>
            <div
              style={{
                height: '24px',
                width: '1px',
                backgroundColor: 'rgba(255,255,255,0.3)',
              }}
            />
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {modelInfo.filename}
            </div>
            <div
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
              }}
            >
              {modelInfo.spaceCount} スペース
            </div>
          </>
        )}
      </div>
    </header>
  );
};
