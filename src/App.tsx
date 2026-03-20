/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Component, ErrorInfo, ReactNode } from 'react';
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
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Copy,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-zinc-400">The application encountered an unexpected error. Please refresh the page to continue.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-zinc-100 text-zinc-950 rounded-xl font-bold hover:bg-white transition-all"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "danger"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText?: string; 
  cancelText?: string;
  variant?: "danger" | "primary"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all text-sm font-semibold"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 px-4 py-2 rounded-xl transition-all text-sm font-semibold",
              variant === "danger" ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Toast = ({ 
  message, 
  isVisible, 
  onClose 
}: { 
  message: string; 
  isVisible: boolean; 
  onClose: () => void 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full shadow-xl flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-xs font-medium text-white">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Types ---
interface GroundingSource {
  uri: string;
  title: string;
}

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
  sources?: GroundingSource[];
}

// --- Mock Data for Metrics ---
const generateMockMetrics = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}h`,
    value: Math.floor(Math.random() * 40) + 60
  }));
};

// --- Components ---

const SidebarItem = React.memo(({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
    )}
  >
    <Icon size={18} className={cn("transition-transform group-hover:scale-110", active && "text-emerald-400")} />
    <span className="text-sm font-medium">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
  </button>
));

const MetricCard = React.memo(({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: string }) => (
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
));

function AppContent() {
  const [intent, setIntent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<IntentResult[]>([]);
  const [activeResult, setActiveResult] = useState<IntentResult | null>(null);
  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  
  // Settings State
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [groundingEnabled, setGroundingEnabled] = useState(true);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);

  // UI State
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "primary";
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  // Persistence Logic
  useEffect(() => {
    const savedResults = localStorage.getItem('intentbridge_history');
    const savedSettings = localStorage.getItem('intentbridge_settings');
    
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        // Convert string timestamps back to Date objects
        const formatted = parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
        setResults(formatted);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSelectedModel(settings.model || 'gemini-3.1-pro-preview');
        setGroundingEnabled(settings.grounding ?? true);
        setPersistenceEnabled(settings.persistence ?? true);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  useEffect(() => {
    if (persistenceEnabled) {
      localStorage.setItem('intentbridge_history', JSON.stringify(results));
    } else {
      localStorage.removeItem('intentbridge_history');
    }
  }, [results, persistenceEnabled]);

  useEffect(() => {
    localStorage.setItem('intentbridge_settings', JSON.stringify({
      model: selectedModel,
      grounding: groundingEnabled,
      persistence: persistenceEnabled
    }));
  }, [selectedModel, groundingEnabled, persistenceEnabled]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  const handleProcessIntent = useCallback(async (retryIntent?: string) => {
    const targetIntent = retryIntent || intent;
    if (!targetIntent.trim()) return;
    if (targetIntent.length < 10) {
      setError("Intent is too short. Please provide more context (min 10 chars).");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setDeploySuccess(false);

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: `Analyze this user intent and provide a structured JSON response. 
        Intent: "${targetIntent}"
        
        Return JSON with:
        - summary: 1 sentence overview
        - clarity: 0-100 score
        - complexity: 0-100 score
        - steps: array of 4-6 actionable steps
        - resources: array of 3-4 required tools or resources
        `,
        config: {
          responseMimeType: "application/json",
          tools: groundingEnabled ? [{ googleSearch: {} }] : []
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const data = JSON.parse(text);
      
      // Extract grounding sources
      const sources: GroundingSource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri
            });
          }
        });
      }
      
      const newResult: IntentResult = {
        id: Math.random().toString(36).substr(2, 9),
        intent: targetIntent,
        timestamp: new Date(),
        analysis: {
          clarity: data.clarity || 85,
          complexity: data.complexity || 45,
          steps: data.steps || ["Analyze requirements", "Define architecture", "Implement core logic", "Test and validate"],
          resources: data.resources || ["Gemini API", "React Framework", "Tailwind CSS"],
          summary: data.summary || "Processing intent through AI bridge..."
        },
        metrics: generateMockMetrics(),
        sources: sources.length > 0 ? sources : undefined
      };

      setResults(prev => [newResult, ...prev]);
      setActiveResult(newResult);
      if (!retryIntent) setIntent('');
    } catch (err) {
      console.error("Error processing intent:", err);
      setError("Failed to process intent. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [ai, intent, selectedModel, groundingEnabled]);

  const handleDeploy = useCallback(async () => {
    if (!activeResult) return;
    setIsDeploying(true);
    setDeploySuccess(false);
    
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsDeploying(false);
    setDeploySuccess(true);
    showToast("Workflow deployed successfully!");
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setDeploySuccess(false), 5000);
  }, [activeResult]);

  const clearHistory = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: "Clear All History",
      message: "Are you sure you want to clear all history? This cannot be undone.",
      onConfirm: () => {
        setResults([]);
        setActiveResult(null);
        setView('dashboard');
        localStorage.removeItem('intentbridge_history');
        showToast("History cleared");
      },
      variant: "danger"
    });
  }, []);

  const deleteResult = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete Analysis",
      message: "Are you sure you want to delete this analysis?",
      onConfirm: () => {
        setResults(prev => prev.filter(r => r.id !== id));
        if (activeResult?.id === id) setActiveResult(null);
        showToast("Analysis deleted");
      },
      variant: "danger"
    });
  }, [activeResult]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* --- Navigation --- */}
      <nav 
        role="navigation"
        aria-label="Main Navigation"
        className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl z-50 hidden md:flex flex-col p-6"
      >
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Layers className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">IntentBridge</h1>
        </div>

        <div className="space-y-2 flex-1">
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
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold">JD</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-100 truncate">John Doe</div>
              <div className="text-[10px] text-zinc-500 truncate">Pro Plan</div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main role="main" className="md:pl-64 min-h-screen">
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
              <button 
                aria-label="Share Analysis"
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Share2 size={18} />
              </button>
              <button 
                aria-label="Download Report"
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
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
                      <label htmlFor="intent-input" className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">Input Intent</label>
                      <textarea 
                        id="intent-input"
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="e.g., Build a marketing strategy for a sustainable fashion brand targeting Gen Z..."
                        className="w-full bg-transparent border-none p-0 text-xl text-zinc-100 placeholder:text-zinc-700 focus:ring-0 resize-none min-h-[100px] outline-none"
                      />
                      
                      <AnimatePresence>
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 text-red-400 text-sm mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                          >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                            <button 
                              onClick={() => handleProcessIntent()}
                              className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:underline"
                            >
                              <RefreshCw size={12} /> Retry
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-800/50">
                          <div className="flex gap-4 text-[10px] font-mono text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              <Globe size={12} className={groundingEnabled ? "text-emerald-400" : "text-zinc-600"} /> 
                              Web Search {groundingEnabled ? "Enabled" : "Disabled"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Cpu size={12} className="text-emerald-400" /> 
                              {selectedModel.includes('pro') ? "Gemini 3.1 Pro" : "Gemini 3.1 Flash"}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleProcessIntent()}
                            disabled={isProcessing || !intent.trim()}
                            aria-label="Process Intent"
                            className={cn(
                              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
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
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Actionable Roadmap</h4>
                              <button 
                                onClick={() => copyToClipboard(activeResult.analysis.steps.join('\n'))}
                                className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                              >
                                <Download size={12} /> Copy Steps
                              </button>
                            </div>
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

                      {activeResult.sources && activeResult.sources.length > 0 && (
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem]">
                          <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Grounding Sources</h4>
                          <div className="space-y-3">
                            {activeResult.sources.map((source, i) => (
                              <a 
                                key={i}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30 hover:border-emerald-500/50 transition-colors group"
                              >
                                <div className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 group-hover:text-emerald-400">
                                  <Globe size={14} />
                                </div>
                                <span className="text-xs font-medium text-zinc-300 truncate flex-1">{source.title}</span>
                                <ExternalLink size={12} className="text-zinc-600 group-hover:text-emerald-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

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
                        <button 
                          onClick={handleDeploy}
                          disabled={isDeploying}
                          aria-label="Deploy Workflow"
                          className={cn(
                            "w-full mt-8 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                            isDeploying 
                              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                              : "bg-zinc-100 text-zinc-950 hover:bg-white"
                          )}
                        >
                          {isDeploying ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              Deploying...
                            </>
                          ) : (
                            <>
                              Deploy Workflow
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>

                        <AnimatePresence>
                          {deploySuccess && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
                            >
                              <CheckCircle2 className="text-emerald-400" size={18} />
                              <span className="text-xs font-bold text-emerald-400">Workflow deployed successfully!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                <div key={res.id} className="relative group">
                  <button 
                    onClick={() => {
                      setActiveResult(res);
                      setView('dashboard');
                    }}
                    aria-label={`View analysis for: ${res.intent}`}
                    className="w-full bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl text-left hover:border-zinc-600 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                  <button 
                    onClick={(e) => deleteResult(res.id, e)}
                    className="absolute top-4 right-12 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                    aria-label="Delete history item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    aria-label="Select AI Model"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg text-xs px-3 py-2 text-zinc-200 outline-none focus:border-emerald-500"
                  >
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Recommended)</option>
                    <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Real-time Grounding</div>
                    <div className="text-xs text-zinc-500">Enable Google Search for up-to-date context.</div>
                  </div>
                  <button 
                    onClick={() => setGroundingEnabled(!groundingEnabled)}
                    aria-label="Toggle Grounding"
                    className={cn(
                      "w-10 h-5 rounded-full relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors",
                      groundingEnabled ? "bg-emerald-500" : "bg-zinc-700"
                    )}
                  >
                    <motion.div 
                      animate={{ x: groundingEnabled ? 20 : 2 }}
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Data Persistence</div>
                    <div className="text-xs text-zinc-500">Store intent history locally in the browser.</div>
                  </div>
                  <button 
                    onClick={() => setPersistenceEnabled(!persistenceEnabled)}
                    aria-label="Toggle Persistence"
                    className={cn(
                      "w-10 h-5 rounded-full relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors",
                      persistenceEnabled ? "bg-emerald-500" : "bg-zinc-700"
                    )}
                  >
                    <motion.div 
                      animate={{ x: persistenceEnabled ? 20 : 2 }}
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>
                <div className="pt-6 border-t border-zinc-800">
                  <button 
                    onClick={clearHistory}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 size={16} />
                    Clear All History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Mobile Nav --- */}
      <nav 
        role="navigation"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 p-4 md:hidden flex justify-around z-50"
      >
        <button 
          onClick={() => setView('dashboard')} 
          aria-label="Dashboard"
          aria-current={view === 'dashboard' ? 'page' : undefined}
          className={cn("p-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg", view === 'dashboard' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Activity size={24} />
        </button>
        <button 
          onClick={() => setView('history')} 
          aria-label="History"
          aria-current={view === 'history' ? 'page' : undefined}
          className={cn("p-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg", view === 'history' ? "text-emerald-400" : "text-zinc-500")}
        >
          <History size={24} />
        </button>
        <button 
          onClick={() => setView('settings')} 
          aria-label="Settings"
          aria-current={view === 'settings' ? 'page' : undefined}
          className={cn("p-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg", view === 'settings' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Settings size={24} />
        </button>
      </nav>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

      <Toast 
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
