import React, { useState } from 'react';
import { useIFCStore } from '@/store/ifcStore';

export const FilterPanel: React.FC = () => {
  const availableFloorLevels = useIFCStore((state) => state.availableFloorLevels());
  const availablePropertyKeys = useIFCStore((state) => state.availablePropertyKeys());
  const availablePropertyValues = useIFCStore((state) => state.availablePropertyValues);
  const filters = useIFCStore((state) => state.filters);
  const setFilters = useIFCStore((state) => state.setFilters);
  const resetFilters = useIFCStore((state) => state.resetFilters);

  const [minArea, setMinArea] = useState<string>(filters.minArea?.toString() || '');
  const [maxArea, setMaxArea] = useState<string>(filters.maxArea?.toString() || '');
  const [minVolume, setMinVolume] = useState<string>(filters.minVolume?.toString() || '');
  const [maxVolume, setMaxVolume] = useState<string>(filters.maxVolume?.toString() || '');
  const [minHeight, setMinHeight] = useState<string>(filters.minHeight?.toString() || '');
  const [maxHeight, setMaxHeight] = useState<string>(filters.maxHeight?.toString() || '');
  const [selectedCustomProperty, setSelectedCustomProperty] = useState<string>('');

  const handleFloorLevelToggle = (level: string) => {
    const newLevels = filters.floorLevels.includes(level)
      ? filters.floorLevels.filter(l => l !== level)
      : [...filters.floorLevels, level];
    setFilters({ floorLevels: newLevels });
  };

  const handleApplyFilters = () => {
    setFilters({
      minArea: minArea ? parseFloat(minArea) : null,
      maxArea: maxArea ? parseFloat(maxArea) : null,
      minVolume: minVolume ? parseFloat(minVolume) : null,
      maxVolume: maxVolume ? parseFloat(maxVolume) : null,
      minHeight: minHeight ? parseFloat(minHeight) : null,
      maxHeight: maxHeight ? parseFloat(maxHeight) : null,
    });
  };

  const handleReset = () => {
    resetFilters();
    setMinArea('');
    setMaxArea('');
    setMinVolume('');
    setMaxVolume('');
    setMinHeight('');
    setMaxHeight('');
    setSelectedCustomProperty('');
  };

  const handleCustomFilterChange = (propertyKey: string, value: string) => {
    const newCustomFilters = { ...filters.customFilters };
    if (value) {
      newCustomFilters[propertyKey] = value;
    } else {
      delete newCustomFilters[propertyKey];
    }
    setFilters({ customFilters: newCustomFilters });
  };

  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
        フィルター
      </h3>

      {/* 階フィルター */}
      {availableFloorLevels.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>
            階
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {availableFloorLevels.map((level) => (
              <label
                key={level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '6px',
                  backgroundColor: filters.floorLevels.includes(level) ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.floorLevels.includes(level)}
                  onChange={() => handleFloorLevelToggle(level)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px' }}>{level}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 面積フィルター */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>
          面積 (m²)
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="最小"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
          <span style={{ fontSize: '13px' }}>-</span>
          <input
            type="number"
            placeholder="最大"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* 容積フィルター */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>
          容積 (m³)
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="最小"
            value={minVolume}
            onChange={(e) => setMinVolume(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
          <span style={{ fontSize: '13px' }}>-</span>
          <input
            type="number"
            placeholder="最大"
            value={maxVolume}
            onChange={(e) => setMaxVolume(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* 天井高フィルター */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>
          天井高 (m)
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="最小"
            value={minHeight}
            onChange={(e) => setMinHeight(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
          <span style={{ fontSize: '13px' }}>-</span>
          <input
            type="number"
            placeholder="最大"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* カスタムパラメーターフィルター */}
      {availablePropertyKeys.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>
            カスタムパラメーター
          </div>
          <select
            value={selectedCustomProperty}
            onChange={(e) => setSelectedCustomProperty(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2c3e50',
              border: '1px solid #3498db',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          >
            <option value="">パラメーターを選択</option>
            {availablePropertyKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          {selectedCustomProperty && (
            <select
              value={filters.customFilters[selectedCustomProperty] || ''}
              onChange={(e) => handleCustomFilterChange(selectedCustomProperty, e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2c3e50',
                border: '1px solid #3498db',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
              }}
            >
              <option value="">すべて</option>
              {availablePropertyValues(selectedCustomProperty).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
          {Object.keys(filters.customFilters).length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div style={{ marginBottom: '4px', opacity: 0.7 }}>適用中のフィルター:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(filters.customFilters).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: '6px',
                      backgroundColor: 'rgba(52, 152, 219, 0.2)',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {key}: {value}
                    </span>
                    <button
                      onClick={() => handleCustomFilterChange(key, '')}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0 4px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ボタン */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleApplyFilters}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          適用
        </button>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          リセット
        </button>
      </div>
    </div>
  );
};
