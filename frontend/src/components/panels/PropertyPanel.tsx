import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const PropertyPanel: React.FC = () => {
  const selectedSpace = useIFCStore((state) => state.selectedSpace());

  if (!selectedSpace) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', opacity: 0.6 }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
        <div>スペースを選択してください</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        スペース詳細
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <PropertyItem label="室名" value={selectedSpace.name} />
        {selectedSpace.longName && (
          <PropertyItem label="詳細名称" value={selectedSpace.longName} />
        )}
        {selectedSpace.description && (
          <PropertyItem label="説明" value={selectedSpace.description} />
        )}
        
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        
        {selectedSpace.area && (
          <PropertyItem label="床面積" value={`${selectedSpace.area.toFixed(2)} m²`} />
        )}
        {selectedSpace.volume && (
          <PropertyItem label="容積" value={`${selectedSpace.volume.toFixed(2)} m³`} />
        )}
        {selectedSpace.height && (
          <PropertyItem label="天井高" value={`${selectedSpace.height.toFixed(2)} m`} />
        )}
        
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        
        {selectedSpace.floorLevel && (
          <PropertyItem label="階レベル" value={selectedSpace.floorLevel} />
        )}
        {selectedSpace.usage && (
          <PropertyItem label="用途" value={selectedSpace.usage} />
        )}
        {selectedSpace.occupancy && (
          <PropertyItem label="想定在室人数" value={`${selectedSpace.occupancy} 人`} />
        )}
        
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
        
        <PropertyItem label="ID" value={selectedSpace.id} small />
        {selectedSpace.globalId && (
          <PropertyItem label="Global ID" value={selectedSpace.globalId} small />
        )}
      </div>
    </div>
  );
};

// プロパティアイテムコンポーネント
const PropertyItem: React.FC<{
  label: string;
  value: string;
  small?: boolean;
}> = ({ label, value, small }) => (
  <div>
    <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: small ? '11px' : '14px', wordBreak: 'break-word' }}>
      {value}
    </div>
  </div>
);
