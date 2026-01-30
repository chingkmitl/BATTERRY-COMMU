
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchAllSheetsData } from './services/sheetService';
import { analyzeWithGemini } from './services/geminiService';
import { SheetData, SheetRow, AnalysisResult } from './types';
import DataVisualizer from './components/DataVisualizer';
import ChatBot from './components/ChatBot';
import { 
  BrainCircuit, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  Zap,
  Clock,
  Calendar,
  MessageCircle,
  LayoutGrid,
  ShieldCheck,
  SearchX,
  Radio,
  TowerControl,
  DollarSign,
  Search,
  X
} from 'lucide-react';

const BACKUP_KEY = 'strategic_analyst_full_backup';
const TARGET_ORDER = ['CCTV', 'PABX', 'DIGITAL RADIO'];

export const formatToThaiDate = (dateStr: any) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear() + 543;
  return `${d}/${m}/${y}`;
};

// Helper function to parse currency strings with commas
const parseCurrency = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  // Remove commas and spaces
  const cleanStr = String(val).replace(/,/g, '').replace(/\s/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

const App: React.FC = () => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent && !initialLoaded) setLoading(true);
      setError(null);

      let rawCloudData: SheetData[] = [];
      try {
        rawCloudData = await fetchAllSheetsData();
        if (rawCloudData.length > 0) localStorage.setItem(BACKUP_KEY, JSON.stringify(rawCloudData));
      } catch (cloudErr) {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) rawCloudData = JSON.parse(backup);
      }
      
      const filteredAndSorted = rawCloudData
        .filter(s => TARGET_ORDER.some(target => target.toLowerCase() === s.name.trim().toLowerCase()))
        .sort((a, b) => {
          const indexA = TARGET_ORDER.findIndex(target => target.toLowerCase() === a.name.trim().toLowerCase());
          const indexB = TARGET_ORDER.findIndex(target => target.toLowerCase() === b.name.trim().toLowerCase());
          return indexA - indexB;
        });

      setSheets(filteredAndSorted);
      setInitialLoaded(true);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [initialLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.scrollWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    if (tableRef.current) observer.observe(tableRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, [sheets, activeSheetIndex]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeSheetIndex]);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (tableContainerRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  const activeSheet = sheets[activeSheetIndex];
  const isCodeSheet = activeSheet?.name.toLowerCase().trim() === 'code';
  const showVisuals = activeSheet && activeSheet.name.toLowerCase().trim() !== 'code';
  const isRadioSheet = activeSheet?.name.toUpperCase().includes('RADIO');

  const criticalCount = useMemo(() => {
    if (!activeSheet) return 0;
    const today = new Date();
    const isRadio = activeSheet.name.toUpperCase().includes('RADIO');

    return activeSheet.rows.filter(r => {
      const dateStr = isRadio
        ? (r.NEXTB_BAT || r.NEXTF_BAT || r.NEXTH_BAT)
        : (r.NEXT_BAT || r.NEXTB_BAT || r.NEXTF_BAT || r.NEXTH_BAT || r.NEXT_BAT_CCTV || r.NEXT_BAT_PABX);
      return dateStr && new Date(dateStr) < today;
    }).length;
  }, [activeSheet]);

  const filteredRows = useMemo(() => {
    if (!activeSheet) return [];
    if (!searchQuery.trim()) return activeSheet.rows;
    
    const query = searchQuery.toLowerCase().trim();
    return activeSheet.rows.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      )
    );
  }, [activeSheet, searchQuery]);

  const headers = useMemo(() => {
    if (!activeSheet || activeSheet.rows.length === 0) return [];
    // ใช้ Object.keys จากแถวแรกเพื่อให้ลำดับตรงกับ Google Sheets (เพราะ sheet_to_json จะรักษาลำดับคอลัมน์ไว้)
    const firstRowKeys = Object.keys(activeSheet.rows[0]);
    
    // กรองเฉพาะ key ที่ไม่ใช่ค่าว่างและไม่ใช่ internal key (ขึ้นต้นด้วย _)
    // กรอง NO, NO., No. ออกเพื่อไม่ให้ซ้ำกับคอลัมน์ลำดับที่สร้างขึ้นเอง (No.) ทางซ้ายสุด
    return firstRowKeys.filter(key => {
      const k = key.trim().toUpperCase();
      return k !== "" && !key.startsWith('_') && k !== 'NO' && k !== 'NO.';
    });
  }, [activeSheet]);

  const runAnalysis = async () => {
    if (!sheets.length) return;
    try { setAnalyzing(true); setAnalysis(await analyzeWithGemini(sheets)); }
    catch (e) { setError('AI ขัดข้อง'); }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b sticky top-0 z-[60] shadow-sm">
        <div className="w-full px-6 h-16 flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">H_ET Strategic Asset Hub</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-2.5 h-2.5" /> Intelligence Active
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadData()} disabled={loading} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-6 w-px bg-slate-100 mx-2"></div>
            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Digital Infrastructure Expert
            </div>
          </div>
        </div>
        {!loading && sheets.length > 0 && (
          <div className="border-t bg-white overflow-hidden">
            <div className="w-full px-6 flex overflow-x-auto hide-scrollbar max-w-[1920px] mx-auto">
              {sheets.map((sheet, index) => (
                <button
                  key={sheet.name}
                  onClick={() => setActiveSheetIndex(index)}
                  className={`flex items-center gap-3 px-10 py-4 text-xs font-black border-b-4 whitespace-nowrap transition-all uppercase tracking-widest ${
                    activeSheetIndex === index 
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {sheet.name.toUpperCase().includes('RADIO') ? <Radio className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                  {sheet.name}
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] ${
                    activeSheetIndex === index ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{sheet.rows.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full p-6 space-y-6 max-w-[1920px] mx-auto pb-24">
        {!loading && activeSheet && !isCodeSheet && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-2xl text-red-600"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลยกำหนดเปลี่ยนแบตฯ</p>
                <p className="text-xl font-black text-slate-800">{criticalCount} <span className="text-sm text-slate-400 font-bold">จุด</span></p>
              </div>
            </div>
            
            {isRadioSheet && (
              <>
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><DollarSign className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ค่าเช่ารายปีรวม (RENT)</p>
                    <p className="text-xl font-black text-emerald-600">
                      {activeSheet.rows.reduce((sum, r) => {
                        // Find key that matches RENT_YEAR case-insensitively
                        const key = Object.keys(r).find(k => k.trim().toUpperCase() === 'RENT_YEAR');
                        const val = key ? r[key] : 0;
                        return sum + parseCurrency(val);
                      }, 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">฿</span>
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-600"><Radio className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนรายการทั้งหมด</p>
                <p className="text-xl font-black text-slate-800">{activeSheet.rows.length} <span className="text-sm text-slate-400 font-bold">รายการ</span></p>
              </div>
            </div>
          </div>
        )}

        {loading && !sheets.length ? (
          <div className="flex flex-col items-center justify-center py-48">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Initializing Strategic Data...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {activeSheet && activeSheet.rows.length > 0 && showVisuals && (
              <DataVisualizer data={activeSheet.rows} sheetName={activeSheet.name} />
            )}

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full min-h-[500px]">
              <div className="px-10 py-8 border-b bg-slate-50/30 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2.5 rounded-xl text-white"><LayoutGrid className="w-5 h-5" /></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">ฐานข้อมูล {activeSheet?.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest italic">แสดงผลแยกตามหัวข้อโครงสร้างพื้นฐานและอุปกรณ์วิทยุ</p>
                    </div>
                  </div>
                  <button 
                    onClick={runAnalysis} 
                    disabled={analyzing || !activeSheet} 
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-3xl text-xs font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    AI STRATEGIC INSIGHT
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
                    placeholder={`ค้นหาข้อมูลใน ${activeSheet?.name || 'ตาราง'} (ชื่อ, สถานที่, หมายเลข)...`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {!isCodeSheet && activeSheet && activeSheet.rows.length > 0 && (
                <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto overflow-y-hidden h-3 bg-slate-50 border-b custom-scrollbar">
                  <div style={{ width: tableWidth, height: '1px' }}></div>
                </div>
              )}

              <div ref={tableContainerRef} onScroll={handleTableScroll} className="flex-1 overflow-auto custom-scrollbar">
                {!activeSheet || activeSheet.rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-40">
                    <SearchX className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ไม่พบข้อมูลในชุดนี้</p>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-40">
                    <Search className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ไม่พบข้อมูลที่ตรงกับคำค้นหา "{searchQuery}"</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      ล้างคำค้นหา
                    </button>
                  </div>
                ) : (
                  <table ref={tableRef} className="w-full text-left border-collapse table-auto min-w-full">
                    <thead className="sticky top-0 z-30 bg-white shadow-sm border-b">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-white z-40 border-r w-20 text-center">No.</th>
                        {headers.map(header => (
                          <th key={header} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[160px]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((row, idx) => {
                        const isRadio = activeSheet.name.toUpperCase().includes('RADIO');
                        // Use specific columns for Radio as requested
                        const dateVal = isRadio 
                          ? (row.NEXTB_BAT || row.NEXTF_BAT || row.NEXTH_BAT)
                          : (row.NEXT_BAT || row.NEXTB_BAT || row.NEXTF_BAT || row.NEXTH_BAT || row.NEXT_BAT_CCTV || row.NEXT_BAT_PABX);
                        const isOverdue = dateVal && new Date(dateVal) < new Date();
                        
                        return (
                          <tr key={idx} className={`hover:bg-indigo-50/30 transition-all group ${isOverdue ? 'bg-red-50/30' : ''}`}>
                            <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-20 border-r transition-all text-[11px] font-black text-slate-400 text-center">{idx + 1}</td>
                            {headers.map((header, vIdx) => {
                              const val = row[header];
                              const upperHeader = header.toUpperCase();
                              
                              // กำหนดคอลัมน์ที่เป็นจำนวนแบตเตอรี่ (ไม่ใช่ Date)
                              const isBatQty = ['N_BAT', 'NB_BAT', 'NF_BAT', 'NH_BAT'].includes(upperHeader);
                              
                              const isDateCol = !isBatQty && (upperHeader.includes('BAT') || upperHeader.includes('DATE'));
                              const isMoneyCol = upperHeader.includes('RENT_YEAR');
                              
                              let formattedVal = val;
                              if (isDateCol) {
                                formattedVal = formatToThaiDate(val);
                              } else if (isMoneyCol) {
                                // Apply safe currency parsing
                                const num = parseCurrency(val);
                                // If original value was meaningful (not null/undefined/empty), display formatted number
                                if (val !== null && val !== undefined && String(val).trim() !== '') {
                                    formattedVal = num.toLocaleString();
                                } else {
                                    formattedVal = '-';
                                }
                              }

                              return (
                                <td key={vIdx} className={`px-8 py-5 text-sm whitespace-nowrap font-bold ${isDateCol && isOverdue ? 'text-red-700' : 'text-slate-600'} ${isMoneyCol ? 'text-emerald-700' : ''}`}>
                                  {formattedVal || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {analysis && (
              <div className="bg-white p-12 rounded-[50px] border border-indigo-100 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6 mb-12">
                  <div className="bg-indigo-600 p-5 rounded-[28px] text-white shadow-xl shadow-indigo-200">
                    <BrainCircuit className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900">AI Strategic Roadmap</h3>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Management Optimization Engine</p>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-10 rounded-[40px] mb-12 border border-indigo-100/50 backdrop-blur-sm">
                  <div className="flex gap-4 items-start">
                    <Zap className="w-8 h-8 text-indigo-600 shrink-0 mt-1" />
                    <p className="italic font-black text-indigo-900 text-2xl leading-relaxed">"{analysis.summary}"</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-3"><span className="w-8 h-1 bg-indigo-600 rounded-full"></span>ASSET & REVENUE INSIGHTS</h4>
                    <div className="space-y-4">
                      {analysis.insights.map((insight, i) => (
                        <div key={i} className="text-sm text-slate-600 flex items-start gap-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xs font-black">{i+1}</span>
                          <span className="leading-relaxed">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3"><span className="w-8 h-1 bg-emerald-600 rounded-full"></span>MANAGEMENT ACTIONS</h4>
                    <div className="space-y-4">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="text-sm text-slate-600 flex items-start gap-5 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                          <span className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xs font-black">{i+1}</span>
                          <span className="leading-relaxed font-semibold">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group">
        <MessageCircle className="w-8 h-8" />
        <span className="absolute right-20 bg-slate-900 text-white text-[10px] font-black py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap shadow-xl">Expert Support Chat</span>
      </button>

      {isChatOpen && <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} allData={sheets} />}
    </div>
  );
};

export default App;
