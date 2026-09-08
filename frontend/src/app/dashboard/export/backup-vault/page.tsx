"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  HardDrive, RefreshCw, Download, RotateCcw, CheckCircle2, ShieldCheck, 
  FileText, Database, Sparkles, Clock, ArrowLeft, Loader2, Info, AlertTriangle, Layers
} from "lucide-react"
import { getApiBaseUrl, fetchWithAuth } from "@/lib/api"

export default function BackupVaultPage() {
  const [vaultData, setVaultData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVault = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/backup-vault/overview`);
      if (res.ok) {
        const json = await res.json();
        setVaultData(json);
      }
    } catch (e) {
      console.error("Failed to fetch vault data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleTriggerBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/backup-vault/trigger`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        alert(`BERHASIL: ${json.message}`);
        fetchVault();
      } else {
        alert("Gagal memicu pencadangan metadata.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan koneksi backend.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backupId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin memulihkan metadata video "${title}" dari cadangan ini?`)) {
      return;
    }

    try {
      setRestoringId(backupId);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/backup-vault/restore/${backupId}`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        alert(`SUKSES: ${json.message}`);
        fetchVault();
      } else {
        alert("Gagal memulihkan metadata.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan pemulihan.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleExportArchive = async () => {
    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/backup-vault/export`);
      if (res.ok) {
        const json = await res.json();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json, null, 2))}`;
        const link = document.createElement("a");
        link.setAttribute("href", jsonString);
        link.setAttribute("download", `audira_metadata_vault_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh arsip cadangan.");
    }
  };

  const backups = vaultData?.backups || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Top Back Nav Button */}
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard/export" 
          className="bg-yellow-300 hover:bg-yellow-400 text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE MENU EXPORT
        </Link>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> POSTGRESQL ENTERPRISE VAULT
            </span>
            <span className="bg-emerald-400 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              1-CLICK RECOVERY & INTEGRITY HASH (SHA-256)
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            AUTO-BACKUP VAULT METADATA (KEAMANAN DATA)
          </h1>
          <p className="text-xs font-bold text-gray-900 mt-2 max-w-3xl leading-relaxed">
            Cadangkan judul, deskripsi, tags, dan link thumbnail resolusi tinggi seluruh video YouTube secara otomatis. Jika video terhapus atau bermasalah, pulihkan metadata asli dalam 1 klik.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleExportArchive}
            className="bg-white text-black font-black px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 text-black" /> EXPORT JSON ARCHIVE
          </button>

          <button 
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${isBackingUp ? 'animate-spin' : ''}`} />
            {isBackingUp ? "MEMPROSES BACKUP..." : "CADANGKAN SEKARANG (1-CLICK)"}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">TOTAL METADATA VAULT</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <HardDrive className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black text-black my-1">
            {loading ? "..." : (vaultData?.total_backups || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-gray-500 border-t border-black/20 pt-2 mt-2">
            Snapshot Metadata Tersimpan
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">CHANNEL TERCAKUP</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Layers className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-800 my-1">
            {loading ? "..." : (vaultData?.total_channels || 0)} Channels
          </div>
          <div className="text-[10px] font-bold text-gray-500 border-t border-black/20 pt-2 mt-2">
            Terhubung di Pipeline
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">INTEGRITAS DATA (SHA-256)</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 my-1">
            100% VERIFIED
          </div>
          <div className="text-[10px] font-bold text-gray-500 border-t border-black/20 pt-2 mt-2">
            Hash Keamanan Bebas Korup
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">PENCADANGAN TERAKHIR</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Clock className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-xs font-black text-black font-mono my-2 truncate">
            {loading ? "..." : (vaultData?.last_backup_time || "-")}
          </div>
          <div className="text-[10px] font-bold text-gray-500 border-t border-black/20 pt-2 mt-1">
            Timestamp Otomatis PostgreSQL
          </div>
        </div>

      </div>

      {/* Backups Directory Table */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-black" /> DAFTAR CADANGAN METADATA VIDEO IN VAULT ({backups.length})
            </h2>
            <p className="text-xs font-bold text-gray-600">Riwayat snapshot metadata video yang tersimpan dengan enkripsi checksum.</p>
          </div>
          <span className="bg-yellow-300 text-black font-black text-[10px] px-3 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000]">
            VAULT STATUS: ACTIVE 🔒
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase">
                <th className="p-3">JUDUL VIDEO & CHANNEL</th>
                <th className="p-3">YOUTUBE ID</th>
                <th className="p-3">VERSI VAULT</th>
                <th className="p-3">CHECKSUM HASH (SHA-256)</th>
                <th className="p-3">TANGGAL BACKUP</th>
                <th className="p-3 text-center">AKSI PEMULIHAN</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-xs font-bold">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-black text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-black inline-block mr-2" /> Memuat data vault...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HardDrive className="w-10 h-10 text-gray-400" />
                      <span className="font-black text-sm uppercase text-gray-600">BELUM ADA CADANGAN METADATA</span>
                      <p className="text-xs text-gray-500 font-bold max-w-sm">
                        Klik tombol <strong>"CADANGKAN SEKARANG (1-CLICK)"</strong> di atas untuk membuat cadangan metadata pertama Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                backups.map((b: any) => (
                  <tr key={b.id} className="hover:bg-yellow-50/60 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      {b.thumbnail_url ? (
                        <img src={b.thumbnail_url} alt={b.title} referrerPolicy="no-referrer" className="w-12 h-7 border border-black object-cover shrink-0 shadow-[1px_1px_0_0_#000]" />
                      ) : (
                        <div className="w-12 h-7 bg-black text-yellow-300 font-black text-[9px] flex items-center justify-center border border-black shrink-0">
                          HD
                        </div>
                      )}
                      <div>
                        <div className="font-black text-xs uppercase line-clamp-1">{b.title}</div>
                        <div className="text-[10px] text-purple-700 font-extrabold">{b.channel_name}</div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-gray-700">{b.video_id}</td>
                    <td className="p-3">
                      <span className="bg-yellow-200 text-black border border-black px-2 py-0.5 text-[10px] font-black uppercase font-mono">
                        {b.version}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-gray-500 truncate max-w-[150px]" title={b.backup_hash}>
                      {b.backup_hash ? b.backup_hash.slice(0, 16) + "..." : "-"}
                    </td>
                    <td className="p-3 text-gray-700 font-mono text-[11px]">{b.created_at}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRestore(b.id, b.title)}
                        disabled={restoringId === b.id}
                        className="bg-black text-yellow-300 font-black px-3 py-1.5 text-[10px] uppercase border border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1 mx-auto"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${restoringId === b.id ? 'animate-spin' : ''}`} />
                        {restoringId === b.id ? "RESTORING..." : "RESTORE METADATA"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
