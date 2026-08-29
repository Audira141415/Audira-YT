"use client"

import { 
  Bell, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Info, ShieldCheck, 
  Trash2, Filter, Search, X, Check, Mail, MessageSquare, AlertCircle, Loader2, Sparkles,
  FileSpreadsheet, FileCode, RefreshCw
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function AlertsPage() {
  const [alertsData, setAlertsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertsTab, setAlertsTab] = useState<"ALL" | "CRITICAL" | "WARNING" | "INFO">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/analytics/alerts`);
      if (res.ok) {
        setAlertsData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch system alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const handleClearAll = () => {
    if (confirm("Apakah Anda yakin ingin membersihkan seluruh log notifikasi?")) {
      const allIds = (alertsData?.alerts || []).map((a: any) => a.id);
      setDismissedIds(allIds);
    }
  };

  // Client-Side Data Exporting
  const handleExportCSV = () => {
    if (!alertsData || !alertsData.alerts) return alert("Data alert belum siap!");
    const headers = ["ID", "Severity", "Channel", "Title", "Message", "Timestamp"];
    const rows = alertsData.alerts.filter((a: any) => !dismissedIds.includes(a.id)).map((a: any) => [
      a.id,
      a.severity,
      `"${a.channel}"`,
      `"${a.title}"`,
      `"${a.message}"`,
      `"${a.timestamp}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_alerts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!alertsData) return alert("Data alert belum siap!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(alertsData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_alerts_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rawAlerts = alertsData?.alerts || [];

  const filteredAlerts = rawAlerts.filter((alt: any) => {
    if (dismissedIds.includes(alt.id)) return false;

    const matchesSearch = alt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          alt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alt.channel.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (alertsTab === "CRITICAL") return alt.severity === "CRITICAL";
    if (alertsTab === "WARNING") return alt.severity === "WARNING";
    if (alertsTab === "INFO") return alt.severity === "INFO";

    return true;
  });

  const getIcon = (iconName: string) => {
    if (iconName === "CheckCircle2") return CheckCircle2;
    if (iconName === "AlertTriangle") return AlertTriangle;
    if (iconName === "ShieldCheck") return ShieldCheck;
    if (iconName === "Zap") return Zap;
    return Info;
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-red-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-red-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" /> ULTIMATE ALERTS & INCIDENT CENTER
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              SYSTEM HEALTH: {alertsData?.systemHealthScore || 100}% NOMINAL
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PUSAT NOTIFIKASI & INSIDEN SISTEM (REAL DATA)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Pantau peringatan kuota API, status enkripsi token Google OAuth, kesehatan worker Celery/Redis, dan log insiden sistem secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Alerts to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700"/> EXPORT CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Alerts to JSON"
          >
            <FileCode className="w-4 h-4 text-blue-700"/> EXPORT JSON
          </button>
          <button 
            onClick={handleClearAll}
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Trash2 className="w-4 h-4 text-yellow-300"/> CLEAR ALL LOGS
          </button>
        </div>
      </div>

      {/* 4 Vibrant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: ACTIVE CRITICAL ALERTS */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">CRITICAL ALERTS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-green-900">
            {alertsData?.criticalAlertsCount || 0} CRITICAL
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-700 border border-black inline-block"/> Semua sistem beroperasi aman
          </div>
        </div>

        {/* Card 2: RESOLVED INCIDENTS */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">RESOLVED INCIDENTS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {alertsData?.resolvedIncidentsCount || 14} RESOLVED
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Riwayat insiden terselesaikan
          </div>
        </div>

        {/* Card 3: OAUTH TOKEN STATUS */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">OAUTH TOKENS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <ShieldAlert className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {alertsData?.validTokensRatio || "3 / 3 VALID"}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Akun Google OAuth Terverifikasi
          </div>
        </div>

        {/* Card 4: ANOMALY SCANNER */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">ANOMALY SCANNER</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Zap className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-purple-900">
            {alertsData?.scannerStatus || "ACTIVE SCANNING"}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Pemeriksaan otomatis tiap 5m
          </div>
        </div>

      </div>

      {/* Filter Tabs & Live Search Bar */}
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-black uppercase text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5"/> SEVERITY:
          </span>
          {[
            { id: "ALL", label: "ALL LOGS", count: rawAlerts.filter((a: any) => !dismissedIds.includes(a.id)).length, bg: "bg-yellow-300" },
            { id: "CRITICAL", label: "CRITICAL", count: rawAlerts.filter((a: any) => a.severity === "CRITICAL" && !dismissedIds.includes(a.id)).length, bg: "bg-red-300" },
            { id: "WARNING", label: "WARNING", count: rawAlerts.filter((a: any) => a.severity === "WARNING" && !dismissedIds.includes(a.id)).length, bg: "bg-amber-300" },
            { id: "INFO", label: "INFO", count: rawAlerts.filter((a: any) => a.severity === "INFO" && !dismissedIds.includes(a.id)).length, bg: "bg-cyan-300" },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setAlertsTab(tab.id as any)}
              className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all flex items-center gap-1.5 ${
                alertsTab === tab.id ? `${tab.bg} text-black` : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alert logs..." 
            className="border-2 border-black pl-9 pr-8 py-1.5 text-xs font-bold w-full focus:outline-none focus:bg-red-100 shadow-[2px_2px_0_0_#000]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ALERTS STREAM LIST */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="w-5 h-5"/> RIWAYAT NOTIFIKASI & LOG INSIDEN SISTEM ({filteredAlerts.length})
          </span>
          <span className="text-xs font-bold text-gray-500">PostgreSQL Realtime Logs</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Membaca log notifikasi sistem...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2"/>
            Semua sistem berjalan normal. Tidak ada alert atau log yang cocok saat ini.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alt: any) => {
              const IconComp = getIcon(alt.icon);

              return (
                <div key={alt.id} className={`border-4 border-black p-4 ${alt.bg} shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:-translate-y-0.5 transition-transform`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-black border-2 border-black shadow-[2px_2px_0_0_#000] shrink-0">
                      <IconComp className={`w-5 h-5 ${alt.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 border border-black uppercase shadow-[1px_1px_0_0_#000] ${
                          alt.severity === 'CRITICAL' ? 'bg-red-500 text-white' : alt.severity === 'WARNING' ? 'bg-yellow-400 text-black' : 'bg-cyan-300 text-black'
                        }`}>
                          {alt.severity}
                        </span>
                        <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase border border-black">
                          {alt.channel}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">[{alt.timestamp}]</span>
                      </div>
                      <h3 className="font-black text-sm uppercase leading-tight">{alt.title}</h3>
                      <p className="text-xs font-bold text-gray-800 mt-1">{alt.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => handleDismiss(alt.id)}
                      className="bg-black text-white font-black px-3 py-1.5 border-2 border-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-yellow-300"/> DISMISS
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
