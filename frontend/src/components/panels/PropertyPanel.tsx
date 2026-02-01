import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const PropertyPanel: React.FC = () => {
  const selectedSpaces = useIFCStore((state) => state.selectedSpaces());

  if (selectedSpaces.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', opacity: 0.6 }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
        <div>スペースを選択してください</div>
      </div>
    );
  }

  // 複数選択の場合は集計情報を表示
  if (selectedSpaces.length > 1) {
    const totalArea = selectedSpaces.reduce((sum, s) => sum + (s.area || 0), 0);
    const totalVolume = selectedSpaces.reduce((sum, s) => sum + (s.volume || 0), 0);
    const avgHeight = selectedSpaces.reduce((sum, s) => sum + (s.height || 0), 0) / selectedSpaces.length;

    return (
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
          選択中のスペース ({selectedSpaces.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PropertyItem label="合計床面積" value={`${totalArea.toFixed(2)} m²`} />
          {totalVolume > 0 && (
            <PropertyItem label="合計容積" value={`${totalVolume.toFixed(2)} m³`} />
          )}
          {avgHeight > 0 && (
            <PropertyItem label="平均天井高" value={`${avgHeight.toFixed(2)} m`} />
          )}

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {selectedSpaces.map((space) => (
              <div
                key={space.id}
                style={{
                  padding: '8px',
                  marginBottom: '8px',
                  backgroundColor: 'rgba(52, 152, 219, 0.2)',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{space.name}</div>
                {space.area && <div>面積: {space.area.toFixed(2)} m²</div>}
                {space.floorLevel && <div>階: {space.floorLevel}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 単一選択の場合は詳細情報を表示
  const selectedSpace = selectedSpaces[0];

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
