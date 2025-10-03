interface CandleData {
  crypto: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  topbottom: 'T' | 'B' | 'E';
  drive: number[];
  harmony: number[];
  root: number[];
  action: number[];
  expand: number[];
  live: number[];
  mm: number;
  im: number;
}

export default CandleData;
