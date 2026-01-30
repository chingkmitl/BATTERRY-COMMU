
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { X, ListFilter, Info, Search, CalendarDays, MapPin, Radio, TowerControl, Calendar, LayoutGrid } from 'lucide-react';
import { SheetRow } from '../types';

interface Props {
  data: SheetRow[];
  sheetName?: string;
}

const COLORS = {
  critical: '#ef4444', 
  warning: '#f59e0b',  
  normal: '#10b981',
  radio: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#fb923c', '#06b6d4']
};

const getName = (row: SheetRow, sheetName: string = '') => {
  const keys = Object.keys(row);
  const sheetUpper = (sheetName || '').toUpperCase();
  
  let primaryName = '';
  const priorityKeys = [
    'NAME', 'RENT_TOWER', 'TOWER_NO1', 'AREA_PEA', 'STATION', 'SITE', 'STATION_NAME', 'SITE_NAME', 
    'ชื่อสถานี', 'จุดติดตั้ง', 'สถานที่', 'สถานี', 'ชื่อ', 'UPS', 'PABX'
  ];

  for (const pk of priorityKeys) {
    const foundKey = keys.find(k => k.trim().toUpperCase() === pk.toUpperCase());
    if (foundKey && row[foundKey] && String(row[foundKey]).trim() !== "" && String(row[foundKey]).trim() !== "-") {
      primaryName = String(row[foundKey]).trim();
      break;
    }
  }

  if (!primaryName) {
    const partials = ['ชื่อ', 'NAME', 'SITE', 'STATION', 'จุด', 'ที่ตั้ง', 'AREA'];
    for (const part of partials) {
      const foundKey = keys.find(k => k.trim().toUpperCase().includes(part.toUpperCase()));
      if (foundKey && row[foundKey] && String(row[foundKey]).trim() !== "" && String(row[foundKey]).trim() !== "-") {
        primaryName = String(row[foundKey]).trim();
        break;
      }
    }
  }

  if (!primaryName) primaryName = 'ไม่ระบุชื่อ';

  let suffix = '';
  if (sheetUpper.includes('RADIO')) {
    const areaKey = keys.find(k => k.trim().toUpperCase() === 'AREA_PEA');
    if (areaKey && String(row[areaKey]) !== primaryName) suffix = String(row[areaKey]).trim();
  } else if (sheetUpper.includes('CCTV')) {
    const vrKey = keys.find(k => k.trim().toUpperCase() === 'BUILDING_VR');
    if (vrKey) suffix = String(row[vrKey]).trim();
  }

  if (suffix && suffix !== "" && suffix !== "-") {
    return `${primaryName} (${suffix})`;
  }

  return primaryName;
};

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  items: string[];
  color?: string;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, subtitle, items, color }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 md:p-10 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[24px] bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              <ListFilter className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">{title}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5" /> {subtitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-800">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 custom-scrollbar bg-white">
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm pb-4 mb-2 z-10 border-b border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
              <Search className="w-4 h-4" /> ตรวจพบทั้งหมด {items.length} รายการ
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3 pt-2">
            {items.map((name, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm">
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm ring-4 ring-white" style={{ backgroundColor: color || '#6366f1' }}></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5" /> Maintenance Location</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50/50">
          <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-[24px] hover:bg-black transition-all shadow-xl shadow-slate-200">
            ปิดหน้าต่างข้อมูล (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const names = payload[0].payload.names || [];
    return (
      <div className="bg-white p-5 rounded-[28px] shadow-2xl border border-slate-100 min-w-[260px]">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">กลุ่มข้อมูล: {label}</p>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
          <p className="text-sm font-black text-indigo-600">จำนวนรวม {payload[0].value} ชุด</p>
        </div>
        <div className="space-y-2">
          {names.slice(0, 3).map((name: string, i: number) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
              <p className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">{name}</p>
            </div>
          ))}
          {names.length > 3 && (
            <p className="text-[9px] font-black text-slate-300 italic mt-1">+ อีก {names.length - 3} รายการ...</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const DataVisualizer: React.FC<Props> = ({ data, sheetName }) => {
  const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; subtitle: string; items: string[]; color: string; }>({
    isOpen: false, title: '', subtitle: '', items: [], color: '#6366f1'
  });

  const isRadioSheet = sheetName?.toUpperCase().includes('RADIO');

  const statusDataMap: Record<string, { count: number, names: string[] }> = {
    critical: { count: 0, names: [] },
    warning: { count: 0, names: [] },
    normal: { count: 0, names: [] }
  };
  
  const monthlyProjection: Record<string, { count: number, names: string[] }> = {};

  // กำหนดกลุ่มข้อมูลและลำดับการแสดงผลตามที่ต้องการ
  const radioAssetDist: Record<string, { count: number, names: string[] }> = {
    'Base Station': { count: 0, names: [] },
    'Fixed Radio': { count: 0, names: [] },
    'Mobile Radio': { count: 0, names: [] },
    'Handheld': { count: 0, names: [] },
    'Tower (เสา)': { count: 0, names: [] }
  };

  data.forEach(row => {
    const rowKeys = Object.keys(row);
    const getVal = (target: string) => {
      const found = rowKeys.find(k => k.trim().toUpperCase() === target.toUpperCase());
      return found ? row[found] : null;
    };

    let nextDateStr;
    if (isRadioSheet) {
      nextDateStr = getVal('NEXTB_BAT') || getVal('NEXTF_BAT') || getVal('NEXTH_BAT');
    } else {
      nextDateStr = getVal('NEXT_BAT') || getVal('NEXTB_BAT') || getVal('NEXTF_BAT') || getVal('NEXTH_BAT') || getVal('NEXT_BAT_CCTV') || getVal('NEXT_BAT_PABX');
    }

    const name = getName(row, sheetName);
    
    // อายุการใช้งาน
    if (nextDateStr) {
      const nextDate = new Date(nextDateStr);
      const today = new Date();
      const sixtyDays = new Date(); sixtyDays.setDate(today.getDate() + 60);

      if (!isNaN(nextDate.getTime())) {
        if (nextDate < today) { statusDataMap.critical.count++; statusDataMap.critical.names.push(name); }
        else if (nextDate < sixtyDays) { statusDataMap.warning.count++; statusDataMap.warning.names.push(name); }
        else { statusDataMap.normal.count++; statusDataMap.normal.names.push(name); }

        const monthYear = `${String(nextDate.getMonth() + 1).padStart(2, '0')}/${nextDate.getFullYear() + 543}`;
        if (!monthlyProjection[monthYear]) monthlyProjection[monthYear] = { count: 0, names: [] };
        monthlyProjection[monthYear].count++;
        monthlyProjection[monthYear].names.push(name);
      }
    }

    // ประเภทอุปกรณ์วิทยุ (ดึงข้อมูลแบบ Case-insensitive และรองรับทั้งแบบมี/ไม่มี Underscore)
    if (isRadioSheet) {
      const isValid = (v: any) => {
        if (v === null || v === undefined) return false;
        const s = String(v).trim();
        // Ignore "0", "-", empty, or "nan"
        return s !== "" && s !== "-" && s.toLowerCase() !== "nan" && s !== "0";
      };
      
      const t1 = getVal('TOWER_NO1');
      const t2 = getVal('TOWER_NO2');
      
      // Look for variations in column name
      const bs = getVal('BASE_STATION') || getVal('BASE STATION');
      const fr = getVal('FIXED RADIO') || getVal('FIXED_RADIO');
      const mr = getVal('MOBILE RADIO') || getVal('MOBILE_RADIO');
      const hh = getVal('HANHELD') || getVal('HANDHELD'); 

      const addWithQty = (category: string, val: any, baseName: string) => {
         if (!isValid(val)) return;
         
         let qty = 1;
         const strVal = String(val).trim();
         // Try to parse if it's a number like "2" or "2.0"
         const parsed = parseFloat(strVal);
         // Ensure it's a valid number and > 0.
         if (!isNaN(parsed) && parsed > 0 && /^\d+(\.\d+)?$/.test(strVal)) {
             qty = Math.floor(parsed);
         }
         
         radioAssetDist[category].count += qty;
         for(let i=0; i<qty; i++) {
             // If quantity > 1, append index to distinguish in the list
             radioAssetDist[category].names.push(qty > 1 ? `${baseName} (#${i+1})` : baseName);
         }
      };

      if (isValid(t1)) { radioAssetDist['Tower (เสา)'].count++; radioAssetDist['Tower (เสา)'].names.push(`${name} (T1)`); }
      if (isValid(t2)) { radioAssetDist['Tower (เสา)'].count++; radioAssetDist['Tower (เสา)'].names.push(`${name} (T2)`); }
      
      addWithQty('Base Station', bs, name);
      addWithQty('Fixed Radio', fr, name);
      addWithQty('Mobile Radio', mr, name);
      addWithQty('Handheld', hh, name);
    }
  });

  const pieData = [
    { name: 'เลยกำหนด (วิกฤต)', value: statusDataMap.critical.count, color: COLORS.critical, names: statusDataMap.critical.names },
    { name: 'ใกล้กำหนด (เฝ้าระวัง)', value: statusDataMap.warning.count, color: COLORS.warning, names: statusDataMap.warning.names },
    { name: 'สถานะปกติ', value: statusDataMap.normal.count, color: COLORS.normal, names: statusDataMap.normal.names }
  ].filter(d => d.value > 0);

  const barData = Object.entries(monthlyProjection)
    .map(([date, info]) => ({ date, count: info.count, names: info.names }))
    .sort((a, b) => {
      const [mA, yA] = a.date.split('/').map(Number);
      const [mB, yB] = b.date.split('/').map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    }).slice(0, 12);

  // กำหนดลำดับการเรียงกราฟแท่งตามที่ร้องขอ
  const RADIO_ORDER = ['Base Station', 'Fixed Radio', 'Mobile Radio', 'Handheld', 'Tower (เสา)'];
  
  const radioBarData = Object.entries(radioAssetDist)
    .map(([type, info]) => ({ type, count: info.count, names: info.names }))
    .filter(d => d.count > 0)
    .sort((a, b) => {
        const idxA = RADIO_ORDER.indexOf(a.type);
        const idxB = RADIO_ORDER.indexOf(b.type);
        // รายการที่ไม่อยู่ใน list จะถูกส่งไปท้ายสุด
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  const showRadioChart = isRadioSheet && radioBarData.length > 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* กราฟวงกลม */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">สถานะอายุการใช้งานอุปกรณ์</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">ภาพรวมการเปลี่ยนแบตเตอรี่</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Calendar className="w-5 h-5" /></div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} innerRadius={80} outerRadius={105} paddingAngle={8} dataKey="value" stroke="none"
                  onClick={(entry) => setModalData({ isOpen: true, title: entry.name, subtitle: `รายการอุปกรณ์ในกลุ่มสถานะนี้ (${entry.names.length} ชุด)`, items: entry.names, color: entry.color })}
                  style={{ cursor: 'pointer' }}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟแท่ง */}
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{showRadioChart ? 'สัดส่วนประเภทอุปกรณ์วิทยุ' : 'แผนการเปลี่ยนอุปกรณ์รายเดือน'}</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{showRadioChart ? 'แยกตามโครงสร้างและอุปกรณ์สื่อสาร' : 'ประมาณการงวดงาน 12 เดือนล่วงหน้า'}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">{showRadioChart ? <Radio className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={showRadioChart ? radioBarData : barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey={showRadioChart ? "type" : "date"} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 900 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc', radius: [12, 12, 0, 0]}} content={<CustomBarTooltip />} />
                <Bar 
                  dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={showRadioChart ? 50 : 32} style={{ cursor: 'pointer' }}
                  onClick={(p) => p && setModalData({ isOpen: true, title: showRadioChart ? `ประเภท: ${p.type}` : `แผนงานเดือน ${p.date}`, subtitle: `พบอุปกรณ์ทั้งหมด ${p.names.length} รายการ`, items: p.names, color: '#6366f1' })}
                >
                  {(showRadioChart ? radioBarData : barData).map((entry, index) => (
                    <Cell key={`c-${index}`} fill={showRadioChart ? COLORS.radio[index % COLORS.radio.length] : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {showRadioChart && (
             <div className="mt-4 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">คลิกที่แท่งกราฟเพื่อดูรายชื่ออุปกรณ์รายกลุ่ม</p>
             </div>
          )}
        </div>
      </div>

      <DetailModal 
        isOpen={modalData.isOpen} 
        onClose={() => setModalData(p => ({ ...p, isOpen: false }))} 
        title={modalData.title} subtitle={modalData.subtitle} items={modalData.items} color={modalData.color} 
      />
    </div>
  );
};

export default DataVisualizer;
