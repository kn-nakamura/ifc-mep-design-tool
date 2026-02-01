import React, { useState } from 'react';
import { useIFCStore } from '@/store/ifcStore';
import { useCalculationStore } from '@/store/calculationStore';
import { calculationService } from '@/services/calculationService';
import { VentilationMethod } from '@/types/calculation.types';

export const CalculationPanel: React.FC = () => {
  const modelId = useIFCStore((state) => state.modelId);
  const spaces = useIFCStore((state) => state.spaces);
  const selectedSpaceIds = useIFCStore((state) => state.selectedSpaceIds);
  
  const {
    ventilationResults,
    isCalculating,
    setCalculating,
    setVentilationResults,
  } = useCalculationStore();

  const [method, setMethod] = useState<VentilationMethod>(VentilationMethod.BUILDING_CODE);

  const handleCalculateAll = async () => {
    if (!modelId) return;

    setCalculating(true);
    try {
      const result = await calculationService.calculateAllSpacesVentilation(
        modelId,
        method
      );
      setVentilationResults(result.results);
    } catch (error) {
      console.error('計算エラー:', error);
      alert('計算に失敗しました');
    } finally {
      setCalculating(false);
    }
  };

  const selectedResult = selectedSpaceIds.length === 1
    ? ventilationResults[selectedSpaceIds[0]]
    : null;
  const hasResults = Object.keys(ventilationResults).length > 0;

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        換気計算
      </h3>

      {/* 計算方法選択 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
          計算方法
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as VentilationMethod)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2c3e50',
            color: 'white',
            border: '1px solid #34495e',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          disabled={isCalculating}
        >
          <option value={VentilationMethod.BUILDING_CODE}>建築基準法</option>
          <option value={VentilationMethod.AREA_BASED}>床面積ベース</option>
          <option value={VentilationMethod.OCCUPANCY_BASED}>在室人数ベース</option>
        </select>
      </div>

      {/* 計算実行ボタン */}
      <button
        onClick={handleCalculateAll}
        disabled={isCalculating || spaces.length === 0}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isCalculating ? '#95a5a6' : '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCalculating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {isCalculating ? '計算中...' : `全スペースを計算 (${spaces.length}件)`}
      </button>

      {/* 計算結果表示 */}
      {hasResults && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>
            計算結果
          </h4>
          
          {selectedResult ? (
            /* 選択されたスペースの詳細結果 */
            <div
              style={{
                padding: '16px',
                backgroundColor: '#2c3e50',
                borderRadius: '6px',
                border: '2px solid #3498db',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                {selectedResult.spaceName}
              </div>
              
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ResultItem
                  label="必要換気量"
                  value={`${selectedResult.requiredVentilation.toFixed(1)} m³/h`}
                />
                <ResultItem
                  label="換気回数"
                  value={`${selectedResult.airChangeRate.toFixed(2)} 回/h`}
                />
                <ResultItem
                  label="計算方法"
                  value={selectedResult.appliedStandard || ''}
                />
                <ResultItem
                  label="適合状況"
                  value={selectedResult.complianceStatus}
                  status={selectedResult.complianceStatus}
                />
                {selectedResult.complianceNotes && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#34495e',
                      borderRadius: '4px',
                      fontSize: '11px',
                      opacity: 0.8,
                    }}
                  >
                    {selectedResult.complianceNotes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* サマリー表示 */
            <div
              style={{
                padding: '16px',
                backgroundColor: '#2c3e50',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px' }}>
                {Object.keys(ventilationResults).length} スペースを計算済み
              </div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                スペースを選択すると詳細が表示されます
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 結果アイテムコンポーネント
const ResultItem: React.FC<{
  label: string;
  value: string;
  status?: string;
}> = ({ label, value, status }) => (
  <div>
    <div style={{ opacity: 0.7, marginBottom: '2px' }}>
      {label}
    </div>
    <div
      style={{
        fontWeight: 'bold',
        color: status === 'OK' ? '#2ecc71' : status === 'NG' ? '#e74c3c' : status === 'WARNING' ? '#f39c12' : 'white',
      }}
    >
      {value}
    </div>
  </div>
);
