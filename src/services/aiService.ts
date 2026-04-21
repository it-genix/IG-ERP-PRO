import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  checkIn: string;
  checkOut: string | null;
  lat: number;
  lng: number;
  deviceId: string;
  officeLocation: { lat: number; lng: number };
}

export interface FraudAnalysisResult {
  riskScore: number;
  isSuspicious: boolean;
  reason: string;
  detectedPatterns: string[];
  recommendation: string;
}

export const analyzeAttendanceFraud = async (records: AttendanceRecord[]): Promise<FraudAnalysisResult[]> => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return [];
  }

  const prompt = `Analyze the following employee attendance records for suspicious activities or fraud. 
  Check for:
  1. GPS deviations (is the check-in location significantly far from the office location?).
  2. Device inconsistency (does the same employee use multiple device IDs?).
  3. Unusual time patterns (e.g., check-ins at impossible intervals or identical times for multiple users).
  
  Records: ${JSON.stringify(records)}
  
  Return a structured JSON array where each item corresponds to a record's analysis.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              recordId: { type: Type.STRING },
              riskScore: { type: Type.NUMBER, description: "Risk score from 0 to 100" },
              isSuspicious: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              detectedPatterns: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              recommendation: { type: Type.STRING }
            },
            required: ["recordId", "riskScore", "isSuspicious", "reason", "detectedPatterns", "recommendation"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return [];
  }
};
