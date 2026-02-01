import React, { useRef, useState } from 'react';
import { useIFCStore } from '@/store/ifcStore';
import {
  exportSpacesToCSV,
  exportSpacesToJSON,
  exportSpacesToExcel,
  importSpacesFromCSV,
  importSpacesFromJSON,
  importSpacesFromExcel,
} from '@/utils/exportImport';

export const ExportImportPanel: React.FC = () => {
  const filteredSpaces = useIFCStore((state) => state.filteredSpaces());
  const updateMultipleSpaces = useIFCStore((state) => state.updateMultipleSpaces);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (filteredSpaces.length === 0) {
      alert('エクスポートするスペースがありません');
      return;
    }

    try {
      switch (format) {
        case 'csv':
          exportSpacesToCSV(filteredSpaces);
          break;
        case 'json':
          exportSpacesToJSON(filteredSpaces);
          break;
        case 'excel':
          exportSpacesToExcel(filteredSpaces);
          break;
      }
      setImportStatus({ type: 'success', message: `${format.toUpperCase()}形式でエクスポートしました` });
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus(null);

    try {
      let importedSpaces: any[] = [];

      if (file.name.endsWith('.csv')) {
        importedSpaces = await importSpacesFromCSV(file);
      } else if (file.name.endsWith('.json')) {
        importedSpaces = await importSpacesFromJSON(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importedSpaces = await importSpacesFromExcel(file);
      } else {
        throw new Error('サポートされていないファイル形式です');
      }

      // スペース情報を更新
      const updates = importedSpaces
        .filter(s => s.id && s.properties)
        .map(s => ({
          id: s.id!,
          properties: s.properties!
        }));

      if (updates.length === 0) {
        throw new Error('インポート可能なデータが見つかりませんでした');
      }

      updateMultipleSpaces(updates);

      setImportStatus({
        type: 'success',
        message: `${updates.length}件のスペース情報を更新しました`
      });

      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportStatus({
        type: 'error',
        message: `インポートに失敗しました: ${error.message || '不明なエラー'}`
      });
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        データのエクスポート/インポート
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* エクスポートセクション */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold', opacity: 0.9 }}>
            エクスポート
          </h4>
          <div style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.7 }}>
            現在のフィルタ条件に一致する {filteredSpaces.length} 件のスペースをエクスポート
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExport('csv')}
              className="app-button"
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '8px 12px',
                backgroundColor: '#27ae60',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="app-button"
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '8px 12px',
                backgroundColor: '#2980b9',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              JSON
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="app-button"
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '8px 12px',
                backgroundColor: '#16a085',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Excel
            </button>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* インポートセクション */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold', opacity: 0.9 }}>
            インポート
          </h4>
          <div style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.7 }}>
            CSV、JSON、またはExcelファイルからスペース情報を読み込み
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="app-button"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#8e44ad',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            ファイルを選択
          </label>
        </div>

        {/* ステータスメッセージ */}
        {importStatus && (
          <div
            style={{
              padding: '12px',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: importStatus.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
              border: `1px solid ${importStatus.type === 'success' ? '#2ecc71' : '#e74c3c'}`,
              color: importStatus.type === 'success' ? '#2ecc71' : '#e74c3c',
            }}
          >
            {importStatus.message}
          </div>
        )}

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* 使い方 */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold', opacity: 0.9 }}>
            使い方
          </h4>
          <ul style={{ fontSize: '12px', opacity: 0.7, margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>エクスポートしたファイルを編集して、カスタムパラメーターを追加できます</li>
            <li>CSVの1行目は列名（パラメーター名）として扱われます</li>
            <li>列を追加することで、任意のパラメーターを増やせます</li>
            <li>インポート時は、IDでスペースを照合して情報を更新します</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
