import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Loader2, Globe, AlertCircle } from 'lucide-react';
import { SheetRow } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: SheetRow) => void;
  headers: string[];
  allRows: SheetRow[];
}

const SIZE_OPTIONS = ['', 'L', 'M', 'S', 'XS'];
const SUB_PEA_OPTIONS = ['', 'สฟฟ.', 'กฟฟ.', 'เขตชลบุรี', 'ลูกกฟฟ.'];
const PROVINCE_OPTIONS = ['', 'ฉะเชิงเทรา', 'ชลบุรี', 'ระยอง', 'จันทร์', 'ตราด'];

const RowEditorModal: React.FC<Props> = ({ isOpen, onClose, onSave, headers, allRows }) => {
  const [formData, setFormData] = useState<SheetRow>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const emptyRow: SheetRow = {};
      headers.forEach(h => {
        const key = h.toUpperCase();
        if (key === 'NO') {
          const maxNo = Math.max(0, ...allRows.map(r => {
            const val = parseInt(r[h]);
            return isNaN(val) ? 0 : val;
          }));
          emptyRow[h] = (maxNo + 1).toString();
        } else {
          emptyRow[h] = '';
        }
      });
      setFormData(emptyRow);
      setError(null);
    }
  }, [headers, isOpen, allRows]);

  if (!isOpen) return null;

  const handleChange = (header: string, value: string) => {
    setFormData(prev => ({ ...prev, [header]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameKey = headers.find(h => h.toUpperCase() === 'NAME') || 'NAME';
    if (!formData[nameKey] || formData[nameKey].trim() === "") {
      setError("กรุณาระบุ 'NAME' เพื่อใช้เป็นชื่ออ้างอิงหลัก");
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLongKey = headers.find(h => h.toLowerCase() === 'latlong') || 'LatLong';
        handleChange(latLongKey, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIsGettingLocation(false);
      },
      () => {
        alert("ไม่สามารถดึงตำแหน่งได้");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const openGoogleMaps = () => {
    const latLongKey = headers.find(h => h.toLowerCase() === 'latlong') || 'LatLong';
    const currentVal = formData[latLongKey] || '';
    const query = currentVal ? encodeURIComponent(currentVal) : 'Thailand';
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const renderInput = (header: string) => {
    const key = header.toUpperCase();
    const value = formData[header] || '';

    if (key === 'NAME') {
      return (
        <input 
          type="text" 
          value={value} 
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full px-4 py-3 border rounded-2xl outline-none font-bold text-sm bg-indigo-50 border-indigo-200 text-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          placeholder="ระบุชื่อเรียก..."
        />
      );
    }

    if (key === 'NO') {
      return (
        <input 
          type="text" 
          value={value} 
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
        />
      );
    }

    if (key === 'PROVINCE') {
      return (
        <select value={value} onChange={(e) => handleChange(header, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
          {PROVINCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'เลือกจังหวัด...'}</option>)}
        </select>
      );
    }

    if (key === 'SUB_PEA') {
      return (
        <select value={value} onChange={(e) => handleChange(header, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
          {SUB_PEA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'เลือกหน่วยงาน...'}</option>)}
        </select>
      );
    }

    if (key === 'SIZE') {
      return (
        <select value={value} onChange={(e) => handleChange(header, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
          {SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'เลือกขนาด...'}</option>)}
        </select>
      );
    }

    if (key === 'LATLONG') {
      return (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(header, e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
          />
          <button type="button" onClick={handleGetCurrentLocation} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100">
            {isGettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          </button>
          <button type="button" onClick={openGoogleMaps} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100">
            <Globe className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(header, e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">เพิ่มข้อมูลใหม่</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">เพิ่มรายการใหม่ลงในฐานข้อมูล</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {error && (
          <div className="px-8 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {headers.map(header => (
            <div key={header} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{header}</label>
              {renderInput(header)}
            </div>
          ))}
        </form>

        <div className="p-8 border-t bg-slate-50/50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl">ยกเลิก</button>
          <button onClick={handleSubmit} className="flex-[2] px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
            <Save className="w-5 h-5" /> ยืนยันข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
};

export default RowEditorModal;