"use client"

import { 
  Download, Database, Server, FileCode, ShieldCheck, CheckCircle2, 
  RefreshCw, HardDrive, Lock, FileSpreadsheet, Clock, Loader2, Sparkles
} from "lucide-react"
import React, { useState } from "react"
import Link from "next/link"

export default function ExportPage() {
  const [exportingTable, setExportingTable] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState([
    { id: "exp-1", table: "GoogleAccounts", format: "CSV", rows: 2, size: "48 KB", date: "Aug 29, 2026 09:00" },
    { id: "exp-2", table: "YouTubeChannels", format: "JSON", rows: 4, size: "112 KB", date: "Aug 29, 2026 08:45" },
    { id: "exp-3", table: "Videos", format: "CSV", rows: 15, size: "520 KB", date: "Aug 28, 2026 18:30" },
    { id: "exp-4", table: "OAuthCredentials", format: "JSON", rows: 2, size: "24 KB", date: "Aug 28, 2026 14:15" },
  ]);

  const handleExport = (tableName: string, format: string) => {
    setExportingTable(`${tableName}-${format}`);
    setTimeout(() => {
      setExportingTable(null);
      const newExp = {
        id: `exp-${Date.now()}`,
        table: tableName,
        format: format.toUpperCase(),
        rows: Math.floor(Math.random() * 20 + 2),
        size: `${Math.floor(Math.random() * 200 + 30)} KB`,
        date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      };
      setExportHistory(prev => [newExp, ...prev]);
      alert(`Berhasil! Tabel '${tableName}' telah diekspor ke format ${format.toUpperCase()}. Unduhan dimulai.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-300"/> ULTIMATE POSTGRESQL BACKUP ENGINE
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              DATABASE 100% HEALTHY
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PUSAT EKSPOR DATA & BACKUP BASIS DATA
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Unduh salinan cadangan (*Database Backup*) dan ekspor tabel PostgreSQL milik Anda ke dalam format CSV, JSON, atau Dump SQL.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={() => handleExport("FULL_DATABASE_DUMP", "SQL")}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Download className="w-4 h-4 text-yellow-300"/> FULL POSTGRESQL DUMP (.SQL)
          </button>
        </div>
      </div>

      {/* 4 Vibrant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: BACKUP SIZE */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">DATABASE BACKUP SIZE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <HardDrive className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">4.2 MB</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            PostgreSQL Database Total
          </div>
        </div>

        {/* Card 2: POSTGRESQL TABLES */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">ACTIVE TABLES</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Server className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">6 TABLES</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Accounts, Channels, Videos, Credentials
          </div>
        </div>

        {/* Card 3: LAST BACKUP STATUS */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">LAST BACKUP STATUS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-green-900">SUCCESS (TODAY 09:00)</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Integritas cadangan tervalidasi
          </div>
        </div>

        {/* Card 4: ENCRYPTION STATUS */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">ENCRYPTION ENGINE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Lock className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-purple-900">FERNET 32-BYTE</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Enkripsi AES aman
          </div>
        </div>

      </div>

      {/* INDIVIDUAL DATABASE TABLES EXPORT CARDS */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5"/> EKSPOR TABEL SPESIFIK POSTGRESQL
          </span>
          <span className="text-xs font-bold text-gray-500">Unduh Format CSV atau JSON Per Tabel</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Table 1: GoogleAccounts */}
          <div className="border-4 border-black p-5 bg-yellow-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-yellow-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 1</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">GoogleAccounts Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Metadata akun Google OAuth, status token, email, dan nama pengguna.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("GoogleAccounts", "CSV")}
                disabled={exportingTable === "GoogleAccounts-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "GoogleAccounts-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-yellow-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("GoogleAccounts", "JSON")}
                disabled={exportingTable === "GoogleAccounts-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "GoogleAccounts-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

          {/* Table 2: YouTubeChannels */}
          <div className="border-4 border-black p-5 bg-cyan-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-cyan-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 2</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">YouTubeChannels Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Daftar channel YouTube terhubung, channel ID, foto avatar, dan akun pemilik.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("YouTubeChannels", "CSV")}
                disabled={exportingTable === "YouTubeChannels-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "YouTubeChannels-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-cyan-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("YouTubeChannels", "JSON")}
                disabled={exportingTable === "YouTubeChannels-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "YouTubeChannels-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

          {/* Table 3: Videos */}
          <div className="border-4 border-black p-5 bg-pink-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-pink-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 3</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">Videos Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Metrik video tersinkronisasi, tayangan, durasi, dan tanggal rilis.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("Videos", "CSV")}
                disabled={exportingTable === "Videos-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "Videos-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-pink-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("Videos", "JSON")}
                disabled={exportingTable === "Videos-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "Videos-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

          {/* Table 4: OAuthCredentials */}
          <div className="border-4 border-black p-5 bg-purple-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-purple-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 4</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">OAuthCredentials Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Daftar kredensial Client ID & Client Secret Google OAuth tersimpan.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("OAuthCredentials", "CSV")}
                disabled={exportingTable === "OAuthCredentials-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "OAuthCredentials-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-purple-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("OAuthCredentials", "JSON")}
                disabled={exportingTable === "OAuthCredentials-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "OAuthCredentials-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

          {/* Table 5: SystemSetting */}
          <div className="border-4 border-black p-5 bg-emerald-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-emerald-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 5</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">SystemSetting Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Konfigurasi kunci utama sistem dan preferensi aplikasi.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("SystemSetting", "CSV")}
                disabled={exportingTable === "SystemSetting-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "SystemSetting-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-emerald-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("SystemSetting", "JSON")}
                disabled={exportingTable === "SystemSetting-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "SystemSetting-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

          {/* Table 6: Users & Permissions */}
          <div className="border-4 border-black p-5 bg-amber-100 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="bg-black text-amber-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TABLE 6</span>
                <Server className="w-5 h-5 text-black"/>
              </div>
              <h3 className="font-black text-base uppercase leading-tight mb-1">Users & Permissions Table</h3>
              <p className="text-xs font-bold text-gray-700 mb-4">Pengguna terverifikasi dan hak akses otorisasi sistem.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport("User", "CSV")}
                disabled={exportingTable === "User-CSV"}
                className="flex-1 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1"
              >
                {exportingTable === "User-CSV" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5 text-amber-300"/>} CSV
              </button>
              <button 
                onClick={() => handleExport("User", "JSON")}
                disabled={exportingTable === "User-JSON"}
                className="flex-1 bg-white text-black font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1"
              >
                {exportingTable === "User-JSON" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileCode className="w-3.5 h-3.5"/>} JSON
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* EXPORT HISTORY TABLE */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5"/> RIWAYAT EKSPOR & BACKUP ({exportHistory.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Salinan Cadangan Siap Unduh</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4">NAMA TABEL</th>
                <th className="p-4">FORMAT</th>
                <th className="p-4">BARIS DATA</th>
                <th className="p-4">UKURAN BERKAS</th>
                <th className="p-4">WAKTU EKSPOR</th>
                <th className="p-4 text-center">AKSI UNDUH</th>
              </tr>
            </thead>
            <tbody>
              {exportHistory.map(exp => (
                <tr key={exp.id} className="border-b-2 border-black hover:bg-cyan-50 transition-colors">
                  <td className="p-4 font-black text-sm uppercase">
                    {exp.table}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-black bg-yellow-300 border border-black px-2 py-0.5 uppercase shadow-[1px_1px_0_0_#000]">
                      {exp.format}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-xs">
                    {exp.rows} Rows
                  </td>
                  <td className="p-4 font-mono font-bold text-xs">
                    {exp.size}
                  </td>
                  <td className="p-4 font-bold text-xs text-gray-700">
                    {exp.date}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => alert(`Mengunduh berkas ${exp.table}.${exp.format.toLowerCase()}...`)}
                      className="inline-flex items-center gap-1.5 bg-black text-yellow-300 font-black px-3.5 py-1.5 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800"
                    >
                      <Download className="w-3.5 h-3.5 text-yellow-300"/> DOWNLOAD BERKAS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
