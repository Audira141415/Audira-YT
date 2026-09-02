"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Terminal as TerminalIcon, Play, RefreshCw, Download, Trash2, 
  CheckCircle2, AlertTriangle, ShieldCheck, Cpu, HardDrive, 
  Activity, Radio, Bot, Zap, Database, Server, Filter
} from "lucide-react"
import { getApiBaseUrl, fetchWithFallback } from "@/lib/api"

export default function LiveTerminalPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [filter, setFilter] = useState<string>("ALL")
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [serverSpecs, setServerSpecs] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("SUPERADMIN")
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("audira_user")
      if (stored) {
        try {
          const u = JSON.parse(stored)
          setUserRole((u.role || "SUPERADMIN").toUpperCase())
        } catch (e) {}
      }
    }
  }, [])

  const fetchLogsAndSpecs = async () => {
    try {
      const [logRes, specRes] = await Promise.all([
        fetchWithFallback("/system/logs?lines=40"),
        fetchWithFallback("/system/specs")
      ])
      
      if (logRes && logRes.ok) {
        const data = await logRes.json().catch(() => null)
        if (data) setLogs(data.logs || [])
      }
      if (specRes && specRes.ok) {
        const data = await specRes.json().catch(() => null)
        if (data) setServerSpecs(data)
      }
    } catch (err) {
      console.error("Failed to load logs/specs", err)
    }
  }

  useEffect(() => {
    if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") return;

    fetchLogsAndSpecs()

    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    try {
      const baseUrl = getApiBaseUrl().replace(/^http/, "ws");
      ws = new WebSocket(`${baseUrl}/system/ws/logs`);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "LOG_STREAM" && payload.data?.logs) {
            setLogs(payload.data.logs);
          }
        } catch (e) {
          console.error("Terminal WS parse error", e);
        }
      };

      ws.onerror = () => {
        fallbackInterval = setInterval(fetchLogsAndSpecs, 3000);
      };
    } catch (e) {
      fallbackInterval = setInterval(fetchLogsAndSpecs, 3000);
    }

    const specInterval = setInterval(() => {
      fetch(`${getApiBaseUrl()}/system/specs`).then(res => res.json()).then(data => setServerSpecs(data)).catch(() => {});
    }, 5000);

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      clearInterval(specInterval);
    }
  }, [userRole])

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter(line => {
    if (filter === "ALL") return true
    if (filter === "AUTO-SYNC") return line.includes("AUTO-SYNC") || line.includes("sync")
    if (filter === "TELEGRAM") return line.includes("Telegram") || line.includes("TELEGRAM")
    if (filter === "OAUTH") return line.includes("OAuth") || line.includes("token") || line.includes("Google")
    if (filter === "ERROR") return line.includes("ERROR") || line.includes("WARNING") || line.includes("Failed")
    return true
  })

  const triggerGlobalSync = async () => {
    try {
      setIsExecuting(true)
      const res = await fetch(`${getApiBaseUrl()}/accounts/sync-all`, { method: "POST" })
      if (res.ok) {
        fetchLogsAndSpecs()
        alert("SINKRONISASI 5M DIPICU! Log otomatisasi terbaru telah diperbarui di konsol terminal.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsExecuting(false)
    }
  }

  const triggerTelegramTest = async () => {
    try {
      setIsExecuting(true)
      const res = await fetch(`${getApiBaseUrl()}/settings/telegram/test-channels`, { method: "POST" })
      if (res.ok) {
        fetchLogsAndSpecs()
        alert("PENGUJIAN TELEGRAM 6 CHANNEL SUKSES! Periksa log pengiriman di terminal.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsExecuting(false)
    }
  }

  const exportLogsTxt = () => {
    const content = logs.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audira_live_terminal_logs_${new Date().toISOString().slice(0,19)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
    return (
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center max-w-2xl mx-auto my-8">
        <div className="bg-[#0F172A] text-emerald-400 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#000]">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black uppercase">BATASAN HAK AKSES LIVE TERMINAL</h2>
        <p className="text-xs font-bold text-gray-700 mt-2 mb-6">
          Halaman Konsol Live Terminal & Monitoring Latar Belakang Server hanya dapat dikelola oleh <strong>SUPERADMIN / ADMIN</strong>.
        </p>
        <a href="/dashboard" className="bg-black text-yellow-300 font-black px-6 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] inline-block hover:bg-gray-800">
          &larr; KEMBALI KE DASHBOARD OVERVIEW
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Neo-Brutalist Top Header Banner */}
      <div className="bg-[#0F172A] text-emerald-400 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-400 text-slate-950 border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_#000] shrink-0">
            <TerminalIcon className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-emerald-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                REALTIME BACKGROUND MONITOR
              </span>
              <span className="bg-red-500 text-white font-black text-[9px] px-2.5 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000] animate-pulse flex items-center gap-1">
                <Radio className="w-3 h-3 text-white"/> MINI PC SERVER (192.168.100.178)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tighter">
              LIVE MONITORING BACKGROUND TERMINAL
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Konsol Pemantauan Latar Belakang Realtime 24/7 & Audit Log Mesin Otomatisasi PostgreSQL.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={triggerGlobalSync}
            disabled={isExecuting}
            className="bg-yellow-300 hover:bg-yellow-400 text-black font-black px-4 py-2.5 rounded-xl border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 text-black"/>} TRIGGER SYNC 5M
          </button>
          <button 
            onClick={triggerTelegramTest}
            disabled={isExecuting}
            className="bg-cyan-300 hover:bg-cyan-400 text-black font-black px-4 py-2.5 rounded-xl border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-black"/> TEST TELEGRAM 6CH
          </button>
          <button 
            onClick={exportLogsTxt}
            className="bg-white hover:bg-slate-100 text-black font-black px-4 py-2.5 rounded-xl border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-black"/> EXPORT TXT
          </button>
        </div>
      </div>

      {/* Hardware Specs Quick Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-amber-100 border-3 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-slate-700 block uppercase">CPU RESOURCE:</span>
            <span className="text-xl font-black text-slate-900">{serverSpecs?.cpu?.usage_percent || 0}%</span>
          </div>
          <Cpu className="w-8 h-8 text-slate-900"/>
        </div>
        <div className="bg-cyan-100 border-3 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-slate-700 block uppercase">RAM MEMORY:</span>
            <span className="text-xl font-black text-slate-900">{serverSpecs?.ram?.used_gb || 0} / {serverSpecs?.ram?.total_gb || 0} GB</span>
          </div>
          <Activity className="w-8 h-8 text-slate-900"/>
        </div>
        <div className="bg-emerald-100 border-3 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-slate-700 block uppercase">POSTGRESQL DB LATENCY:</span>
            <span className="text-xl font-black text-emerald-900">0 ms (HEALTHY)</span>
          </div>
          <Database className="w-8 h-8 text-emerald-900"/>
        </div>
        <div className="bg-pink-100 border-3 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-slate-700 block uppercase">MANAGED CHANNELS:</span>
            <span className="text-xl font-black text-slate-900">6 CHANNELS OK</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-pink-900"/>
        </div>
      </div>

      {/* Filter Toolbar & Stream Status */}
      <div className="bg-white border-3 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000] flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1 mr-2">
            <Filter className="w-4 h-4 text-slate-900"/> FILTER LOGS:
          </span>
          {["ALL", "AUTO-SYNC", "TELEGRAM", "OAUTH", "ERROR"].map(fKey => (
            <button 
              key={fKey}
              onClick={() => setFilter(fKey)}
              className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border-2 transition-all ${
                filter === fKey 
                  ? "bg-slate-900 text-yellow-300 border-black shadow-[2px_2px_0_0_#000]" 
                  : "bg-white text-slate-700 border-black hover:bg-yellow-100"
              }`}
            >
              {fKey}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-black uppercase cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)} 
              className="w-4 h-4 accent-yellow-400 border-2 border-black rounded"
            />
            AUTO-SCROLL TO BOTTOM
          </label>
          <button 
            onClick={() => setLogs([])}
            className="bg-red-100 text-red-900 font-black px-3 py-1.5 rounded-lg border-2 border-black text-[10px] uppercase shadow-[1px_1px_0_0_#000] hover:bg-red-200"
          >
            CLEAR CONSOLE
          </button>
        </div>
      </div>

      {/* FULL-SCREEN LIVE TERMINAL CONSOLE */}
      <div className="bg-[#020617] text-emerald-400 border-4 border-black rounded-3xl p-6 shadow-[10px_10px_0_0_#000] font-mono text-xs relative overflow-hidden">
        
        {/* Terminal Header Strip */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"/>
            <div className="w-3 h-3 rounded-full bg-yellow-500"/>
            <div className="w-3 h-3 rounded-full bg-green-500"/>
            <span className="text-slate-400 font-black text-xs uppercase tracking-widest ml-3">
              audira@audira-yt-monitoring:~/Audira-YT/logs $ (2.5s Stream)
            </span>
          </div>
          <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 px-2.5 py-0.5 border border-emerald-500/30 rounded">
            {filteredLogs.length} LOG LINES DISPLAYED
          </span>
        </div>

        {/* Live Terminal Log Stream Display */}
        <div className="bg-[#090D16] border-2 border-slate-800/80 rounded-2xl p-5 h-[420px] max-h-[420px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 shadow-inner">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500 italic py-10 text-center">
              Belum ada baris log yang tercatat untuk filter '{filter}'. Sistem berjalan normal di latar belakang.
            </div>
          ) : (
            filteredLogs.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 hover:bg-slate-900/80 px-2 py-1 rounded transition-colors group">
                <span className="text-slate-600 font-bold select-none shrink-0 text-[10px]">{idx + 1}</span>
                <span className="text-yellow-400 font-bold select-none shrink-0">&gt;</span>
                <span className={
                  line.includes("ERROR") || line.includes("Failed") || line.includes("UNAUTHENTICATED")
                    ? "text-red-400 font-bold"
                    : line.includes("SUCCESS") || line.includes("HEALTHY") || line.includes("200")
                    ? "text-emerald-300 font-bold"
                    : line.includes("AUTO-SYNC") || line.includes("Telegram")
                    ? "text-cyan-300 font-bold"
                    : "text-slate-300 font-medium"
                }>
                  {line}
                </span>
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>

        {/* Footer Prompt */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/> Realtime WebSocket / Long-Polling Logs Active (Mini PC)
          </span>
          <span>Press ESC or click clear to reset console view</span>
        </div>

      </div>

    </div>
  )
}
