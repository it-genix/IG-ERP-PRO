import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Brain, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeAttendanceFraud, AttendanceRecord, FraudAnalysisResult } from '../services/aiService';
import { cn } from '../lib/utils';

// Mock data for demonstration
const MOCK_RECORDS: AttendanceRecord[] = [
  {
    id: '1',
    employeeName: 'Marcus Aurelius',
    checkIn: '2026-04-18 08:30:00',
    checkOut: '2026-04-18 17:00:00',
    lat: 34.0522,
    lng: -118.2437,
    deviceId: 'iphone-13-pro-001',
    officeLocation: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: '2',
    employeeName: 'Lucius Seneca',
    checkIn: '2026-04-18 09:02:15',
    checkOut: null,
    lat: 34.0600, // Slightly off
    lng: -118.2500,
    deviceId: 'samsung-s21-998',
    officeLocation: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: '3',
    employeeName: 'Alan Turing',
    checkIn: '2026-04-18 08:15:00',
    checkOut: '2026-04-18 16:30:00',
    lat: 34.1000, // 5 miles away
    lng: -118.3000,
    deviceId: 'pixel-6-abc',
    officeLocation: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: '4',
    employeeName: 'Nikola Tesla',
    checkIn: '2026-04-18 09:15:33',
    checkOut: null,
    lat: 34.0522,
    lng: -118.2437,
    deviceId: 'tesla-pi-001',
    officeLocation: { lat: 34.0522, lng: -118.2437 }
  }
];

export const FraudDetection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(FraudAnalysisResult & { recordId: string })[]>([]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await analyzeAttendanceFraud(MOCK_RECORDS);
      setResults(data as (FraudAnalysisResult & { recordId: string })[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-wp-dark p-6 rounded-wp border border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-wp-blue/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <Brain className="w-12 h-12 text-wp-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">AI Sentinel Fraud Detection</h2>
            <p className="text-slate-400 text-sm mb-4 max-w-2xl">
              Advanced pattern analysis using Gemini 3 Flash to detect attendance fraud. 
              We track GPS geofencing, biometric device signatures, and behavior anomalies 
              to ensure payroll integrity.
            </p>
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-wp-blue hover:bg-blue-600 disabled:opacity-50 text-white rounded-wp font-bold text-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              {loading ? "Analyzing Patterns..." : "RUN FULL AUDIT"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {results.length > 0 ? (
            results.map((res, i) => {
              const record = MOCK_RECORDS.find(r => r.id === res.recordId);
              return (
                <motion.div 
                  key={res.recordId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-white p-5 rounded-wp border shadow-sm flex flex-col md:flex-row gap-6 items-start",
                    res.isSuspicious ? "border-rose-200 bg-rose-50/10" : "border-wp-border"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full shrink-0",
                    res.isSuspicious ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {res.isSuspicious ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-wp-text">{record?.employeeName}</h3>
                        <p className="text-[10px] uppercase font-bold text-wp-muted">Record ID: {res.recordId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-wp-muted uppercase">Risk Score</p>
                        <p className={cn(
                          "text-xl font-bold",
                          res.riskScore > 70 ? "text-rose-600" : res.riskScore > 30 ? "text-amber-600" : "text-emerald-600"
                        )}>{res.riskScore}/100</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-wp-text mb-4 leading-relaxed italic">
                      " {res.reason} "
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {res.detectedPatterns.map((pattern, idx) => (
                        <span key={idx} className="bg-slate-100 text-[10px] font-bold text-wp-muted px-2 py-1 rounded uppercase tracking-tight border border-wp-border">
                          {pattern}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 border border-wp-border rounded text-xs flex gap-3">
                      <Info className="w-4 h-4 text-wp-blue shrink-0" />
                      <div>
                        <p className="font-bold mb-1">AI Recommendation:</p>
                        <p className="text-wp-muted">{res.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : !loading && (
            <div className="p-12 border-2 border-dashed border-wp-border rounded-wp flex flex-col items-center justify-center text-wp-muted">
               <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-bold">No active audit results.</p>
               <p className="text-xs opacity-60">Run the Sentinel audit to detect fraud patterns.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
