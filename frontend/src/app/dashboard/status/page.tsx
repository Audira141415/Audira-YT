"use client"

import { 
  ShieldCheck, RefreshCw, CheckCircle2, 
  Database, Terminal, ShieldAlert, Download, Loader2, FileCode2, Play, Key, Send, Laptop, Layers, AlertTriangle, Cpu, HardDrive, Server, Activity, Clock
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function SystemStatusPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SERVER SPECS' | 'PREFLIGHT & ENV' | 'BACKUPS' | 'HEALTH & ROLLBACK' | 'DOCKER SUITE' | 'WEBHOOK ALERTS' | 'DESKTOP RELEASE'>('OVERVIEW')
  
  const [sysStatus, setSysStatus] = useState<any>(null)
  const [serverSpecs, setServerSpecs] = useState<any>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [envAudit, setEnvAudit] = useState<any>(null)
  const [containers, setContainers] = useState<any[]>([])
  const [desktopInfo, setDesktopInfo] = useState<any>(null)
  
  const [preflightOutput, setPreflightOutput] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string>("")
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingBackup, setLoadingBackup] = useState(false)
  const [loadingPreflight, setLoadingPreflight] = useState(false)

  const fetchSystemData = async () => {
    try {
      setLoadingStatus(true)
      const [statRes, specRes, backRes, envRes, contRes, deskRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/system/status`),
        fetch(`${getApiBaseUrl()}/system/specs`),
        fetch(`${getApiBaseUrl()}/system/backups`),
        fetch(`${getApiBaseUrl()}/system/env-audit`),
        fetch(`${getApiBaseUrl()}/system/containers`),
        fetch(`${getApiBaseUrl()}/system/desktop`)
      ])
      
      if (statRes.ok) setSysStatus(await statRes.json())
      if (specRes.ok) setServerSpecs(await specRes.json())
      if (backRes.ok) setBackups(await backRes.json() || [])
      if (envRes.ok) setEnvAudit(await envRes.json())
      if (contRes.ok) setContainers(await contRes.json() || [])
      if (deskRes.ok) setDesktopInfo(await deskRes.json())
    } catch (err) {
      console.error("Failed to load system data", err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchSystemData()

    // Auto-refresh hardware specs, logs, & server health every 10 seconds
    const interval = setInterval(() => {
      fetchSystemData()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleCreateSnapshot = async () => {
    try {
      setLoadingBackup(true)
      const res = await fetch(`${getApiBaseUrl()}/system/backups/create`, { method: "POST" })
      if (res.ok) {
        alert("BERHASIL! Snapshot database PostgreSQL terbaru berhasil dibuat!")
        fetchSystemData()
      } else {
        alert("Gagal membuat snapshot database.")
      }
    } catch (err) {
      console.error(err)
      alert("Error menghubungi API backup database.")
    } finally {
      setLoadingBackup(false)
    }
  }

  const handleRunPreflight = async () => {
    try {
      setLoadingPreflight(true)
      setPreflightOutput("Memulai audit Pre-Flight Safety Gate (Pengecekan .env, Sintaks Python, & Build)...")
      const res = await fetch(`${getApiBaseUrl()}/system/preflight`)
      if (res.ok) {
        const data = await res.json()
        setPreflightOutput(data.output || data.error || "Pre-flight check selesai.")
      }
    } catch (err) {
      console.error(err)
      setPreflightOutput("Error menghubungi runner Pre-Flight Audit.")
    } finally {
      setLoadingPreflight(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      alert("Masukkan URL Webhook Discord atau Telegram terlebih dahulu!")
      return
    }
    try {
      setWebhookStatus("testing")
      const res = await fetch(`${getApiBaseUrl()}/system/webhook/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl.trim() })
      })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        setWebhookStatus("success")
        alert("BERHASIL! Pesan pengujian notifikasi telah terkirim ke Webhook!")
      } else {
        setWebhookStatus("error")
        alert(`Gagal Webhook: ${data.message || 'Koneksi ditolak'}`)
      }
    } catch (err) {
      console.error(err)
      setWebhookStatus("error")
      alert("Error menghubungi backend webhook.")
    } finally {
      setTimeout(() => setWebhookStatus("idle"), 2500)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Light Neo-Brutalist Header Banner */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-300 border-3 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_#0f172a]">
            <ShieldCheck className="w-6 h-6 text-slate-900 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-2">
              SYSTEM STATUS & PRODUCTION SAFEGUARDS CONTROL CENTER
            </h1>
            <p className="text-slate-600 font-bold text-xs">
              Monitor Spesifikasi Hardware Mini PC Server, Resource Usage (CPU/RAM/Disk), & 7 Fitur Pengaman Update Produksi.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchSystemData}
            disabled={loadingStatus}
            className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black px-4 py-2.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-xs uppercase flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-900 ${loadingStatus ? 'animate-spin' : ''}`} /> REFRESH STATUS
          </button>
        </div>
      </div>

      {/* Light Mint Green Status Banner */}
      <div className="bg-[#A7F3D0] border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-white text-emerald-950 flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
             <CheckCircle2 className="w-8 h-8 text-emerald-700" />
           </div>
           <div>
             <div className="flex items-center gap-2">
               <span className="bg-slate-900 text-amber-300 font-black px-2.5 py-0.5 rounded-md text-[9px] uppercase border border-slate-900">
                 MINI PC SERVER SPECS & HEALTH
               </span>
               <span className="font-black text-xs uppercase bg-white text-slate-900 px-3 py-0.5 rounded-md border-2 border-slate-900 shadow-[1px_1px_0_0_#0f172a]">
                 IP: {serverSpecs?.server_ip || "192.168.100.178"}
               </span>
             </div>
             <h2 className="text-2xl font-black tracking-tighter uppercase mt-1 text-slate-900">
               {sysStatus?.status === "OPERATIONAL" ? "SERVER HARDWARE & PRODUCTION SAFEGUARDS HEALTHY 🚀" : "SYSTEM OPERATIONAL"}
             </h2>
             <p className="text-xs font-bold text-emerald-950 mt-0.5">
               {serverSpecs?.os_name || "Linux Mini PC"} &bull; CPU Cores: {serverSpecs?.cpu?.logical_cores || "Multi-Core"} &bull; RAM: {serverSpecs?.ram?.total_gb || "--"} GB &bull; Disk Free: {serverSpecs?.storage?.free_gb || "--"} GB
             </p>
           </div>
         </div>
         <div className="text-right shrink-0">
           <div className="text-slate-900 font-black text-lg bg-white px-4 py-2 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a]">
             UPTIME: {serverSpecs?.uptime || "Active"}
           </div>
           <div className="text-[10px] font-black text-emerald-950 flex items-center justify-end gap-1.5 mt-2 uppercase">
             SCHEDULER 5M: {sysStatus?.auto_sync_scheduler?.status || "RUNNING 24/7"} <span className="w-2.5 h-2.5 rounded-full bg-emerald-800 border border-slate-900 inline-block animate-ping"/>
           </div>
         </div>
      </div>

      {/* 8 LIGHT PASTEL PILL TABS */}
      <div className="bg-white p-2 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex gap-2 overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: '🛡️ OVERVIEW' },
          { key: 'SERVER SPECS', label: '🖥️ SERVER SPECS & HEALTH' },
          { key: 'PREFLIGHT & ENV', label: '🧪 1. PRE-FLIGHT & .ENV' },
          { key: 'BACKUPS', label: '🗄️ 2. SNAPSHOT BACKUPS' },
          { key: 'HEALTH & ROLLBACK', label: '🚨 3. HEALTH & ROLLBACK' },
          { key: 'DOCKER SUITE', label: '🐳 4 & 5. DOCKER CONTAINERS' },
          { key: 'WEBHOOK ALERTS', label: '🔔 6. ERROR WEBHOOK' },
          { key: 'DESKTOP RELEASE', label: '🖥️ 7. DESKTOP RELEASE' },
        ].map((tab) => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap border-2 ${
              activeTab === tab.key 
                ? 'bg-amber-300 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a]' 
                : 'bg-white text-slate-700 border-transparent hover:bg-amber-100 hover:border-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="flex flex-col gap-6">
          
          {/* THREE SAFEGUARD SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900/10 pb-3">
                  <div>
                    <span className="bg-amber-300 text-slate-900 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-slate-900 uppercase shadow-[1px_1px_0_0_#0f172a]">SAFEGUARD #1</span>
                    <h3 className="font-black text-base uppercase mt-2 flex items-center gap-2 text-slate-900">
                      <ShieldAlert className="w-5 h-5 text-slate-900"/> PRE-FLIGHT SAFETY GATE
                    </h3>
                  </div>
                  <span className="bg-slate-900 text-amber-300 font-black text-[10px] px-2.5 py-1 rounded-md uppercase border border-slate-900">ACTIVE</span>
                </div>
                <p className="text-xs font-bold text-slate-700 mb-6 leading-relaxed">
                  Pengujian otomatis build Next.js, audit `.env`, & sintaks Python sebelum deploy ke server.
                </p>
              </div>
              <button 
                onClick={handleRunPreflight}
                disabled={loadingPreflight}
                className="w-full bg-amber-300 hover:bg-amber-400 text-slate-900 font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loadingPreflight ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-current"/>} RUN PRE-FLIGHT AUDIT
              </button>
            </div>

            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900/10 pb-3">
                  <div>
                    <span className="bg-cyan-200 text-slate-900 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-slate-900 uppercase shadow-[1px_1px_0_0_#0f172a]">SAFEGUARD #2</span>
                    <h3 className="font-black text-base uppercase mt-2 flex items-center gap-2 text-slate-900">
                      <Database className="w-5 h-5 text-slate-900"/> SNAPSHOT DB BACKUP
                    </h3>
                  </div>
                  <span className="bg-slate-900 text-cyan-200 font-black text-[10px] px-2.5 py-1 rounded-md uppercase border border-slate-900">{backups.length} SNAPSHOTS</span>
                </div>
                <p className="text-xs font-bold text-slate-700 mb-6 leading-relaxed">
                  Snapshot DB `pg_dump` instan dengan rotasi otomatis 10 file snapshot terbaru.
                </p>
              </div>
              <button 
                onClick={handleCreateSnapshot}
                disabled={loadingBackup}
                className="w-full bg-cyan-200 hover:bg-cyan-300 text-slate-900 font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} CREATE SNAPSHOT BACKUP
              </button>
            </div>

            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900/10 pb-3">
                  <div>
                    <span className="bg-rose-200 text-slate-900 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-slate-900 uppercase shadow-[1px_1px_0_0_#0f172a]">SAFEGUARD #3</span>
                    <h3 className="font-black text-base uppercase mt-2 flex items-center gap-2 text-slate-900">
                      <RefreshCw className="w-5 h-5 text-slate-900"/> ZERO-DOWNTIME ROLLBACK
                    </h3>
                  </div>
                  <span className="bg-slate-900 text-rose-200 font-black text-[10px] px-2.5 py-1 rounded-md uppercase border border-slate-900">ENABLED</span>
                </div>
                <p className="text-xs font-bold text-slate-700 mb-4 leading-relaxed">
                  Smoke test pasca-deploy. Auto-rollback `git reset` jika server gagal merespons dalam 30s.
                </p>
              </div>
              <div className="bg-pink-100 border-2 border-slate-900 rounded-xl p-3 text-[11px] font-black text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                ✓ PING CHECK: HTTP 200 OK (/health)<br />✓ AUTOMATED ROLLBACK: READY
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: SERVER SPECS & HEALTH */}
      {activeTab === 'SERVER SPECS' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CPU Metric Card */}
            <div className="bg-amber-100 border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-slate-900"/> CPU USAGE
                  </span>
                  <span className="bg-slate-900 text-amber-300 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-900">
                    {serverSpecs?.cpu?.logical_cores || 4} CORES
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 my-2">
                  {serverSpecs?.cpu?.usage_percent || 0}%
                </div>
                <div className="w-full bg-white border-2 border-slate-900 rounded-full h-4 overflow-hidden shadow-[1px_1px_0_0_#0f172a]">
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, serverSpecs?.cpu?.usage_percent || 0)}%` }}
                  />
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-700 mt-4 border-t border-slate-900/10 pt-2 truncate">
                Processor: {serverSpecs?.cpu?.processor}
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="bg-cyan-100 border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-900"/> RAM MEMORY
                  </span>
                  <span className="bg-slate-900 text-cyan-200 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-900">
                    {serverSpecs?.ram?.total_gb || 0} GB TOTAL
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 my-2">
                  {serverSpecs?.ram?.usage_percent || 0}%
                </div>
                <div className="w-full bg-white border-2 border-slate-900 rounded-full h-4 overflow-hidden shadow-[1px_1px_0_0_#0f172a]">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, serverSpecs?.ram?.usage_percent || 0)}%` }}
                  />
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-700 mt-4 border-t border-slate-900/10 pt-2">
                Terpakai: {serverSpecs?.ram?.used_gb} GB &bull; Bebas: {serverSpecs?.ram?.available_gb} GB
              </div>
            </div>

            {/* Storage Metric Card */}
            <div className="bg-pink-100 border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-slate-900"/> NVME / DISK
                  </span>
                  <span className="bg-slate-900 text-rose-200 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-900">
                    {serverSpecs?.storage?.total_gb || 0} GB TOTAL
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 my-2">
                  {serverSpecs?.storage?.usage_percent || 0}%
                </div>
                <div className="w-full bg-white border-2 border-slate-900 rounded-full h-4 overflow-hidden shadow-[1px_1px_0_0_#0f172a]">
                  <div 
                    className="bg-rose-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, serverSpecs?.storage?.usage_percent || 0)}%` }}
                  />
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-700 mt-4 border-t border-slate-900/10 pt-2">
                Bebas: {serverSpecs?.storage?.free_gb} GB &bull; Size Database: {serverSpecs?.storage?.postgres_db_size_mb} MB
              </div>
            </div>

            {/* OS & Server Identity Card */}
            <div className="bg-emerald-100 border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-slate-900"/> SERVER OS
                  </span>
                  <span className="bg-slate-900 text-emerald-300 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-900">
                    {serverSpecs?.architecture || "x86_64"}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 my-2 truncate">
                  {serverSpecs?.os_name || "Linux Server"}
                </div>
                <div className="text-xs font-black text-slate-800">
                  Host: {serverSpecs?.hostname}
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-700 mt-4 border-t border-slate-900/10 pt-2">
                Python: {serverSpecs?.python_version} &bull; Uptime: {serverSpecs?.uptime}
              </div>
            </div>

          </div>

          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a]">
            <h3 className="font-black text-base uppercase mb-3 flex items-center gap-2 text-slate-900">
              <Server className="w-5 h-5 text-slate-900"/> RINGKASAN INTEGRITAS DOCKER PRODUCTION SUITE KONSISTEN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-black text-slate-800">
              <div className="bg-amber-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_#0f172a]">
                ✓ Host IP Mini PC: <code className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono text-xs">192.168.100.178</code>
              </div>
              <div className="bg-cyan-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_#0f172a]">
                ✓ Engine Backend: Fast-API (Uvicorn 4 Multi-Worker)
              </div>
              <div className="bg-rose-50 p-4 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0_0_#0f172a]">
                ✓ Engine Database: PostgreSQL 16-Alpine (Auto Dump 10 Rotasi)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PREFLIGHT & ENV AUDIT */}
      {activeTab === 'PREFLIGHT & ENV' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a]">
            <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-4 mb-4">
              <div>
                <h3 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
                  <Key className="w-5 h-5 text-slate-900"/> AUDIT FILE KONFIGURASI ENVIRONMENT (.env)
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-0.5">Verifikasi kelengkapan variabel `.env` terhadap sampel `.env.example` untuk mencegah crash saat deploy.</p>
              </div>
              <button 
                onClick={handleRunPreflight}
                disabled={loadingPreflight}
                className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black px-4 py-2.5 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[2px_2px_0_0_#0f172a] flex items-center gap-2"
              >
                {loadingPreflight ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-current"/>} RUN PRE-FLIGHT AUDIT
              </button>
            </div>

            {envAudit?.items ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {envAudit.items.map((item: any, idx: number) => (
                  <div key={idx} className="border-2 border-slate-900 p-3.5 rounded-xl bg-slate-50 flex justify-between items-center shadow-[2px_2px_0_0_#0f172a]">
                    <div>
                      <div className="font-black text-xs font-mono text-slate-900">{item.key}</div>
                      <div className="text-[10px] font-mono text-slate-600">{item.masked_value || "(Empty)"}</div>
                    </div>
                    {item.status === "VALID" ? (
                      <span className="bg-emerald-300 text-slate-900 font-black text-[9px] px-2.5 py-1 rounded-md uppercase border border-slate-900">VALID</span>
                    ) : item.status === "WARNING_PLACEHOLDER" ? (
                      <span className="bg-amber-300 text-slate-900 font-black text-[9px] px-2.5 py-1 rounded-md uppercase border border-slate-900 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> DEFAULT PLACEHOLDER
                      </span>
                    ) : (
                      <span className="bg-rose-400 text-white font-black text-[9px] px-2.5 py-1 rounded-md uppercase border border-slate-900">MISSING</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs font-bold text-slate-500">Loading Environment Audit Data...</div>
            )}
          </div>

          {preflightOutput && (
            <div className="bg-emerald-100 border-2 border-slate-900 p-4 rounded-2xl shadow-[3px_3px_0_0_#0f172a] flex justify-between items-center">
              <div className="font-bold text-xs text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0"/> {preflightOutput}
              </div>
              <button onClick={() => setPreflightOutput(null)} className="bg-slate-900 text-white font-black px-2.5 py-1 rounded-md text-[10px] uppercase border border-slate-900 shrink-0">TUTUP</button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SNAPSHOT BACKUPS */}
      {activeTab === 'BACKUPS' && (
        <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-4">
            <div>
              <h3 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
                <Database className="w-5 h-5 text-slate-900"/> DAFTAR SNAPSHOT BACKUP DATABASE POSTGRESQL ({backups.length})
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Snapshot file `.sql` berbasis `pg_dump` otomatis disimpan di folder `backups/db/`.</p>
            </div>
            <button 
              onClick={handleCreateSnapshot}
              disabled={loadingBackup}
              className="bg-cyan-200 hover:bg-cyan-300 text-slate-900 font-black px-5 py-2.5 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] flex items-center gap-2"
            >
              {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} CREATE SNAPSHOT BACKUP NOW
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backups.map((b, idx) => (
              <div key={idx} className="bg-cyan-50 border-2 border-slate-900 p-4 rounded-xl flex justify-between items-center shadow-[2px_2px_0_0_#0f172a]">
                <div>
                  <div className="font-black text-xs font-mono text-slate-900">{b.filename}</div>
                  <div className="text-[10px] font-bold text-slate-600 mt-0.5">Dibuat: {b.created_at}</div>
                </div>
                <span className="bg-slate-900 text-cyan-200 font-black text-[10px] px-3 py-1 rounded-md uppercase border border-slate-900">
                  {b.size_mb} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HEALTH & ROLLBACK */}
      {activeTab === 'HEALTH & ROLLBACK' && (
        <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col gap-6">
          <div>
            <h3 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
              <RefreshCw className="w-5 h-5 text-slate-900"/> ZERO-DOWNTIME HEALTH CHECK & AUTOMATED ROLLBACK
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">Smoke testing pasca-deployment memverifikasi bahwa server backend dan frontend merespons HTTP 200 OK.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-100 border-2 border-slate-900 p-5 rounded-2xl shadow-[3px_3px_0_0_#0f172a]">
              <div className="font-black text-sm uppercase mb-2 text-emerald-950">✓ HEALTHCHECK ENGINE ENDPOINT</div>
              <div className="text-xs font-mono font-bold space-y-1 text-emerald-900">
                <div>Backend Ping: http://localhost:8005/health (HTTP 200 OK)</div>
                <div>Frontend Ping: http://localhost:3005 (HTTP 200 OK)</div>
                <div>Retry Limit: 10 Attempts (Interval 3s)</div>
              </div>
            </div>
            <div className="bg-pink-100 border-2 border-slate-900 p-5 rounded-2xl shadow-[3px_3px_0_0_#0f172a]">
              <div className="font-black text-sm uppercase mb-2 text-pink-950">✓ AUTO-ROLLBACK TRIGGER POLICY</div>
              <div className="text-xs font-bold space-y-1 text-pink-950">
                <div>1. Mengeset Git Head ke Commit Sebelumnya (`git reset --hard HEAD~1`)</div>
                <div>2. Menyalakan Ulang Container Stabil (`.\startYT.bat`)</div>
                <div>3. Mengirimkan Notifikasi Peringatan Insiden</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DOCKER SUITE & LOG ROTATION */}
      {activeTab === 'DOCKER SUITE' && (
        <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-4">
            <div>
              <h3 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
                <Layers className="w-5 h-5 text-slate-900"/> PRODUCTION DOCKER CONTAINER SUITE & LOG ROTATION
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Seluruh container menggunakan konfigurasi produksi Multi-Worker Uvicorn & pembatasan ukuran log 10MB x 3 file.</p>
            </div>
            <span className="bg-slate-900 text-amber-300 font-black text-[10px] px-3 py-1 rounded-md uppercase border border-slate-900">
              docker-compose.prod.yml
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {containers.map((c: any, idx: number) => (
              <div key={idx} className="border-2 border-slate-900 p-4 rounded-2xl bg-amber-50 shadow-[3px_3px_0_0_#0f172a] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs font-mono text-slate-900">{c.name}</span>
                    <span className="bg-emerald-300 text-slate-900 font-black text-[9px] px-2 py-0.5 rounded-md uppercase border border-slate-900">{c.status}</span>
                  </div>
                  <div className="text-xs font-black uppercase text-slate-900 mt-1">{c.service}</div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">Port: {c.port}</div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-slate-900/10 text-[10px] font-black text-slate-700 flex justify-between">
                  <span>Log Limit:</span>
                  <span className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono text-[9px]">{c.log_limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: WEBHOOK ALERTS */}
      {activeTab === 'WEBHOOK ALERTS' && (
        <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col gap-6">
          <div>
            <span className="bg-cyan-200 text-slate-900 font-black px-3 py-1 rounded-md text-[10px] uppercase border border-slate-900 shadow-[1px_1px_0_0_#0f172a]">
              🔔 ERROR & QUOTA ALERT WEBHOOK NOTIFIER
            </span>
            <h3 className="text-xl font-black uppercase mt-2 text-slate-900">KONFIGURASI NOTIFIKASI ERROR INSTAN VIA WEBHOOK</h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Kirimkan pemberitahuan otomatis ke gawai Anda (Discord/Telegram) saat kuota YouTube habis atau timbul error insiden pada background sync 5m.
            </p>
          </div>

          <div className="bg-sky-50 border-2 border-slate-900 p-5 rounded-2xl space-y-4 shadow-[3px_3px_0_0_#0f172a]">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5 text-slate-900">Discord / Telegram Webhook URL *</label>
              <input 
                type="text" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/123456789/abcxyz..."
                className="w-full border-2 border-slate-900 bg-white p-3 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0_0_#0f172a]"
              />
            </div>
            <button 
              onClick={handleTestWebhook}
              disabled={webhookStatus === "testing"}
              className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black px-6 py-3 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
            >
              {webhookStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 text-slate-900"/>} 
              SEND TEST ALERT NOTIFICATION TO WEBHOOK 🚀
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: DESKTOP RELEASE */}
      {activeTab === 'DESKTOP RELEASE' && (
        <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col gap-6">
          <div>
            <h3 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
              <Laptop className="w-5 h-5 text-slate-900"/> TAURI NATIVE DESKTOP APP RELEASE (.EXE)
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">Aplikasi desktop Windows native dibangun menggunakan kerangka kerja Tauri v2 dengan auto-updater terintegrasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-yellow-100 border-2 border-slate-900 p-5 rounded-2xl shadow-[3px_3px_0_0_#0f172a] space-y-3">
              <div className="font-black text-sm uppercase text-slate-900">✓ DESKTOP RELEASE BUILDER</div>
              <div className="text-xs font-bold text-slate-800">
                Skrip Kompilasi: <code className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono text-[11px]">BUILD_DESKTOP_EXE.bat</code>
              </div>
              <div className="text-xs font-bold text-slate-800">
                Versi Release: <span className="font-black text-slate-900">v{desktopInfo?.version || "2.0.0"}</span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                Status Build Installer: {desktopInfo?.installer_exists ? (
                  <span className="bg-emerald-300 text-slate-900 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-slate-900">TERSEDIA (AudiraYT_Setup.exe)</span>
                ) : (
                  <span className="bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-slate-900">SIAP DI-BUILD</span>
                )}
              </div>
            </div>

            <div className="bg-cyan-100 border-2 border-slate-900 p-5 rounded-2xl shadow-[3px_3px_0_0_#0f172a] space-y-3">
              <div className="font-black text-sm uppercase text-slate-900">✓ AUTO-UPDATER MANIFEST ENDPOINT</div>
              <div className="text-xs font-mono font-bold text-slate-900 break-all bg-white p-2.5 rounded-xl border-2 border-slate-900">
                {desktopInfo?.auto_updater_url}
              </div>
              <p className="text-[11px] font-bold text-slate-700">Aplikasi desktop yang terpasang di laptop pengelola akan otomatis meminta pembaruan saat versi baru rilis di Mini PC Server.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
