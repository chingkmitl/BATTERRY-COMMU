
import * as XLSX from 'xlsx';
import { SheetData, SheetRow } from '../types';

// เปลี่ยนจาก ID เดิมเป็น ID ใหม่ของ H_ET
const SHEET_ID = '1hCUyIFIHJP5LqlX10eWrjROIzZuLkbfTBKXBDBCiBlk';
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

// ✅ สำคัญ: ตรวจสอบ URL ของ Google Apps Script ให้ถูกต้อง (ต้องลงท้ายด้วย /exec)
const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/s/AKfycb3xG9qzgSmzm2mk_6qnsjksSW_MH3xd_8HaA8ph8t2yHbUQhPtrHLDbHLxTCfD4oc0Tw/exec';

export const fetchAllSheetsData = async (): Promise<SheetData[]> => {
  try {
    const guid = Math.random().toString(36).substring(2, 15);
    const forceRefresh = `refresh_id=${guid}&t=${Date.now()}`;
    
    const response = await fetch(`${XLSX_URL}&${forceRefresh}`, { 
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    return workbook.SheetNames.map(name => {
      const worksheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as SheetRow[];
      return {
        name,
        rows: rows.filter(row => Object.values(row).some(v => String(v).trim() !== ""))
      };
    });
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    throw error;
  }
};

export const updateGoogleSheet = async (
  action: 'add' | 'delete', 
  sheetName: string, 
  data: SheetRow
): Promise<boolean> => {
  if (!GAS_DEPLOYMENT_URL) return false;

  try {
    const findId = (obj: any) => {
      const keys = Object.keys(obj);
      const priorityKey = keys.find(k => k.toUpperCase() === 'NAME' || k.toUpperCase() === 'ID');
      return priorityKey ? String(obj[priorityKey]).trim() : String(obj[keys[0]]).trim();
    };

    const rowId = findId(data);
    const actionMap = { 'add': 'INSERT', 'delete': 'DELETE' };

    const payload = {
      action: actionMap[action],
      sheetName: sheetName.trim(),
      id: rowId,
      data: data,
      timestamp: new Date().toISOString()
    };

    console.log(`📡 [${action.toUpperCase()}] Request:`, payload);

    await fetch(GAS_DEPLOYMENT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    console.error('❌ Sync Error:', error);
    return false;
  }
};
