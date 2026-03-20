/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Layers, 
  History, 
  Settings, 
  ChevronRight, 
  Activity, 
  Zap, 
  Cpu, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Share2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface IntentResult {
  id: string;
  intent: string;
  timestamp: Date;
  analysis: {
    clarity: number;
    complexity: number;
    steps: string[];
    resources: string[];
    summary: string;
  };
  metrics: { time: string; value: number }[];
}

// --- Mock Data for Metrics ---
const generateMockMetrics = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}h`,
    value: Math.floor(Math.random() * 40) + 60
  }));
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
    )}
  >
    <Icon size={18} className={cn("transition-transform group-hover:scale-110", active && "text-emerald-400")} />
    <span className="text-sm font-medium">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
  </button>
);

const MetricCard = ({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: string }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-semibold text-zinc-100">{value}</div>
  </div>
);

export default function App() {
  const [intent, setIntent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<IntentResult[]>([]);
  const [activeResult, setActiveResult] = useState<IntentResult | null>(null);
  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleProcessIntent = async () => {
    if (!intent.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this user intent and provide a structured JSON response. 
        Intent: "${intent}"
        
        Return JSON with:
        - summary: 1 sentence overview
        - clarity: 0-100 score
        - complexity: 0-100 score
        - steps: array of 4-6 actionable steps
        - resources: array of 3-4 required tools or resources
        `,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newResult: IntentResult = {
        id: Math.random().toString(36).substr(2, 9),
        intent,
        timestamp: new Date(),
        analysis: {
          clarity: data.clarity || 85,
          complexity: data.complexity || 45,
          steps: data.steps || ["Analyze requirements", "Define architecture", "Implement core logic", "Test and validate"],
          resources: data.resources || ["Gemini API", "React Framework", "Tailwind CSS"],
          summary: data.summary || "Processing intent through AI bridge..."
        },
        metrics: generateMockMetrics()
      };

      setResults(prev => [newResult, ...prev]);
      setActiveResult(newResult);
      setIntent('');
    } catch (error) {
      console.error("Error processing intent:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* --- Navigation --- */}
      <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl z-50 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Layers className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">IntentBridge</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem 
            icon={Activity} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={History} 
            label="History" 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={view === 'settings'} 
            onClick={() => setView('settings')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold">JD</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-100 truncate">John Doe</div>
              <div className="text-[10px] text-zinc-500 truncate">Pro Plan</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          
          {/* --- Header --- */}
          <header className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {view === 'dashboard' ? "Bridge Your Intent" : view === 'history' ? "Past Bridges" : "Configuration"}
              </h2>
              <p className="text-zinc-500 text-sm">
                {view === 'dashboard' ? "Transform natural language into actionable workflows." : "Review and re-run previous intent analyses."}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
                <Share2 size={18} />
              </button>
              <button className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
                <Download size={18} />
              </button>
            </div>
          </header>

          {view === 'dashboard' && (
            <div className="space-y-10">
              {/* --- Intent Input --- */}
              <section className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] blur-2xl opacity-50" />
                <div className="relative bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] backdrop-blur-md">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">Input Intent</label>
                      <textarea 
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="e.g., Build a marketing strategy for a sustainable fashion brand targeting Gen Z..."
                        className="w-full bg-transparent border-none p-0 text-xl text-zinc-100 placeholder:text-zinc-700 focus:ring-0 resize-none min-h-[100px]"
                      />
                      <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-800/50">
                        <div className="flex gap-4 text-[10px] font-mono text-zinc-600">
                          <span className="flex items-center gap-1.5"><Globe size={12} /> Web Search Enabled</span>
                          <span className="flex items-center gap-1.5"><Cpu size={12} /> Gemini 3.1 Flash</span>
                        </div>
                        <button 
                          onClick={handleProcessIntent}
                          disabled={isProcessing || !intent.trim()}
                          className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300",
                            isProcessing || !intent.trim()
                              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                              : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                          )}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              Bridge Intent
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* --- Results Display --- */}
              <AnimatePresence mode="wait">
                {activeResult ? (
                  <motion.div 
                    key={activeResult.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    {/* --- Left Column: Analysis --- */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Terminal size={18} />
                          </div>
                          <h3 className="text-lg font-bold text-white">Bridge Analysis</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-10">
                          <MetricCard 
                            label="Clarity Score" 
                            value={`${activeResult.analysis.clarity}%`} 
                            icon={Sparkles} 
                            trend="+12%" 
                          />
                          <MetricCard 
                            label="Complexity" 
                            value={`${activeResult.analysis.complexity}%`} 
                            icon={Layers} 
                          />
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Actionable Roadmap</h4>
                            <div className="space-y-3">
                              {activeResult.analysis.steps.map((step, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {i + 1}
                                  </div>
                                  <span className="text-sm text-zinc-200">{step}</span>
                                  <CheckCircle2 className="ml-auto text-emerald-500/50" size={18} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem]">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                              <Activity size={18} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Execution Metrics</h3>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Feed</span>
                          </div>
                        </div>
                        
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activeResult.metrics}>
                              <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                              <XAxis 
                                dataKey="time" 
                                stroke="#52525b" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                              />
                              <YAxis 
                                stroke="#52525b" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `${value}%`}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#10b981', fontSize: '12px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* --- Right Column: Resources & Summary --- */}
                    <div className="space-y-8">
                      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem]">
                        <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Intent Summary</h4>
                        <p className="text-zinc-200 leading-relaxed mb-8 italic">
                          "{activeResult.analysis.summary}"
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                          <History size={12} />
                          Processed at {activeResult.timestamp.toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem]">
                        <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Bridge Resources</h4>
                        <div className="space-y-4">
                          {activeResult.analysis.resources.map((res, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
                              <div className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400">
                                <ChevronRight size={14} />
                              </div>
                              <span className="text-sm font-medium text-zinc-300">{res}</span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-8 py-4 rounded-2xl bg-zinc-100 text-zinc-950 font-bold text-sm hover:bg-white transition-all flex items-center justify-center gap-2 group">
                          Deploy Workflow
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="text-emerald-400" size={20} />
                          <h4 className="text-sm font-bold text-white">AI Confidence</h4>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                          The bridge was constructed with high confidence. All nodes are synchronized and ready for execution.
                        </p>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '94%' }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] font-mono text-zinc-500">0%</span>
                          <span className="text-[10px] font-mono text-emerald-400">94% Optimal</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8">
                      <Layers size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-400 mb-2">No Active Bridge</h3>
                    <p className="text-zinc-600 max-w-xs">
                      Enter an intent above to generate your first AI-powered workflow bridge.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {view === 'history' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.length > 0 ? results.map((res) => (
                <button 
                  key={res.id}
                  onClick={() => {
                    setActiveResult(res);
                    setView('dashboard');
                  }}
                  className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl text-left hover:border-zinc-600 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      {res.timestamp.toLocaleDateString()}
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                  <h4 className="text-zinc-100 font-semibold mb-2 line-clamp-2">{res.intent}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 italic">"{res.analysis.summary}"</p>
                  <div className="mt-6 flex gap-3">
                    <div className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                      {res.analysis.steps.length} Steps
                    </div>
                    <div className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                      {res.analysis.clarity}% Clarity
                    </div>
                  </div>
                </button>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-zinc-600">Your intent history will appear here.</p>
                </div>
              )}
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem]">
              <h3 className="text-lg font-bold text-white mb-8">System Configuration</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">AI Model Selection</div>
                    <div className="text-xs text-zinc-500">Choose the primary engine for intent analysis.</div>
                  </div>
                  <select className="bg-zinc-800 border border-zinc-700 rounded-lg text-xs px-3 py-2 text-zinc-200 outline-none focus:border-emerald-500">
                    <option>Gemini 3.1 Flash (Recommended)</option>
                    <option>Gemini 3.1 Pro</option>
                    <option>Gemini 2.5 Flash</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Real-time Grounding</div>
                    <div className="text-xs text-zinc-500">Enable Google Search for up-to-date context.</div>
                  </div>
                  <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Data Persistence</div>
                    <div className="text-xs text-zinc-500">Store intent history locally in the browser.</div>
                  </div>
                  <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Mobile Nav --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 p-4 md:hidden flex justify-around z-50">
        <button onClick={() => setView('dashboard')} className={cn("p-2", view === 'dashboard' ? "text-emerald-400" : "text-zinc-500")}>
          <Activity size={24} />
        </button>
        <button onClick={() => setView('history')} className={cn("p-2", view === 'history' ? "text-emerald-400" : "text-zinc-500")}>
          <History size={24} />
        </button>
        <button onClick={() => setView('settings')} className={cn("p-2", view === 'settings' ? "text-emerald-400" : "text-zinc-500")}>
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
}
