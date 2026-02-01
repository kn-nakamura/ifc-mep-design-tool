import React from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const SpaceListPanel: React.FC = () => {
  const spaces = useIFCStore((state) => state.spaces);
  const selectedSpaceId = useIFCStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useIFCStore((state) => state.setSelectedSpaceId);

  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
        スペース一覧 ({spaces.length})
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {spaces.map((space) => (
          <div
            key={space.id}
            onClick={() => setSelectedSpaceId(space.id)}
            style={{
              padding: '12px',
              backgroundColor: selectedSpaceId === space.id ? '#3498db' : '#2c3e50',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedSpaceId === space.id ? '2px solid #5dade2' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (selectedSpaceId !== space.id) {
                e.currentTarget.style.backgroundColor = '#2c3440';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSpaceId !== space.id) {
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
        ))}
      </div>
    </div>
  );
};
