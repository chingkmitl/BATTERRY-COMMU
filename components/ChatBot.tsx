
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { SheetData } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allData: SheetData[];
}

const ChatBot: React.FC<Props> = ({ isOpen, onClose, allData }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'สวัสดีครับ ผมคือ AI ผู้เชี่ยวชาญด้านแผนเปลี่ยนแบตเตอรี่ มีอะไรให้ช่วยวิเคราะห์หรือต้องการดูตารางสรุปอุปกรณ์ไหมครับ?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Filter out 'code' sheet
      const analysisData = allData.filter(s => s.name.toLowerCase() !== 'code');
      
      // Send ALL rows to the model to ensure accurate counting. 
      // Gemini Flash models have large context windows (1M+ tokens), so this is generally safe for typical sheet sizes.
      const context = analysisData.map(s => `Sheet ${s.name} (${s.rows.length} records): ${JSON.stringify(s.rows)}`).join('\n\n');
      
      // Prepare history (last 10 messages)
      const history = messages.slice(-10).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: {
          systemInstruction: `
            คุณคือ "Expert Maintenance Chatbot" ที่เชี่ยวชาญการจัดการแบตเตอรี่ (CCTV, PABX, Radio)
            ข้อมูลที่คุณมี: ${context}
            
            กติกาการตอบคำถาม:
            1. หากผู้ใช้ถามถึงอุปกรณ์, รายการ, สถานี, หรือขอสรุปข้อมูล "ต้องตอบเป็นตาราง Markdown เสมอ"
            2. รูปแบบตารางที่บังคับ:
               | ลำดับ | รายชื่ออุปกรณ์/จุดติดตั้ง | สถานะ/วันที่ครบกำหนด (พ.ศ.) | หมายเหตุ |
            3. วันที่ต้องแปลงเป็นรูปแบบ พ.ศ. (วว/ดด/25xx)
            4. หากข้อมูลมีจำนวนมาก ให้คัดเลือกรายการที่สำคัญหรือวิกฤตมาแสดงในตารางก่อน แล้วสรุปยอดรวมตอนท้าย
            5. ใช้ภาษาไทยที่สุภาพ เป็นทางการ และเข้าใจง่าย
            6. หากถามเรื่องงบประมาณ ให้คำนวณตามราคา: CCTV=800, PABX/Radio=10,000 ต่อก้อน
            7. พิจารณาบทสนทนาก่อนหน้า (History) เพื่อให้การตอบคำถามต่อเนื่องและแม่นยำ
            8. เวลาตรวจสอบจำนวนอุปกรณ์ (เช่น Base Station, Tower) ให้ตรวจสอบทุกแถวในข้อมูลที่ได้รับอย่างละเอียด ห้ามประมาณการโดยเด็ดขาด
            9. หากในข้อมูลมีจำนวนระบุไว้ในช่อง (เช่น "2" หรือ "2 ชุด") ให้นับรวมตามจำนวนนั้น
            10. **กฎการตรวจสอบวันเปลี่ยนแบตเตอรี่ (Strict Rules):**
                - **กรณี CCTV**: ให้ใช้วันที่จากคอลัมน์ **'NEXT_BAT'** เท่านั้น
                - **กรณี PABX**: ให้ใช้วันที่จากคอลัมน์ **'NEXT_BAT'** เท่านั้น
                - **กรณี Digital Radio**:
                  - ถ้าเป็น Base Station / Repeater ให้ดูคอลัมน์ **'NEXTB_BAT'**
                  - ถ้าเป็น Fixed Radio ให้ดูคอลัมน์ **'NEXTF_BAT'**
                  - ถ้าเป็น Handheld หรือ Mobile Radio ให้ดูคอลัมน์ **'NEXTH_BAT'**
                  - *ห้ามใช้คอลัมน์ NEXT_BAT สำหรับ Digital Radio เด็ดขาด*
            
            ตัวอย่างการตอบ:
            "นี่คือรายการอุปกรณ์ที่ต้องตรวจสอบครับ:
            | ลำดับ | รายชื่ออุปกรณ์/จุดติดตั้ง | ครบกำหนด (พ.ศ.) | สถานะ |
            |---|---|---|---|
            | 1 | CCTV - อาคาร A | 12/05/2567 | วิกฤต |
            ..."
          `
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'ขออภัยครับ ไม่พบข้อมูลที่เกี่ยวข้อง' }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderFormattedText = (text: string) => {
    // Check if text contains a potential markdown table
    if (!text.includes('|')) return <p className="whitespace-pre-wrap">{text}</p>;

    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    let currentTableLines: string[] = [];
    let isTable = false;

    lines.forEach((line, idx) => {
      const isSeparator = line.trim().match(/^\|?[\s-:]+\|[\s-:]+\|/);
      const hasPipe = line.trim().includes('|');

      if (hasPipe) {
        isTable = true;
        currentTableLines.push(line);
      } else {
        if (isTable && currentTableLines.length > 0) {
          parts.push(renderTable(currentTableLines));
          currentTableLines = [];
          isTable = false;
        }
        if (line.trim()) {
          parts.push(<p key={idx} className="mb-2">{line}</p>);
        }
      }
    });

    if (isTable && currentTableLines.length > 0) {
      parts.push(renderTable(currentTableLines));
    }

    return <div className="space-y-1">{parts}</div>;
  };

  const renderTable = (lines: string[]) => {
    // Simple markdown table parser
    const filteredLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
    if (filteredLines.length < 2) return <p className="whitespace-pre-wrap">{lines.join('\n')}</p>;

    const headerLine = filteredLines[0];
    const dataLines = filteredLines.slice(2); // Skip header and separator line

    const headers = headerLine.split('|').map(s => s.trim()).filter(s => s !== '');
    const rows = dataLines.map(line => line.split('|').map(s => s.trim()).filter(s => s !== ''));

    return (
      <div key={Math.random()} className="my-4 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-[12px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-black text-slate-700 uppercase tracking-tight whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-slate-600 font-bold whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-28 right-8 w-[550px] h-[750px] max-w-[90vw] max-h-[80vh] bg-white rounded-[40px] shadow-2xl flex flex-col z-[110] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-indigo-600 p-6 flex items-center justify-between text-white shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-2xl"><Bot className="w-6 h-6" /></div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest leading-none">Maintenance AI Advisor</h3>
            <p className="text-[10px] text-indigo-100 font-bold mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Strategic Data Engine Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2.5 rounded-xl shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div className={`max-w-[95%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm border ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
              : 'bg-white border-slate-100 text-slate-700 rounded-tl-none font-medium'
            }`}>
              {renderFormattedText(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="bg-white shadow-sm border border-slate-100 p-2.5 rounded-xl text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-3xl text-slate-300 text-[11px] italic font-black uppercase tracking-widest">
              AI Generating Report...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t flex gap-3 shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="พิมพ์คำถามของคุณที่นี่..."
          className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 placeholder-slate-400"
          disabled={isTyping}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
