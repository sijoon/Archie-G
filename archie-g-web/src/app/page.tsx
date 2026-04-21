"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  Code2,
  Cpu,
  Layout,
  MessageSquare,
  Zap,
  BookOpen,
  GitBranch,
  Database,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  History,
  Monitor,
  Pin,
  ExternalLink,
  FileCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryCard } from "@/components/HistoryCard";
import { FileTree } from "@/components/FileTree";
import { Mermaid } from "@/components/Mermaid";

// ── Types ─────────────────────────────────────────────────────
type Pillar = "analysis" | "agent" | "feedback";
type Tab = "workspace" | "masterflow" | "history";
type ViewMode = "diagram" | "code";
type ProviderName = "ollama" | "lmstudio";

interface HistoryItem {
  id: string;
  timestamp: string;
  path: string;
  analysis: string;
  provider: string;
  model: string;
  project_root?: string;
}

interface ProviderStatus {
  name: ProviderName;
  label: string;
  available: boolean;
  models: string[];
  baseUrl: string;
}

interface HealthData {
  providers: ProviderStatus[];
  recommended: { provider: ProviderName; model: string } | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// ── Main Dashboard ────────────────────────────────────────────
// ── Components ────────────────────────────────────────────────
function DetailFlowCard({ detail }: { detail: { title: string; code: string } }) {
  const [viewMode, setViewMode] = useState<ViewMode>("diagram");

  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <h4 className="text-[11px] font-black uppercase text-white/80">{detail.title}</h4>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
          <button 
            onClick={() => setViewMode("diagram")}
            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${viewMode === "diagram" ? "bg-blue-500 text-white shadow-lg" : "text-white/30 hover:text-white"}`}
          >
            Diagram
          </button>
          <button 
            onClick={() => setViewMode("code")}
            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${viewMode === "code" ? "bg-blue-500 text-white shadow-lg" : "text-white/30 hover:text-white"}`}
          >
            Code
          </button>
        </div>
      </div>
      
      {viewMode === "diagram" ? (
        <Mermaid chart={detail.code} />
      ) : (
        <pre className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-white/50 overflow-x-auto whitespace-pre">
          {detail.code}
        </pre>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activePillar, setActivePillar] = useState<Pillar>("analysis");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisPath, setAnalysisPath] = useState("../examples/DemoProject/Bridge/BridgeManager.swift");

