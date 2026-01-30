
import { GoogleGenAI, Type } from "@google/genai";
import { SheetData, AnalysisResult } from '../types';

export const analyzeWithGemini = async (allSheets: SheetData[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contextDescription = allSheets.map(s => {
    return `Sheet: "${s.name}" (${s.rows.length} records). 
    Definition: 
    - CCTV: UPS (Bat Qty), INS_BAT (Install Date), NEXT_BAT (Due Date)
    - PABX: N_BAT (Bat Qty), INS_BAT (Install Date), NEXT_BAT (Due Date)
    - Digital Radio (Comprehensive): 
        - Infrastructure: Tower_No1, Tower_No2 (เสาโครงเหล็ก)
        - Equipment: Base_Station, FIXED Radio, MOBILE RADIO, HANHELD
        - Revenue/Tenants: Rent_Tower (ผู้เช่า), Area_PEA (พื้นที่รับผิดชอบ), Rent_Hight_Tower (ความสูงที่เช่า), Rent_Year (ค่าเช่าต่อปี)
    
    Data Summary: ${JSON.stringify(s.rows.slice(0, 60))}`;
  }).join('\n\n');
  
  const prompt = `
    คุณคือ "AI Strategic Maintenance & Asset Manager" ผู้เชี่ยวชาญด้านระบบสื่อสารและบริหารจัดการทรัพย์สิน
    
    ข้อมูลด้านล่างคือสถานะแบตเตอรี่และข้อมูลการเช่าโครงสร้างพื้นฐาน (Digital Radio, CCTV, PABX):
    ${contextDescription}

    ภารกิจของคุณคือวิเคราะห์ข้อมูลเชิงกลยุทธ์:
    1. [ASSET ANALYSIS] สรุปจำนวนอุปกรณ์ Digital Radio แยกตามประเภท (Base, Fixed, Mobile, Handheld) และสถานะเสา (Tower)
    2. [REVENUE & COST] 
       - คำนวณรายได้รวมจากค่าเช่าเสา (Rent_Year) และสรุปผู้เช่ารายใหญ่
       - ประมาณการงบประมาณเปลี่ยนแบตเตอรี่ (CCTV: 800, PABX/Radio: 10,000 ต่อก้อน)
    3. [OPERATIONAL INSIGHTS] วิเคราะห์ความเสี่ยงของอุปกรณ์ที่เลยกำหนด (Overdue) และเสนอแผน Grouping การลงพื้นที่ตาม Area_PEA

    กรุณาส่งกลับในรูปแบบ JSON:
    {
      "summary": "สรุปภาพรวมสินทรัพย์ รายได้ค่าเช่า และความเสี่ยงด้านการซ่อมบำรุง",
      "insights": ["วิเคราะห์รายได้จาก Rent_Year", "รายการอุปกรณ์ Digital Radio ที่ต้องเฝ้าระวัง", "สรุปจำนวนแบตเตอรี่ที่ต้องสั่งซื้อ"],
      "recommendations": ["กลยุทธ์การเพิ่มรายได้จากพื้นที่ Area_PEA", "แผนการซ่อมบำรุงเชิงป้องกัน", "การบริหารจัดการสต็อกอะไหล่"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "insights", "recommendations"]
        }
      },
    });

    let result: any = {};
    const text = response.text || '';
    try {
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      result = JSON.parse(text.substring(startIdx, endIdx + 1));
    } catch (e) {
      result = { summary: text, insights: [], recommendations: [] };
    }

    return {
      summary: result.summary || '',
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      sources: []
    };
  } catch (error) {
    console.error('Error analyzing battery and asset status:', error);
    throw error;
  }
};
