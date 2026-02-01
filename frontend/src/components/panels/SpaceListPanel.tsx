import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const SpaceListPanel: React.FC = () => {
  const filteredSpaces = useIFCStore((state) => state.filteredSpaces());
  const allSpaces = useIFCStore((state) => state.spaces);
  const selectedSpaceIds = useIFCStore((state) => state.selectedSpaceIds);
  const setSelectedSpaceIds = useIFCStore((state) => state.setSelectedSpaceIds);
  const toggleSelectedSpaceId = useIFCStore((state) => state.toggleSelectedSpaceId);

  const handleSpaceClick = (spaceId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmdキーが押されている場合は複数選択
      toggleSelectedSpaceId(spaceId);
    } else {
      // それ以外は単一選択
      setSelectedSpaceIds([spaceId]);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
        スペース一覧 ({filteredSpaces.length}/{allSpaces.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredSpaces.map((space) => {
          const isSelected = selectedSpaceIds.includes(space.id);

          return (
            <div
              key={space.id}
              onClick={(e) => handleSpaceClick(space.id, e)}
              style={{
                padding: '12px',
                backgroundColor: isSelected ? '#3498db' : '#2c3e50',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: isSelected ? '2px solid #5dade2' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#2c3440';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#2c3e50';
                }
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {space.name}
              </div>

              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {space.area && (
                  <div>
                    面積: {space.area.toFixed(2)} m²
                  </div>
                )}
                {space.volume && (
                  <div>
                    容積: {space.volume.toFixed(2)} m³
                  </div>
                )}
                {space.height && (
                  <div>
                    天井高: {space.height.toFixed(2)} m
                  </div>
                )}
                {space.floorLevel && (
                  <div>
                    階: {space.floorLevel}
                  </div>
                )}
                {space.usage && (
                  <div>
                    用途: {space.usage}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSpaceIds.length > 1 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          {selectedSpaceIds.length} 個のスペースを選択中
        </div>
      )}
    </div>
  );
};