  // Tab & History state
  const [activeTab, setActiveTab] = useState<Tab>("workspace");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [projectRoot, setProjectRoot] = useState("");
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [masterViewMode, setMasterViewMode] = useState<ViewMode>("diagram");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // LLM Provider state
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderName | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! 저는 Archie-G입니다 🏛\n하이브리드 모바일 아키텍처, Swift/Kotlin 브릿지 패턴, API 설계에 대해 자유롭게 질문해 주세요.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Provider detection ────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data: HealthData = await res.json();
      setHealth(data);
      if (data.recommended && !selectedProvider) {
        setSelectedProvider(data.recommended.provider);
        setSelectedModel(data.recommended.model);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsHealthLoading(false);
    }
  }, [selectedProvider]);

  const fetchFileTree = useCallback(async () => {
    setIsFileTreeLoading(true);
    try {
      const url = projectRoot ? `/api/files?root=${encodeURIComponent(projectRoot)}` : "/api/files";
      const res = await fetch(url);
      const data = await res.json();
      if (data.tree) setFileTree(data.tree);
      if (data.root && !projectRoot) setProjectRoot(data.root);
    } catch (e) {
      console.error("Failed to fetch file tree", e);
    } finally {
      setIsFileTreeLoading(false);
    }
  }, [projectRoot]);
  useEffect(() => {
    fetchHealth();
    fetchFileTree();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.history) setHistoryItems(data.history);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const saveToHistory = async (result: string) => {
    if (!result) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      path: analysisPath,
      analysis: result,
      provider: selectedProvider || "unknown",
      model: selectedModel || "unknown",
      project_root: projectRoot,
    };

    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", item: newItem }),
      });
      fetchHistory();
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      fetchHistory();
    } catch (e) {
      console.error("Failed to delete history", e);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setAnalysis({ analysis: item.analysis });
    setAnalysisPath(item.path);
    if (item.project_root) setProjectRoot(item.project_root);
    setActiveTab("workspace");
  };

  const parseAnalysis = (text: string) => {
    if (!text) return { master: "", details: [], guide: "" };
    
    const masterMatch = text.match(/###\s*MASTER_FLOW\s+```mermaid([\s\S]*?)```/i);
    const master = masterMatch ? masterMatch[1].trim() : "";
    
    const details: { title: string; code: string }[] = [];
    const detailRegex = /###\s*DETAIL_FLOW:\s*(.*?)\s+```mermaid([\s\S]*?)```/gi;
    let m;
    while ((m = detailRegex.exec(text)) !== null) {
      details.push({ title: m[1], code: m[2].trim() });
    }
    
    const guide = text.split(/###\s*MASTER_FLOW/i)[0] || text;
    
    return { master, details, guide };
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const currentProviderStatus = health?.providers.find((p) => p.name === selectedProvider);
  const isConnected = currentProviderStatus?.available ?? false;
  const availableModels = currentProviderStatus?.models ?? [];

  // ── Analysis handler ──────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalysis({ analysis: "" });
    setIsLoading(true);
    setElapsedTime(0);
    
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: analysisPath,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({ error: "분석 실패" }));
        setAnalysis({ error: errData.error });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // Don't update analysis state here to avoid real-time UI flickering
      }

      // Final update after full response received
      setAnalysis({ analysis: accumulated });
      saveToHistory(accumulated);
    } catch (err) {
      console.error(err);
      setAnalysis({ error: "연결 오류가 발생했습니다.\nOllama 또는 LM Studio가 실행 중인지 확인해 주세요." });
    } finally {
      setIsLoading(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // ── Chat handler ──────────────────────────────────────────
  const handleSendMessage = async () => {
    const userText = chatInput.trim();
    if (!userText || isChatLoading || !isConnected) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    // Placeholder for streaming response
    const streamingId = `ai-${Date.now()}`;
    const streamingMsg: ChatMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setChatMessages((prev) => [...prev, userMsg, streamingMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Build history excluding the streaming placeholder
      const history = [...chatMessages, userMsg]
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({ error: "연결 실패" }));
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: `⚠️ ${errData.error}`, isLoading: false }
              : m
          )
        );
        return;
      }

      // Stream reading — update the bubble token-by-token
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      // Stream reading
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId ? { ...m, content: accumulated, isLoading: false } : m
        )
      );
    } catch (err: any) {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                content:
                  "⚠️ 연결 오류가 발생했습니다.\nOllama 또는 LM Studio가 실행 중인지 확인해 주세요.",
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "안녕하세요! 저는 Archie-G입니다 🏛\n하이브리드 모바일 아키텍처, Swift/Kotlin 브릿지 패턴, API 설계에 대해 자유롭게 질문해 주세요.",
        timestamp: new Date(),
      },
    ]);
  };

  // ── Helpers ───────────────────────────────────────────────
  const renderGuide = (text: string) => {
    if (!text) return null;
    const highlighted = text.replace(
      /\[\?\?\]/g,
      '<span style="background:rgba(234,179,8,0.2);color:#fbbf24;padding:1px 4px;border-radius:4px;font-weight:bold;">[??]</span>'
    );
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const pillarAccent: Record<Pillar, string> = {
    analysis: "bg-blue-400",
    agent: "bg-violet-500",
    feedback: "bg-emerald-400",
  };

  const pillarTitle: Record<Pillar, string> = {
    analysis: "Architecture Tracing",
    agent: "Agent Q&A",
    feedback: "Knowledge Feedback",
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="flex h-screen overflow-hidden bg-background premium-gradient selection:bg-violet-500/30">
      {/* ── Sidebar ── */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col z-50 shrink-0">
        {/* Logo */}
        <div
          className="p-6 pb-2 flex items-center space-x-3 cursor-pointer"
          onClick={() => setActivePillar("analysis")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <Cpu className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-white">Archie-G</h1>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">
              V8 Operating
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-5 space-y-1">
          <NavPillar
            icon={<Layout size={16} />}
            label="분석 (Analysis)"
            desc="Architecture Tracing"
            isActive={activePillar === "analysis"}
            onClick={() => setActivePillar("analysis")}
            color="blue"
          />
          <NavPillar
            icon={<Bot size={16} />}
            label="에이전트 (Agent)"
            desc="Q&A Chat"
            isActive={activePillar === "agent"}
            onClick={() => setActivePillar("agent")}
            color="violet"
          />
          <NavPillar
            icon={<MessageSquare size={16} />}
            label="피드백 (Feedback)"
            desc="Knowledge Loop"
            isActive={activePillar === "feedback"}
            onClick={() => setActivePillar("feedback")}
            color="emerald"
          />
        </nav>

        {/* Analysis Target Panel (File Tree) */}
        <div className="flex-1 min-h-0 flex flex-col mx-3 mb-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
              Project Explorer
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setProjectRoot(analysisPath)}
                title="현재 경로를 루트로 설정"
                className="text-white/20 hover:text-violet-400 transition-colors"
              >
                <Layout size={11} />
              </button>
              <button 
                onClick={fetchFileTree}
                disabled={isFileTreeLoading}
                className="text-white/20 hover:text-blue-400 transition-colors"
              >
                <RefreshCw size={11} className={isFileTreeLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input 
              type="text"
              value={projectRoot}
              onChange={(e) => setProjectRoot(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFileTree()}
              placeholder="프로젝트 루트 경로..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-mono text-white/30 outline-none focus:border-white/10"
            />
          </div>
          
          <div className="flex-1 min-h-0">
            {isFileTreeLoading && fileTree.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-20">
                <RefreshCw size={24} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Scanning...</span>
              </div>
            ) : (
              <FileTree 
                tree={fileTree} 
                onSelect={(path) => setAnalysisPath(path)}
                selectedPath={analysisPath}
              />
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[8px] text-white/20 uppercase font-black mb-2 tracking-tighter">Current Target</p>
            <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <FileCode size={10} className="text-blue-400/50" />
              <span className="text-[9px] font-mono text-white/40 truncate flex-1">
                {analysisPath.replace("../", "")}
              </span>
            </div>
          </div>
        </div>

        {/* LLM Agent Panel */}
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
              LLM Agent
            </p>
            <button
              onClick={fetchHealth}
              disabled={isHealthLoading}
              className="text-white/20 hover:text-white/50 transition-colors"
              title="재스캔"
            >
              <RefreshCw size={11} className={isHealthLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {health ? (
            <div className="space-y-2">
              {health.providers.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    if (p.available) {
                      setSelectedProvider(p.name);
                      setSelectedModel(p.models[0] ?? "");
                      setShowModelDropdown(false);
                    }
                  }}
                  disabled={!p.available}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border ${
                    selectedProvider === p.name && p.available
                      ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                      : p.available
                      ? "bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.07]"
                      : "bg-white/[0.02] border-white/[0.04] text-white/20 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {p.available ? (
                      <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                    ) : (
                      <XCircle size={11} className="text-red-400/50 shrink-0" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wide">{p.label}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {p.available ? (
                      <>
                        <Wifi size={9} className="text-green-400" />
                        <span className="text-[9px] text-green-400 font-bold">
                          {p.models.length}개
                        </span>
                      </>
                    ) : (
                      <WifiOff size={9} className="text-white/15" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-white/20 text-center py-2">스캔 중...</div>
          )}

          {/* Model Selector */}
          {selectedProvider && availableModels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all"
              >
                <span className="text-[10px] font-mono text-white/60 truncate max-w-[120px]">
                  {selectedModel || "모델 선택"}
                </span>
                <ChevronDown
                  size={11}
                  className={`text-white/30 transition-transform shrink-0 ${
                    showModelDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-full mb-1 w-full rounded-xl border border-white/10 bg-[#131320] shadow-2xl overflow-hidden z-50 max-h-40 overflow-y-auto"
                  >
                    {availableModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-violet-500/10 transition-colors ${
                          selectedModel === m
                            ? "text-violet-400 bg-violet-500/10"
                            : "text-white/50"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] text-white/20 uppercase font-bold">상태</span>
            <div className="flex items-center space-x-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"
                    : "bg-red-400/50"
                }`}
              />
              <span
                className={`text-[9px] font-black uppercase ${
                  isConnected ? "text-green-400" : "text-red-400/50"
                }`}
              >
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Protocol Status */}
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Protocol</p>
          <StatusRow
            label="Harness"
            value={analysis ? "Active" : "Standby"}
            dot="green"
          />
          <StatusRow label="Mode" value={activePillar} dot="blue" />
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-white/30 uppercase">Confidence</span>
              <span className="text-[10px] font-black text-violet-400">98.4%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "98.4%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 mt-auto">
          <p className="text-[9px] text-white/10 text-center font-mono tracking-widest">
            GEMINI.md Protocol Active
          </p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <section className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0A0A10]/50 backdrop-blur-xl z-40">
          <div className="flex items-center space-x-8">
            <motion.div
              key={activePillar}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className={`w-1 h-7 rounded-full ${pillarAccent[activePillar]}`} />
              <div>
                <h2 className="text-base font-black tracking-tight text-white">
                  {pillarTitle[activePillar]}
                </h2>
                <p className="text-[10px] font-medium">
                  {isConnected ? (
                    <span className="text-green-400/70">
                      {selectedProvider === "ollama" ? "Ollama" : "LM Studio"} · {selectedModel}
                    </span>
                  ) : (
                    <span className="text-red-400/50">
                      LLM 미연결 — Ollama 또는 LM Studio를 실행해 주세요
                    </span>
                  )}
                </p>
              </div>
            </motion.div>

            {/* Sub-Tabs */}
            {activePillar === "analysis" && (
              <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/5">
                <TabButton
                  active={activeTab === "workspace"}
                  onClick={() => setActiveTab("workspace")}
                  icon={<Monitor size={14} />}
                  label="Workspace"
                />
                <TabButton
                  active={activeTab === "masterflow"}
                  onClick={() => setActiveTab("masterflow")}
                  icon={<Zap size={14} />}
                  label="Master Flow"
                />
                <TabButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                  icon={<History size={14} />}
                  label="History"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {activePillar === "analysis" && (
              <>
                {analysis?.analysis && activeTab === "workspace" && (
                  <button
                    onClick={() => saveToHistory(analysis.analysis || "")}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-black hover:bg-white/10 hover:text-white/60 transition-all"
                    title="히스토리에 저장"
                  >
                    <Pin size={14} />
                    <span>PIN</span>
                  </button>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !isConnected}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Activity size={14} className={isLoading ? "animate-spin" : ""} />
                  <span>{isLoading ? "SCANNING..." : "DEEP ANALYZE"}</span>
                </button>
              </>
            )}
            {activePillar === "agent" && (
              <button
                onClick={clearChat}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-black hover:bg-white/10 hover:text-white/60 transition-all"
              >
                <Trash2 size={14} />
                <span>대화 초기화</span>
              </button>
            )}
            {activePillar === "feedback" && (
              <button className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black hover:bg-emerald-500/20 transition-all">
                <BookOpen size={14} />
                <span>SAVE EXCEPTION</span>
              </button>
            )}
          </div>
        </header>

        {/* Pillar Content */}
        <div className="flex-1 overflow-hidden p-6">
          <AnimatePresence mode="wait">

            {/* ── Analysis Pillar ── */}
            {activePillar === "analysis" && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {activeTab === "workspace" && (
                  <div className="h-full grid grid-cols-3 gap-5">
                    <div className="col-span-2 glass-card rounded-3xl flex flex-col overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GitBranch size={14} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                            Flow Canvas
                          </span>
                        </div>
                        {analysis?.analysis && (
                          <span className="text-[9px] text-white/20 font-mono italic">
                            Streaming active
                          </span>
                        )}
                      </div>
                      <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-[#050508]/40">
                        {analysis?.error ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-3">
                            <WifiOff size={40} className="text-red-400/40" />
                            <p className="text-xs text-red-400/60 text-center max-w-xs whitespace-pre-wrap">
                              {analysis.error}
                            </p>
                          </div>
                        ) : analysis?.analysis ? (
                          <div className="space-y-8">
                            {parseAnalysis(analysis.analysis).details.map((detail, idx) => (
                              <DetailFlowCard key={idx} detail={detail} />
                            ))}
                            {isLoading && (
                              <div className="flex flex-col items-center justify-center p-20 space-y-5 opacity-50">
                                <div className="relative">
                                  <RefreshCw size={40} className="animate-spin text-blue-400" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-blue-400">{elapsedTime}s</span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-[11px] font-black uppercase tracking-widest text-blue-400">Deep Analyzing Architecture...</p>
                                  <p className="text-[9px] text-white/40 mt-1">대규모 프로젝트 분석 시 수 분이 소요될 수 있습니다.</p>
                                  <div className="mt-4 flex items-center justify-center space-x-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-400 animate-ping" />
                                    <span className="text-[8px] text-blue-400/50 font-black uppercase tracking-tighter">Receiving Data Stream</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {!isLoading && parseAnalysis(analysis.analysis).details.length === 0 && analysis.analysis && (
                              <pre className="text-white/70 font-mono text-xs leading-loose whitespace-pre-wrap">
                                {analysis.analysis.split("```")[1] || analysis.analysis}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Code2 size={64} className="text-blue-400 mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-white">
                              Canvas Standby
                            </p>
                            <p className="text-[10px] text-white/50 mt-2">
                              DEEP ANALYZE 버튼을 눌러 시작하세요
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-5">
                      <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center space-x-2">
                          <BookOpen size={13} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                            Structural Guide
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 text-[12px] text-white/60 leading-relaxed custom-scrollbar bg-[#050508]/20">
                          {analysis?.analysis ? (
                            renderGuide(parseAnalysis(analysis.analysis).guide)
                          ) : (
                            <p className="opacity-40 italic text-white">분석 대기 중...</p>
                          )}
                        </div>
                      </div>

                      <div className="glass-card rounded-3xl p-5 space-y-3">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                          Pillar Details
                        </p>
                        <StatRow icon={<Database size={11} />} label="Depth" value="Project Recursive" />
                        <StatRow icon={<Code2 size={11} />} label="Language" value="Mixed · Multi-file" />
                        <StatRow icon={<Activity size={11} />} label="RAG" value="Active" />
                        {analysis?.provider && (
                          <StatRow
                            icon={<Cpu size={11} />}
                            label="Provider"
                            value={analysis.provider}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "masterflow" && (
                  <div className="h-full glass-card rounded-3xl flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                          Big Flow Chart (Master)
                        </span>
                      </div>
                      <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button 
                          onClick={() => setMasterViewMode("diagram")}
                          className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${masterViewMode === "diagram" ? "bg-yellow-400 text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                        >
                          Diagram
                        </button>
                        <button 
                          onClick={() => setMasterViewMode("code")}
                          className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${masterViewMode === "code" ? "bg-yellow-400 text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                        >
                          Code
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-[#050508]/40">
                      {analysis?.analysis ? (
                        <div className="max-w-5xl mx-auto space-y-8">
                          <div className="p-10 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-2xl">
                            <h3 className="text-lg font-black text-white/90 mb-8 flex items-center space-x-3">
                              <div className="w-1 h-6 rounded-full bg-yellow-400" />
                              <span>SYSTEM ARCHITECTURE MASTER PLAN</span>
                            </h3>
                            {masterViewMode === "diagram" ? (
                              <Mermaid chart={parseAnalysis(analysis.analysis).master} />
                            ) : (
                              <pre className="p-6 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs text-white/70 overflow-x-auto whitespace-pre">
                                {parseAnalysis(analysis.analysis).master}
                              </pre>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 h-full">
                          <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                            <Monitor size={40} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">Master Flow View</h3>
                            <p className="text-white/30 text-xs mt-1 max-w-sm">
                              전체 프로젝트 아키텍처 다이어그램이 여기에 표시됩니다. 분석을 시작해 주세요.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="h-full flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <History size={18} className="text-violet-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Analysis History</h3>
                      </div>
                      <span className="text-[10px] text-white/20 font-mono">{historyItems.length} Saved Items</span>
                    </div>
                    
                    {historyItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-5 overflow-y-auto pr-2 custom-scrollbar">
                        {historyItems.map((item) => (
                          <HistoryCard
                            key={item.id}
                            item={item}
                            onSelect={loadHistoryItem}
                            onDelete={deleteHistoryItem}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center glass-card rounded-3xl border-dashed">
                        <History size={48} className="text-white/5 mb-4" />
                        <p className="text-white/30 text-xs uppercase tracking-widest font-black">No History Yet</p>
                        <p className="text-[10px] text-white/10 mt-2">분석 완료 후 PIN 버튼을 눌러 저장하세요</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Agent Chat Pillar ── */}
            {activePillar === "agent" && (
              <motion.div
                key="agent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col"
              >
                <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden">
                  {/* Chat header info */}
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center">
                        <Sparkles size={13} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white/80">Archie-G Agent</p>
                        <p className="text-[9px] text-white/30">
                          {isConnected
                            ? `${selectedProvider === "ollama" ? "Ollama" : "LM Studio"} · ${selectedModel}`
                            : "오프라인"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isChatLoading
                            ? "bg-yellow-400 animate-pulse"
                            : isConnected
                            ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                            : "bg-red-400/50"
                        }`}
                      />
                      <span className="text-[9px] text-white/30 uppercase font-bold">
                        {isChatLoading ? "Thinking..." : isConnected ? "Ready" : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    {!isConnected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-8"
                      >
                        <div className="text-center space-y-3 opacity-50">
                          <WifiOff size={40} className="text-red-400 mx-auto" />
                          <p className="text-xs text-white/40">
                            LLM 에이전트가 연결되지 않았습니다
                          </p>
                          <p className="text-[10px] text-white/25">
                            좌측 패널에서 Ollama 또는 LM Studio를 연결해 주세요
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence initial={false}>
                      {chatMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-start space-x-3 ${
                            msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              msg.role === "user"
                                ? "bg-violet-500/20 border border-violet-500/30"
                                : "bg-gradient-to-br from-violet-600 to-rose-500"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <User size={13} className="text-violet-400" />
                            ) : (
                              <Bot size={13} className="text-white" />
                            )}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-violet-500/15 border border-violet-500/20 text-violet-100 rounded-tr-sm"
                                : "bg-white/[0.04] border border-white/[0.06] text-white/75 rounded-tl-sm"
                            }`}
                          >
                            {msg.isLoading ? (
                              <div className="flex items-center space-x-1 py-1">
                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggested Questions */}
                  {chatMessages.length <= 1 && isConnected && (
                    <div className="px-6 py-3 border-t border-white/5 flex flex-wrap gap-2 shrink-0">
                      {[
                        "WKWebView 브릿지 패턴이란?",
                        "Swift에서 비동기 처리 방법",
                        "하이브리드 앱 보안 고려사항",
                        "Android JavascriptInterface 사용법",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setChatInput(q);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/15 text-[10px] text-violet-300/60 hover:bg-violet-500/15 hover:text-violet-300 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input area */}
                  <div className="px-6 py-4 border-t border-white/5 shrink-0">
                    <div className="flex items-center space-x-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          isConnected
                            ? "아키텍처에 대해 질문하세요... (Enter로 전송)"
                            : "LLM 에이전트를 먼저 연결해 주세요"
                        }
                        disabled={!isConnected || isChatLoading}
                        className="flex-1 py-3 px-4 rounded-xl text-sm outline-none bg-white/[0.04] border border-white/[0.07] focus:border-violet-500/40 text-white placeholder:text-white/20 disabled:opacity-30 transition-all"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || !isConnected || isChatLoading}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                      >
                        <Send size={15} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Feedback Pillar ── */}
            {activePillar === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="h-full grid grid-cols-3 gap-5"
              >
                <div className="col-span-2 glass-card rounded-3xl flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center space-x-2">
                    <MessageSquare size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Exception Management
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <FeedbackMessage
                      text="Payment initialization order was corrected manually in analysis_drafts/Payment.draft.md. Saving as Regional Knowledge update."
                      tag="[FEEDBACK]"
                    />
                    <ExceptionCard
                      id={42}
                      title="Payment Init Order"
                      desc="Priority override applied for Bridge/* modules. Original source secondary."
                      status="SAVED"
                    />
                    <ExceptionCard
                      id={38}
                      title="Encryption Before Auth"
                      desc="encryptPayload() must precede authenticateUser() per user correction."
                      status="APPLIED"
                    />
                  </div>
                  <div className="px-6 py-4 border-t border-white/5">
                    <input
                      type="text"
                      placeholder="Add custom logic hint or correction..."
                      className="w-full py-3 px-4 rounded-xl text-xs outline-none bg-emerald-500/5 border border-emerald-500/10 focus:border-emerald-500/30 text-emerald-300 placeholder:text-white/15 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-5">
                  <div className="glass-card rounded-3xl p-5 flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Database size={13} className="text-emerald-400" />
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        Knowledge Graph
                      </p>
                    </div>
                    <div className="space-y-2">
                      <KnowledgeRow label="Total Exceptions" value="42" />
                      <KnowledgeRow label="Applied Rules" value="38" />
                      <KnowledgeRow label="Pending Review" value="4" />
                      <KnowledgeRow label="Modules Covered" value="Bridge/*" />
                    </div>
                  </div>
                  <div className="glass-card rounded-3xl p-5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">
                      Source Priority
                    </p>
                    <div className="space-y-2">
                      <PriorityBadge rank={1} label="User Feedback" color="emerald" />
                      <PriorityBadge rank={2} label="Library Guide" color="blue" />
                      <PriorityBadge rank={3} label="Source Code" color="violet" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────
type NavColor = "blue" | "violet" | "emerald";

function NavPillar({ icon, label, desc, isActive, onClick, color }: {
  icon: React.ReactNode; label: string; desc: string;
  isActive: boolean; onClick: () => void; color: NavColor;
}) {
  const colorMap: Record<NavColor, { text: string; bg: string; border: string }> = {
    blue:    { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
    violet:  { text: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  };
  const c = colorMap[color];
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all text-left border ${
        isActive
          ? `${c.bg} ${c.border} ${c.text}`
          : "text-white/30 hover:bg-white/5 hover:text-white/60 border-transparent"
      }`}
    >
      <div className={`shrink-0 ${isActive ? c.text : ""}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-wide truncate ${isActive ? c.text : ""}`}>
          {label}
        </p>
        <p className="text-[9px] text-white/25 truncate">{desc}</p>
      </div>
    </motion.button>
  );
}

function StatusRow({ label, value, dot }: { label: string; value: string; dot: string }) {
  const dotColor: Record<string, string> = {
    green:  "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]",
    yellow: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]",
    blue:   "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]",
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-white/30 font-bold uppercase">{label}</span>
      <div className="flex items-center space-x-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor[dot] || "bg-white/30"}`} />
        <span className="text-[9px] font-black text-white/60 uppercase">{value}</span>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1.5 text-white/30">{icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <span className="text-[10px] font-black text-white/60">{value}</span>
    </div>
  );
}

function FeedbackMessage({ text, tag }: { text: string; tag: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10"
    >
      <span className="inline-block mb-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase">
        {tag}
      </span>
      <p className="text-xs text-white/60 leading-relaxed">{text}</p>
    </motion.div>
  );
}

function ExceptionCard({ id, title, desc, status }: {
  id: number; title: string; desc: string; status: string;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] text-white/20 font-mono">#{id}</span>
          <span className="text-xs font-bold text-white/70">{title}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase">
          {status}
        </span>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

function KnowledgeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-white/30">{label}</span>
      <span className="text-[10px] font-black text-emerald-400">{value}</span>
    </div>
  );
}

function PriorityBadge({ rank, label, color }: { rank: number; label: string; color: NavColor }) {
  const ringColor: Record<NavColor, string> = {
    blue:    "text-blue-400 border-blue-500/30",
    violet:  "text-violet-400 border-violet-500/30",
    emerald: "text-emerald-400 border-emerald-500/30",
  };
  return (
    <div className={`flex items-center space-x-2 p-2 rounded-lg border ${ringColor[color]}`}>
      <span className={`text-[9px] font-black w-4 text-center ${ringColor[color].split(" ")[0]}`}>
        {rank}
      </span>
      <span className={`text-[10px] font-bold ${ringColor[color].split(" ")[0]}`}>{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
        active
          ? "bg-white/10 text-white shadow-lg"
          : "text-white/30 hover:text-white/60 hover:bg-white/5"
      }`}
    >
      <span className={active ? "text-violet-400" : ""}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

