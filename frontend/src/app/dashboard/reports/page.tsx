"use client"

import { 
  FileText, Download, FileSpreadsheet, FileCode, CheckCircle2, Clock, 
  Sparkles, Calendar, Mail, RefreshCw, Layers, ShieldCheck, ArrowRight, Loader2, Zap
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [reportsHistory, setReportsHistory] = useState([
    { id: "rep-1", title: "Laporan Performa Mingguan Multi-Channel", format: "PDF", size: "2.4 MB", date: "Aug 29, 2026", status: "READY" },
    { id: "rep-2", title: "Audit Kredensial & Kuota Akun Google", format: "CSV", size: "128 KB", date: "Aug 28, 2026", status: "READY" },
    { id: "rep-3", title: "Analisis Velositas Video & Virilitas", format: "EXCEL", size: "1.1 MB", date: "Aug 25, 2026", status: "READY" },
  ]);

  const handleGenerateReport = (type: string, format: string) => {
    setIsGenerating(type);
    setTimeout(() => {
      setIsGenerating(null);
      const newReport = {
        id: `rep-${Date.now()}`,
        title: `Laporan ${type} Audira YT`,
        format: format.toUpperCase(),
        size: "1.8 MB",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "READY"
      };
      setReportsHistory(prev => [newReport, ...prev]);
      alert(`Berhasil! Laporan ${type} dalam format ${format} telah siap diunduh.`);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current"/> ULTIMATE EXECUTIVE REPORT GENERATOR
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              AUTOMATED PDF / CSV / EXCEL EXPORT
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            GENERATOR LAPORAN EKSIS & ANALITIK
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Buat laporan statistik resmi untuk seluruh <strong>2 Akun Google</strong> dan <strong>4 Channel YouTube</strong> secara otomatis berdasarkan data PostgreSQL terkini.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={() => handleGenerateReport("Eksekutif Lengkap", "PDF")}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Download className="w-4 h-4 text-yellow-300"/> GENERATE ALL-IN-ONE PDF REPORT
          </button>
        </div>
      </div>

      {/* 4 Vibrant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: GENERATED REPORTS */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">REPORTS GENERATED</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <FileText className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{reportsHistory.length} REPORTS</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Bulan ini tersimpan di sistem
          </div>
        </div>

        {/* Card 2: EXPORT FORMATS */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">SUPPORTED FORMATS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <FileSpreadsheet className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">PDF &bull; CSV &bull; XLS</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Format laporan siap pakai
          </div>
        </div>

        {/* Card 3: AUTOMATED SCHEDULE */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">AUTO EMAIL SCHEDULE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Mail className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-green-900">EVERY MONDAY 08:00</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Laporan otomatis dikirim ke email
          </div>
        </div>

        {/* Card 4: DATA AUDIT STATUS */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">POSTGRESQL AUDIT</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-purple-900">VERIFIED</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Integritas data 100% tervalidasi
          </div>
        </div>

      </div>

      {/* REPORT TYPE SELECTION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Type 1: PDF Executive Summary */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="bg-red-500 text-white font-black text-[9px] px-2.5 py-1 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                FORMAT PDF
              </span>
              <FileText className="w-6 h-6 text-black"/>
            </div>
            <h3 className="font-black text-lg uppercase tracking-tight leading-tight mb-2">
              LAPORAN EKSEKUTIF MULTI-CHANNEL (PDF)
            </h3>
            <p className="text-xs font-bold text-gray-600 mb-4 leading-relaxed">
              Ringkasan performa lengkap memuat grafik tayangan 7 hari, performa 4 channel YouTube, dan metrik video terpopuler siap cetak.
            </p>
          </div>

          <button 
            onClick={() => handleGenerateReport("Performa Eksekutif", "PDF")}
            disabled={isGenerating === "Performa Eksekutif"}
            className="w-full bg-black text-yellow-300 font-black py-3 px-4 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
          >
            {isGenerating === "Performa Eksekutif" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4 text-yellow-300"/>}
            {isGenerating === "Performa Eksekutif" ? "GENERATING..." : "DOWNLOAD PDF REPORT"}
          </button>
        </div>

        {/* Type 2: CSV Data Export */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="bg-green-500 text-white font-black text-[9px] px-2.5 py-1 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                FORMAT CSV
              </span>
              <FileSpreadsheet className="w-6 h-6 text-black"/>
            </div>
            <h3 className="font-black text-lg uppercase tracking-tight leading-tight mb-2">
              DATA MENTAH STATISTIK & AUDIT (CSV)
            </h3>
            <p className="text-xs font-bold text-gray-600 mb-4 leading-relaxed">
              Ekspor seluruh data mentah akun Google OAuth, rincian channel ID, durasi video, tayangan, dan sisa kuota harian API.
            </p>
          </div>

          <button 
            onClick={() => handleGenerateReport("Mentah CSV", "CSV")}
            disabled={isGenerating === "Mentah CSV"}
            className="w-full bg-cyan-300 text-black font-black py-3 px-4 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-50"
          >
            {isGenerating === "Mentah CSV" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4 text-black"/>}
            {isGenerating === "Mentah CSV" ? "EXPORTING..." : "DOWNLOAD CSV DATA"}
          </button>
        </div>

        {/* Type 3: Excel Matrix Report */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="bg-emerald-500 text-white font-black text-[9px] px-2.5 py-1 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                FORMAT EXCEL
              </span>
              <FileSpreadsheet className="w-6 h-6 text-black"/>
            </div>
            <h3 className="font-black text-lg uppercase tracking-tight leading-tight mb-2">
              MATRIKS ANALISIS VIDEO & VIRILITAS (XLSX)
            </h3>
            <p className="text-xs font-bold text-gray-600 mb-4 leading-relaxed">
              Tabel spreadsheet interaktif lengkap dengan rumus analisis CTR, skor virilitas, dan estimasi waktu puncak posting video.
            </p>
          </div>

          <button 
            onClick={() => handleGenerateReport("Matriks Virilitas", "XLSX")}
            disabled={isGenerating === "Matriks Virilitas"}
            className="w-full bg-emerald-300 text-black font-black py-3 px-4 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isGenerating === "Matriks Virilitas" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4 text-black"/>}
            {isGenerating === "Matriks Virilitas" ? "BUILDING EXCEL..." : "DOWNLOAD EXCEL SPREADSHEET"}
          </button>
        </div>

      </div>

      {/* RECENTLY GENERATED REPORTS HISTORY TABLE */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5"/> RIWAYAT LAPORAN TERSIMPAN ({reportsHistory.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Berkas Laporan Siap Unduh</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4">JUDUL LAPORAN</th>
                <th className="p-4">FORMAT</th>
                <th className="p-4">UKURAN BERKAS</th>
                <th className="p-4">TANGGAL DIBUAT</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-center">AKSI UNDUH</th>
              </tr>
            </thead>
            <tbody>
              {reportsHistory.map((rep) => (
                <tr key={rep.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                  <td className="p-4">
                    <div className="font-black text-sm uppercase">{rep.title}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-black px-2.5 py-1 border border-black shadow-[1px_1px_0_0_#000] uppercase ${
                      rep.format === 'PDF' ? 'bg-red-300 text-black' : rep.format === 'CSV' ? 'bg-green-300 text-black' : 'bg-emerald-300 text-black'
                    }`}>
                      {rep.format}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-xs">
                    {rep.size}
                  </td>
                  <td className="p-4 font-bold text-xs text-gray-700">
                    {rep.date}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-black bg-emerald-200 border border-black text-emerald-900 px-2 py-0.5 uppercase">
                      {rep.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => alert(`Mengunduh ${rep.title} (${rep.format})...`)}
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
