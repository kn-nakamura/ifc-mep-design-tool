import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const Header: React.FC = () => {
  const modelInfo = useIFCStore((state) => state.modelInfo);

  return (
    <header
      className="app-header"
    >
      <div className="app-header-content">
        <div className="app-header-title">
          IFC MEP Design Tool
        </div>
        {modelInfo && (
          <>
            <div className="app-header-separator" />
            <div className="app-header-filename">
              {modelInfo.filename}
            </div>
            <div className="app-header-badge">
              {modelInfo.spaceCount} スペース
            </div>
          </>
        )}
      </div>
    </header>
  );
};
