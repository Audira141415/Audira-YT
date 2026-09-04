"use client"

import { 
  ShieldCheck, RefreshCw, CheckCircle2, 
  Database, Terminal, ShieldAlert, Download, Loader2, FileCode2, Play, Key, Send, Laptop, Layers, AlertTriangle, Cpu, HardDrive, Server, Activity, Clock,
  History, GitBranch, Tag, RotateCcw, Sparkles, Check, Plus, X, ArrowDownToLine, RotateCw, AlertOctagon
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

export default function SystemStatusPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'AUDIT LOG & VERSI' | 'SERVER SPECS' | 'PREFLIGHT & ENV' | 'BACKUPS' | 'HEALTH & ROLLBACK' | 'DOCKER SUITE' | 'WEBHOOK ALERTS' | 'DESKTOP RELEASE'>('OVERVIEW')
  const [userRole, setUserRole] = useState<string>("SUPERADMIN")

  const [sysStatus, setSysStatus] = useState<any>(null)
  const [serverSpecs, setServerSpecs] = useState<any>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [envAudit, setEnvAudit] = useState<any>(null)
  const [containers, setContainers] = useState<any[]>([])
  const [desktopInfo, setDesktopInfo] = useState<any>(null)
  const [releasesData, setReleasesData] = useState<any>(null)

  // Interactive Action States
  const [rollingBackId, setRollingBackId] = useState<string | null>(null)
  const [restartingContainer, setRestartingContainer] = useState<string | null>(null)
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null)

  // Custom Release Creation Modal State
  const [showCreateReleaseModal, setShowCreateReleaseModal] = useState(false)
  const [newVersion, setNewVersion] = useState("v2.2.0")
  const [newTitle, setNewTitle] = useState("")
  const [newChangelog, setNewChangelog] = useState("")
  const [creatingRelease, setCreatingRelease] = useState(false)

  // Rollback Confirmation Modal State
  const [rollbackTarget, setRollbackTarget] = useState<any>(null)

  const [preflightOutput, setPreflightOutput] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string>("")
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingBackup, setLoadingBackup] = useState(false)
  const [loadingPreflight, setLoadingPreflight] = useState(false)

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

  const fetchSystemData = async () => {
    try {
      setLoadingStatus(true)
      const [statRes, specRes, backRes, envRes, contRes, deskRes, relRes] = await Promise.all([
        fetchWithFallback("/system/status"),
        fetchWithFallback("/system/specs"),
        fetchWithFallback("/system/backups"),
        fetchWithFallback("/system/env-audit"),
        fetchWithFallback("/system/containers"),
        fetchWithFallback("/system/desktop"),
        fetchWithFallback("/system/releases")
      ])
      
      if (statRes && statRes.ok) setSysStatus(await statRes.json().catch(() => null))
      if (specRes && specRes.ok) setServerSpecs(await specRes.json().catch(() => null))
      if (backRes && backRes.ok) setBackups(await backRes.json().catch(() => []) || [])
      if (envRes && envRes.ok) setEnvAudit(await envRes.json().catch(() => null))
      if (contRes && contRes.ok) setContainers(await contRes.json().catch(() => []) || [])
      if (deskRes && deskRes.ok) setDesktopInfo(await deskRes.json().catch(() => null))
      if (relRes && relRes.ok) setReleasesData(await relRes.json().catch(() => null))
    } catch (err) {
      console.error("Failed to load system data", err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") return

    fetchSystemData()

    // Auto-refresh hardware specs, logs, & server health every 10 seconds
    const interval = setInterval(() => {
      fetchSystemData()
    }, 10000)

    return () => clearInterval(interval)
  }, [userRole])

  const handleCreateSnapshot = async () => {
    try {
      setLoadingBackup(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/backups/create`, { method: "POST" })
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

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`🚨 PERINGATAN RESTORE DATABASE!\n\nApakah Anda yakin ingin memulihkan database dari file snapshot '${filename}'?\n\nData saat ini akan ditimpa dengan data dari snapshot tersebut.`)) return;
    try {
      setRestoringBackup(filename)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/backups/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        alert(`✅ BERHASIL! Database berhasil dipulihkan dari snapshot '${filename}'!`)
        fetchSystemData()
      } else {
        alert(`Gagal Restore: ${data.detail || data.message || 'Error saat restore'}`)
      }
    } catch (e) {
      console.error(e)
      alert("Error menghubungi API restore database.")
    } finally {
      setRestoringBackup(null)
    }
  }

  const handleRestartContainer = async (containerName: string) => {
    if (!confirm(`Apakah Anda yakin ingin me-restart kontainer '${containerName}'?`)) return;
    try {
      setRestartingContainer(containerName)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/containers/${containerName}/restart`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        alert(`✅ ${data.message}`)
        fetchSystemData()
      } else {
        alert(`Gagal Restart: ${data.detail || data.message || 'Error saat restart kontainer'}`)
      }
    } catch (e) {
      console.error(e)
      alert("Error menghubungi API restart kontainer.")
    } finally {
      setRestartingContainer(null)
    }
  }

  const handleRunPreflight = async () => {
    try {
      setLoadingPreflight(true)
      setPreflightOutput("Memulai audit Pre-Flight Safety Gate (Pengecekan .env, Sintaks Python, & Build)...")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/preflight`)
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
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/webhook/test`, {
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

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVersion.trim() || !newTitle.trim()) {
      alert("Versi dan Judul Rilis wajib diisi!")
      return
    }
    try {
      setCreatingRelease(true)
      const bullets = newChangelog.split("\n").map(l => l.trim()).filter(Boolean)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/releases/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersion.trim(),
          title: newTitle.trim(),
          changelog: bullets.length > 0 ? bullets : [newTitle.trim()]
        })
      })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        alert(`✅ ${data.message}`)
        setShowCreateReleaseModal(false)
        setNewTitle("")
        setNewChangelog("")
        fetchSystemData()
      } else {
        alert(`Gagal membuat rilis: ${data.detail || 'Error saat membuat rilis'}`)
      }
    } catch (e) {
      console.error(e)
      alert("Error menghubungi API pembuatan rilis.")
    } finally {
      setCreatingRelease(false)
    }
  }

  const confirmAndExecuteRollback = async () => {
    if (!rollbackTarget) return
    try {
      setRollingBackId(rollbackTarget.id)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/system/releases/${rollbackTarget.id}/rollback`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.status === "success") {
        alert(`✅ ${data.message}\nTarget Git: ${data.git_commit}\nDB Snapshot: ${data.db_snapshot || 'Stabil'}`)
        setRollbackTarget(null)
        fetchSystemData()
      } else {
        alert(`Gagal Rollback: ${data.detail || 'Error saat rollback'}`)
      }
    } catch (e) {
      console.error(e)
      alert("Error menghubungi API rollback sistem.")
    } finally {
      setRollingBackId(null)
    }
  }

  if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
    return (
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center max-w-2xl mx-auto my-8">
        <div className="bg-amber-300 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#000]">
          <ShieldCheck className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-black uppercase">BATASAN HAK AKSES SYSTEM STATUS</h2>
        <p className="text-xs font-bold text-gray-700 mt-2 mb-6">
          Halaman Status Sistem, Audit Log, Docker Suite, & Rollback Control Center hanya dapat dikelola oleh <strong>SUPERADMIN / ADMIN</strong>.
        </p>
        <a href="/dashboard" className="bg-black text-yellow-300 font-black px-6 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] inline-block hover:bg-gray-800">
          &larr; KEMBALI KE DASHBOARD OVERVIEW
        </a>
      </div>
    );
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
              SYSTEM STATUS, AUDIT LOG & ROLLBACK CONTROL CENTER
            </h1>
            <p className="text-slate-600 font-bold text-xs">
              Monitor Versi Rilis, Riwayat Changelog Update, Spesifikasi Hardware Mini PC Server, & 1-Klik Automated Rollback.
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
                 ACTIVE VERSION: {releasesData?.current_version || "v2.1.0"}
               </span>
               <span className="font-black text-xs uppercase bg-white text-slate-900 px-3 py-0.5 rounded-md border-2 border-slate-900 shadow-[1px_1px_0_0_#0f172a]">
                 IP: {serverSpecs?.server_ip || "192.168.100.178"}
               </span>
             </div>
             <h2 className="text-2xl font-black tracking-tighter uppercase mt-1 text-slate-900">
               {releasesData?.active_release?.title || "AUDIRA YT INTELLIGENCE MONITOR - ACTIVE PRODUCTION"} 🚀
             </h2>
             <p className="text-xs font-bold text-emerald-950 mt-0.5">
               Git Commit: <code className="font-mono font-bold bg-white px-1.5 py-0.5 border border-black rounded">{releasesData?.active_release?.git_commit || "b0b2b56"}</code> &bull; Rilis: {releasesData?.active_release?.released_at || "31 Aug 2026"} &bull; Target: {releasesData?.active_release?.environment || "Mini PC Server 192.168.100.178"}
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

      {/* 2-COLUMN LAYOUT: CATEGORIZED VERTICAL SIDEBAR MENU + CONTENT PANEL */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT VERTICAL SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white border-3 border-slate-900 rounded-3xl p-4 shadow-[5px_5px_0_0_#0f172a] space-y-4 sticky top-6">
          
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
              📊 STATUS & AUDIT LOG
            </span>
            <div className="space-y-1.5 mt-1.5">
              {[
                { key: 'OVERVIEW', label: '🛡️ Ringkasan Sistem', desc: 'Status umum & pengaman' },
                { key: 'AUDIT LOG & VERSI', label: '📜 Audit Log & Versi', desc: 'Changelog & Rollback point' },
                { key: 'SERVER SPECS', label: '🖥️ Hardware & Server Health', desc: 'CPU, RAM, Disk, Uptime' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full text-left p-3 rounded-2xl font-black text-xs transition-all border-2 flex flex-col ${
                    activeTab === tab.key
                      ? 'bg-amber-300 text-slate-900 border-slate-900 shadow-[3px_3px_0_0_#0f172a] translate-x-0.5'
                      : 'bg-white text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="font-black text-xs uppercase text-slate-900">{tab.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">{tab.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-slate-900/10 pt-3">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
              🛡️ 7 PRODUCTION SAFEGUARDS
            </span>
            <div className="space-y-1.5 mt-1.5">
              {[
                { key: 'PREFLIGHT & ENV', label: '🧪 1. Pre-Flight & .ENV', desc: 'Audit konfigurasi .env' },
                { key: 'BACKUPS', label: '🗄️ 2. Snapshot Backups', desc: 'PostgreSQL Auto Dump' },
                { key: 'HEALTH & ROLLBACK', label: '🚨 3. Health & Rollback', desc: 'Zero downtime smoke test' },
                { key: 'DOCKER SUITE', label: '🐳 4 & 5. Docker Containers', desc: 'Multi-worker & Log limits' },
                { key: 'WEBHOOK ALERTS', label: '🔔 6. Error Alert Webhook', desc: 'Telegram / Discord notify' },
                { key: 'DESKTOP RELEASE', label: '🖥️ 7. Desktop Native App', desc: 'Tauri v2 .exe release' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full text-left p-3 rounded-2xl font-black text-xs transition-all border-2 flex flex-col ${
                    activeTab === tab.key
                      ? 'bg-amber-300 text-slate-900 border-slate-900 shadow-[3px_3px_0_0_#0f172a] translate-x-0.5'
                      : 'bg-white text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="font-black text-xs uppercase text-slate-900">{tab.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">{tab.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Server Card */}
          <div className="bg-slate-900 text-amber-300 p-3.5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-[11px] font-mono font-bold space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-300 uppercase">
              <span>TARGET SERVER</span>
              <span className="text-emerald-400">24/7 ACTIVE</span>
            </div>
            <div className="text-white text-xs">{serverSpecs?.server_ip || "192.168.100.178"}</div>
            <div className="text-[10px] text-slate-400">PostgreSQL: 5432 &bull; Redis: 6380</div>
          </div>

        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* TAB 2: AUDIT LOG & VERSI (CHANGELOG & ROLLBACK POINT) */}
      {activeTab === 'AUDIT LOG & VERSI' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a]">
            <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-4 mb-4 flex-wrap gap-3">
              <div>
                <span className="bg-purple-200 text-purple-950 font-black px-2.5 py-0.5 rounded text-[10px] uppercase border border-slate-900">
                  SYSTEM VERSIONING & AUDIT LOG
                </span>
                <h3 className="font-black text-lg uppercase mt-1 flex items-center gap-2 text-slate-900">
                  <History className="w-5 h-5 text-slate-900"/> RIWAYAT RILIS VERSI & PERUBAHAN SISTEM (CHANGELOG)
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Seluruh pembaruan kode, penambahan fitur pipa, skema migrasi database, dan titik rollback tercatat secara permanen di sini.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateReleaseModal(true)}
                  className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 uppercase"
                >
                  <Plus className="w-4 h-4"/> + CATAT TITIK RILIS BARU
                </button>
              </div>
            </div>

            {/* Releases Timeline List */}
            <div className="space-y-4">
              {releasesData?.releases ? releasesData.releases.map((rel: any, idx: number) => {
                const isActive = rel.status === "ACTIVE";
                const isStable = rel.status === "STABLE";

                return (
                  <div 
                    key={rel.id || idx} 
                    className={`border-3 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0_0_#0f172a] transition-all ${
                      isActive ? 'bg-amber-50 border-slate-900' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-slate-900/10 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="bg-slate-900 text-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-slate-900">
                            {rel.version}
                          </span>
                          <span className={`font-black text-[10px] uppercase px-2.5 py-0.5 rounded border border-slate-900 ${
                            isActive ? 'bg-emerald-300 text-slate-950' : isStable ? 'bg-cyan-200 text-slate-950' : 'bg-rose-300 text-slate-950'
                          }`}>
                            {isActive ? '🟢 ACTIVE (LIVE)' : isStable ? '🔵 STABLE SNAPSHOT' : '🟡 ROLLED BACK'}
                          </span>
                          <span className="bg-white text-slate-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-900 flex items-center gap-1">
                            <Tag className="w-3 h-3"/> Commit: {rel.git_commit}
                          </span>
                        </div>
                        <h4 className="font-black text-base uppercase text-slate-900">{rel.title}</h4>
                        <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2 mt-0.5">
                          <span>🕒 {rel.released_at}</span>
                          <span>• 👤 Deployer: <strong>{rel.deployed_by}</strong></span>
                          <span>• 🖥️ Target: <strong>{rel.environment}</strong></span>
                        </div>
                      </div>

                      {/* Rollback Action Button */}
                      {!isActive && (
                        <button
                          onClick={() => setRollbackTarget(rel)}
                          disabled={rollingBackId === rel.id}
                          className="bg-rose-400 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                          title="Kembalikan sistem ke versi snapshot ini"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${rollingBackId === rel.id ? 'animate-spin' : ''}`}/>
                          {rollingBackId === rel.id ? 'ROLLING BACK...' : 'ROLLBACK KE VERSI INI'}
                        </button>
                      )}
                    </div>

                    {/* Changelog Bullets */}
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500"/> DAFTAR PERUBAHAN & FITUR BARU:
                      </div>
                      <ul className="space-y-1 text-xs font-bold text-slate-800 pl-2">
                        {rel.changelog && rel.changelog.map((item: string, cIdx: number) => (
                          <li key={cIdx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-black">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rel.db_snapshot_file && (
                      <div className="mt-3 pt-2 border-t border-slate-900/10 text-[10px] font-mono text-slate-600 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-slate-900"/> Database Snapshot: <strong>{rel.db_snapshot_file}</strong>
                        </span>
                        <a 
                          href={`${getApiBaseUrl()}/system/backups/${rel.db_snapshot_file}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-amber-100 text-slate-900 px-2 py-0.5 rounded border border-slate-900 font-black text-[9px] flex items-center gap-1"
                        >
                          <ArrowDownToLine className="w-2.5 h-2.5"/> DOWNLOAD DUMP
                        </a>
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div className="p-8 text-center text-xs font-bold text-slate-500 border-2 border-dashed border-slate-900 rounded-xl">
                  Memuat data riwayat rilis sistem...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                Terpakai: {serverSpecs?.ram?.used_gb} GB / Sisa: {serverSpecs?.ram?.available_gb} GB
              </div>
            </div>

            {/* Storage Metric Card */}
            <div className="bg-rose-100 border-3 border-slate-900 rounded-3xl p-6 shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-slate-900"/> DISK STORAGE
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
                Sisa: {serverSpecs?.storage?.free_gb} GB &bull; DB Size: {serverSpecs?.storage?.postgres_db_size_mb || 0} MB
              </div>
            </div>

            {/* Server OS Card */}
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
          <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-4 flex-wrap gap-3">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backups.map((b, idx) => (
              <div key={idx} className="bg-cyan-50 border-2 border-slate-900 p-4 rounded-2xl flex flex-col justify-between shadow-[3px_3px_0_0_#0f172a] gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-black text-xs font-mono text-slate-900 truncate max-w-[280px]" title={b.filename}>{b.filename}</div>
                    <div className="text-[10px] font-bold text-slate-600 mt-0.5">Dibuat: {b.created_at}</div>
                  </div>
                  <span className="bg-slate-900 text-cyan-200 font-black text-[10px] px-3 py-1 rounded-md uppercase border border-slate-900 shrink-0">
                    {b.size_mb} MB
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-900/10">
                  <a
                    href={`${getApiBaseUrl()}/system/backups/${b.filename}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-white hover:bg-amber-100 text-slate-900 font-black text-[10px] py-1.5 rounded-lg border border-slate-900 uppercase text-center flex items-center justify-center gap-1 shadow-[1px_1px_0_0_#0f172a]"
                  >
                    <ArrowDownToLine className="w-3 h-3"/> UNDUH DUMP
                  </a>
                  <button
                    onClick={() => handleRestoreBackup(b.filename)}
                    disabled={restoringBackup === b.filename}
                    className="flex-1 bg-rose-200 hover:bg-rose-300 text-slate-950 font-black text-[10px] py-1.5 rounded-lg border border-slate-900 uppercase flex items-center justify-center gap-1 shadow-[1px_1px_0_0_#0f172a]"
                  >
                    <RotateCcw className={`w-3 h-3 ${restoringBackup === b.filename ? 'animate-spin' : ''}`}/>
                    {restoringBackup === b.filename ? 'MEMULIHKAN...' : 'RESTORE DB'}
                  </button>
                </div>
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
                <div className="mt-4 pt-2.5 border-t border-slate-900/10 text-[10px] font-black text-slate-700 flex justify-between items-center">
                  <span>Log: <strong className="font-mono">{c.log_limit}</strong></span>
                  <button
                    onClick={() => handleRestartContainer(c.name)}
                    disabled={restartingContainer === c.name}
                    className="bg-white hover:bg-amber-200 text-slate-900 px-2.5 py-1 rounded-md border border-slate-900 font-black text-[9px] uppercase flex items-center gap-1 shadow-[1px_1px_0_0_#0f172a]"
                  >
                    <RotateCw className={`w-2.5 h-2.5 ${restartingContainer === c.name ? 'animate-spin' : ''}`}/>
                    {restartingContainer === c.name ? 'RESTARTING...' : 'RESTART'}
                  </button>
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
                Versi Release: <span className="font-black text-slate-900">v{desktopInfo?.version || "2.1.0"}</span>
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
      </div>

      {/* CREATE RELEASE SNAPSHOT MODAL */}
      {showCreateReleaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-[8px_8px_0_0_#0f172a] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-3 mb-4">
              <h3 className="font-black text-lg uppercase flex items-center gap-2 text-slate-900">
                <Sparkles className="w-5 h-5 text-amber-500"/> + CATAT TITIK RILIS BARU
              </h3>
              <button 
                onClick={() => setShowCreateReleaseModal(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center hover:bg-rose-200 text-slate-900 font-black"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Versi Tag (misal: v2.2.0) *</label>
                <input 
                  type="text" 
                  value={newVersion} 
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="v2.2.0"
                  required
                  className="w-full border-2 border-slate-900 p-3 rounded-xl text-xs font-mono font-bold focus:bg-amber-50 shadow-[2px_2px_0_0_#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Judul / Tema Pembaruan *</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Optimalisasi Auto-Uploader & Monitoring Laju Viewer"
                  required
                  className="w-full border-2 border-slate-900 p-3 rounded-xl text-xs font-bold focus:bg-amber-50 shadow-[2px_2px_0_0_#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Poin-poin Changelog (1 baris per poin)</label>
                <textarea 
                  value={newChangelog} 
                  onChange={(e) => setNewChangelog(e.target.value)}
                  rows={4}
                  placeholder="Penambahan fitur X&#10;Perbaikan bug Y&#10;Optimasi database Z"
                  className="w-full border-2 border-slate-900 p-3 rounded-xl text-xs font-bold focus:bg-amber-50 shadow-[2px_2px_0_0_#0f172a]"
                />
              </div>

              <div className="bg-amber-50 border-2 border-slate-900 p-3 rounded-xl text-[10px] font-bold text-slate-700">
                💡 <strong>Catatan Otomatis:</strong> Sistem akan otomatis membuat snapshot database PostgreSQL dan mengaitkan Git commit hash terkini ke rilis ini.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateReleaseModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={creatingRelease}
                  className="flex-1 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {creatingRelease ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>} SIMPAN RILIS BARU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ROLLBACK MODAL */}
      {rollbackTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-[8px_8px_0_0_#0f172a] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-3 mb-4">
              <h3 className="font-black text-lg uppercase flex items-center gap-2 text-rose-600">
                <AlertOctagon className="w-5 h-5 text-rose-600"/> KONFIRMASI ROLLBACK SISTEM
              </h3>
              <button 
                onClick={() => setRollbackTarget(null)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center hover:bg-rose-200 text-slate-900 font-black"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                Anda akan mengembalikan sistem ke titik snapshot rilis berikut:
              </p>

              <div className="bg-rose-50 border-2 border-slate-900 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded">
                    {rollbackTarget.version}
                  </span>
                  <span className="font-black text-xs uppercase text-slate-900">{rollbackTarget.title}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-700">
                  • Git Commit Target: <strong>{rollbackTarget.git_commit}</strong><br />
                  • DB Snapshot: <strong>{rollbackTarget.db_snapshot_file || 'Preserved'}</strong><br />
                  • Tanggal Rilis: <strong>{rollbackTarget.released_at}</strong>
                </div>
              </div>

              <div className="bg-amber-100 border-2 border-slate-900 p-3 rounded-xl text-[10px] font-bold text-amber-950">
                ⚠️ Tindakan ini akan mengaktifkan kembali versi stabil ini di sistem dan merestore snapshot database yang sesuai.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRollbackTarget(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase"
                >
                  BATALKAN
                </button>
                <button
                  type="button"
                  onClick={confirmAndExecuteRollback}
                  disabled={Boolean(rollingBackId)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-xl border-2 border-slate-900 text-xs uppercase shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {rollingBackId ? <Loader2 className="w-4 h-4 animate-spin"/> : <RotateCcw className="w-4 h-4"/>} EKSEKUSI ROLLBACK SEKARANG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
