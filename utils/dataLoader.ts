import * as XLSX from 'xlsx';
import CandleData from './types';

export const loadData = async (): Promise<CandleData[]> => {
  try {
    const response = await fetch('/data.xlsx');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Loaded rows from Excel:', json.length);
    const data: CandleData[] = json.slice(1).map(row => ({
      crypto: row[1] instanceof Date ? row[1].toString() : (row[1] as string) || '',
      time: (() => {
        if (typeof row[2] === 'number') {
          const date = new Date((row[2] - 25569) * 86400 * 1000);
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        } else if (row[2] instanceof Date) {
          return `${row[2].getMonth() + 1}/${row[2].getDate()}/${row[2].getFullYear()} ${row[2].getHours()}:${row[2].getMinutes()}:${row[2].getSeconds()}`;
        } else {
          return (row[2] as string) || '';
        }
      })(),
      open: parseFloat(row[3] as string) || 0,
      high: parseFloat(row[4] as string) || 0,
      low: parseFloat(row[5] as string) || 0,
      close: parseFloat(row[6] as string) || 0,
      volume: parseFloat(row[7] as string) || 0,
      topbottom: (row[8] as 'T' | 'B' | 'E') || 'E',
      drive: [row[9], row[10], row[11], row[12], row[13]].map(v => parseFloat(v as string) || 0),
      harmony: [row[14], row[15], row[16], row[17], row[18]].map(v => parseFloat(v as string) || 0),
      root: [row[19], row[20], row[21], row[22], row[23]].map(v => parseFloat(v as string) || 0),
      action: [row[24], row[25], row[26], row[27], row[28]].map(v => parseFloat(v as string) || 0),
      expand: [row[29], row[30], row[31], row[32], row[33]].map(v => parseFloat(v as string) || 0),
      live: [row[34], row[35], row[36], row[37], row[38]].map(v => parseFloat(v as string) || 0),
      mm: parseFloat(row[39] as string) || 0,
      im: parseFloat(row[40] as string) || 0,
      rbm: parseFloat(row[41] as string) || 0, // New RBM from column AP
    }));
    console.log('Parsed data sample:', data.slice(0, 3));
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
};