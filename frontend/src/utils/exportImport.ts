import type { Space } from '@/types/ifc.types';
import * as XLSX from 'xlsx';

/**
 * スペースデータをCSVとしてエクスポート
 */
export function exportSpacesToCSV(spaces: Space[]): void {
  if (spaces.length === 0) {
    alert('エクスポートするスペースがありません');
    return;
  }

  // すべてのプロパティキーを収集
  const propertyKeys = collectAllPropertyKeys(spaces);

  // ヘッダー行を作成
  const headers = [
    'id',
    'name',
    'area',
    'volume',
    'height',
    'floorLevel',
    'usage',
    'occupancy',
    ...propertyKeys
  ];

  // データ行を作成
  const rows = spaces.map(space => {
    const row: string[] = [
      space.id,
      space.name,
      space.area?.toString() || '',
      space.volume?.toString() || '',
      space.height?.toString() || '',
      space.floorLevel || '',
      space.usage || '',
      space.occupancy?.toString() || '',
    ];

    // カスタムプロパティを追加
    propertyKeys.forEach(key => {
      const value = space.properties[key];
      row.push(value !== undefined && value !== null ? String(value) : '');
    });

    return row;
  });

  // CSV文字列を作成
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','))
  ].join('\n');

  // BOMを追加してExcelで正しく開けるようにする
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, 'spaces.csv');
}

/**
 * スペースデータをJSONとしてエクスポート
 */
export function exportSpacesToJSON(spaces: Space[]): void {
  if (spaces.length === 0) {
    alert('エクスポートするスペースがありません');
    return;
  }

  // geometryとrelatedEquipmentIdsを除外してエクスポート
  const exportData = spaces.map(space => ({
    id: space.id,
    globalId: space.globalId,
    name: space.name,
    longName: space.longName,
    description: space.description,
    area: space.area,
    volume: space.volume,
    height: space.height,
    floorLevel: space.floorLevel,
    location: space.location,
    usage: space.usage,
    occupancy: space.occupancy,
    properties: space.properties,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, 'spaces.json');
}

/**
 * スペースデータをExcelとしてエクスポート
 */
export function exportSpacesToExcel(spaces: Space[]): void {
  if (spaces.length === 0) {
    alert('エクスポートするスペースがありません');
    return;
  }

  // すべてのプロパティキーを収集
  const propertyKeys = collectAllPropertyKeys(spaces);

  // データ配列を作成
  const data = spaces.map(space => {
    const row: any = {
      'ID': space.id,
      '室名': space.name,
      '面積 (m²)': space.area,
      '容積 (m³)': space.volume,
      '天井高 (m)': space.height,
      '階': space.floorLevel,
      '用途': space.usage,
      '在室人数': space.occupancy,
    };

    // カスタムプロパティを追加
    propertyKeys.forEach(key => {
      row[key] = space.properties[key];
    });

    return row;
  });

  // ワークシートを作成
  const worksheet = XLSX.utils.json_to_sheet(data);

  // ワークブックを作成
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Spaces');

  // Excelファイルをダウンロード
  XLSX.writeFile(workbook, 'spaces.xlsx');
}

/**
 * CSVファイルからスペースデータをインポート
 */
export function importSpacesFromCSV(file: File): Promise<Partial<Space>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error('CSVファイルが空です');
        }

        // ヘッダー行を解析
        const headers = parseCSVLine(lines[0]);

        // データ行を解析
        const spaces: Partial<Space>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          const space: Partial<Space> = {
            properties: {}
          };

          headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            if (!value) return;

            // 基本プロパティ
            switch (header.toLowerCase()) {
              case 'id':
                space.id = value;
                break;
              case 'name':
              case '室名':
                space.name = value;
                break;
              case 'area':
              case '面積':
              case '面積 (m²)':
                space.area = parseFloat(value);
                break;
              case 'volume':
              case '容積':
              case '容積 (m³)':
                space.volume = parseFloat(value);
                break;
              case 'height':
              case '天井高':
              case '天井高 (m)':
                space.height = parseFloat(value);
                break;
              case 'floorlevel':
              case '階':
                space.floorLevel = value;
                break;
              case 'usage':
              case '用途':
                space.usage = value;
                break;
              case 'occupancy':
              case '在室人数':
                space.occupancy = parseInt(value);
                break;
              default:
                // カスタムプロパティ
                space.properties![header] = value;
                break;
            }
          });

          spaces.push(space);
        }

        resolve(spaces);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

/**
 * JSONファイルからスペースデータをインポート
 */
export function importSpacesFromJSON(file: File): Promise<Partial<Space>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          throw new Error('JSONデータは配列である必要があります');
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

/**
 * Excelファイルからスペースデータをインポート
 */
export function importSpacesFromExcel(file: File): Promise<Partial<Space>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // 最初のシートを取得
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // JSONに変換
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        // スペースデータに変換
        const spaces: Partial<Space>[] = jsonData.map((row: any) => {
          const space: Partial<Space> = {
            properties: {}
          };

          Object.keys(row).forEach(key => {
            const value = row[key];
            if (!value) return;

            // 基本プロパティ
            switch (key.toLowerCase()) {
              case 'id':
                space.id = value;
                break;
              case 'name':
              case '室名':
                space.name = value;
                break;
              case 'area':
              case '面積':
              case '面積 (m²)':
                space.area = parseFloat(value);
                break;
              case 'volume':
              case '容積':
              case '容積 (m³)':
                space.volume = parseFloat(value);
                break;
              case 'height':
              case '天井高':
              case '天井高 (m)':
                space.height = parseFloat(value);
                break;
              case 'floorlevel':
              case '階':
                space.floorLevel = value;
                break;
              case 'usage':
              case '用途':
                space.usage = value;
                break;
              case 'occupancy':
              case '在室人数':
                space.occupancy = parseInt(value);
                break;
              default:
                // カスタムプロパティ
                space.properties![key] = value;
                break;
            }
          });

          return space;
        });

        resolve(spaces);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsBinaryString(file);
  });
}

/**
 * すべてのスペースからカスタムプロパティキーを収集
 */
function collectAllPropertyKeys(spaces: Space[]): string[] {
  const keysSet = new Set<string>();

  spaces.forEach(space => {
    Object.keys(space.properties).forEach(key => {
      keysSet.add(key);
    });
  });

  return Array.from(keysSet).sort();
}

/**
 * CSVセルをエスケープ
 */
function escapeCsvCell(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * CSV行をパース
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // スキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * ファイルをダウンロード
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
