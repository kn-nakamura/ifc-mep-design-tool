import React from 'react';
import { useIFCStore } from '@/store/ifcStore';
import type { Space } from '@/types/ifc.types';

export const GroupingPanel: React.FC = () => {
  const grouping = useIFCStore((state) => state.grouping);
  const setGrouping = useIFCStore((state) => state.setGrouping);
  const groupedSpaces = useIFCStore((state) => state.groupedSpaces());
  const availablePropertyKeys = useIFCStore((state) => state.availablePropertyKeys());
  const setColorByProperty = useIFCStore((state) => state.setColorByProperty);
  const colorByProperty = useIFCStore((state) => state.colorByProperty);

  const handleGroupingToggle = (enabled: boolean) => {
    setGrouping({ enabled });
    if (!enabled) {
      setColorByProperty(null);
    }
  };

  const handlePropertyKeyChange = (propertyKey: string) => {
    setGrouping({ propertyKey: propertyKey || null });
  };

  const handleColorByPropertyChange = (propertyKey: string) => {
    setColorByProperty(propertyKey || null);
  };

  const calculateGroupStats = (spaces: Space[]) => {
    const totalArea = spaces.reduce((sum, s) => sum + (s.area || 0), 0);
    const totalVolume = spaces.reduce((sum, s) => sum + (s.volume || 0), 0);
    const avgHeight = spaces.length > 0
      ? spaces.reduce((sum, s) => sum + (s.height || 0), 0) / spaces.length
      : 0;

    return { totalArea, totalVolume, avgHeight };
  };

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        グルーピング・集計
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* グルーピング設定 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={grouping.enabled}
              onChange={(e) => handleGroupingToggle(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px' }}>グルーピングを有効化</span>
          </label>
        </div>

        {grouping.enabled && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.7 }}>
                グループ化するパラメーター
              </label>
              <select
                value={grouping.propertyKey || ''}
                onChange={(e) => handlePropertyKeyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  fontSize: '13px',
                }}
              >
                <option value="">パラメーターを選択</option>
                {availablePropertyKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.7 }}>
                色分けするパラメーター
              </label>
              <select
                value={colorByProperty || ''}
                onChange={(e) => handleColorByPropertyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  fontSize: '13px',
                }}
              >
                <option value="">なし（デフォルト色）</option>
                {availablePropertyKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

            {/* グループごとの集計 */}
            {grouping.propertyKey && (
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
                  グループ別集計
                </h4>
                <div
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {Object.entries(groupedSpaces).map(([groupName, spaces]) => {
                    const stats = calculateGroupStats(spaces);
                    return (
                      <div
                        key={groupName}
                        style={{
                          padding: '12px',
                          backgroundColor: 'rgba(52, 152, 219, 0.2)',
                          borderRadius: '6px',
                          border: '1px solid rgba(52, 152, 219, 0.3)',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                          {groupName}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>スペース数: {spaces.length}</div>
                          <div>合計床面積: {stats.totalArea.toFixed(2)} m²</div>
                          {stats.totalVolume > 0 && (
                            <div>合計容積: {stats.totalVolume.toFixed(2)} m³</div>
                          )}
                          {stats.avgHeight > 0 && (
                            <div>平均天井高: {stats.avgHeight.toFixed(2)} m</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!grouping.enabled && (
          <div style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', padding: '20px' }}>
            グルーピングを有効化してパラメーターを選択すると、<br />
            グループごとに集計情報を表示できます
          </div>
        )}
      </div>
    </div>
  );
};
