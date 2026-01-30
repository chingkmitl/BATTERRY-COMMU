
export interface SheetRow {
  [key: string]: any;
  _isLocal?: boolean; // ระบุว่าเป็นข้อมูลที่ยังไม่พบใน Cloud
  _lastUpdated?: number; // เวลาที่อัปเดตล่าสุดเพื่อใช้ในการ Merge
}

export interface SheetData {
  name: string;
  rows: SheetRow[];
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  sources: { title: string; uri: string }[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
