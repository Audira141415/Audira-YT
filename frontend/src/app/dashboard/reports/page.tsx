"use client"

import { 
  FileText, Download, FileSpreadsheet, FileCode, CheckCircle2, Clock, 
  Sparkles, Calendar, Mail, RefreshCw, Layers, ShieldCheck, ArrowRight, Loader2, Zap,
  DollarSign, PieChart, Users, TrendingUp, ChevronRight
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl, fetchWithFallback } from "@/lib/api"

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, financialRes] = await Promise.all([
        fetchWithFallback("/analytics/reports"),
        fetchWithFallback("/reports/financial-breakdown")
      ]);

      if (analyticsRes && analyticsRes.ok) {
        const data = await analyticsRes.json();
        setReportsData(data);
        setReportsHistory(data.reportsHistory || []);
      }
      if (financialRes && financialRes.ok) {
        const finData = await financialRes.json();
        setFinancialData(finData);
      }
    } catch (err) {
      console.error("Failed to fetch reports analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleDownloadCsv = () => {
    window.open(`${getApiBaseUrl()}/reports/export/csv`, '_blank');
  };

  const handleGenerateReport = async (type: string, format: string) => {
    try {
      setIsGenerating(type);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      let content = "";
      let filename = `audira_financial_royalty_report_${dateStr}.csv`;

      const summary = financialData?.summary || {};
      const channels = financialData?.channels || [];

      if (format === "CSV" || format === "XLSX") {
        const headers = ["Channel Name", "Total Views", "Gross Revenue (IDR)", "YouTube Share 45% (IDR)", "Net Payout (IDR)", "Creator Royalty 70% (IDR)", "Label Share 20% (IDR)"];
        const rows = channels.map((c: any) => [
          `"${c.channel_name}"`,
          c.total_views,
          c.gross_revenue_idr,
          c.youtube_cut_idr,
          c.net_payout_idr,
          c.creator_share_idr,
          c.label_share_idr
        ]);

        content = "data:text/csv;charset=utf-8," + [
          "AUDIRA YT INTELLIGENCE MONITOR - ENTERPRISE FINANCIAL REPORT",
          `Generated At: ${new Date().toLocaleString()}`,
          "",
          headers.join(","),
          ...rows.map((r: any) => r.join(","))
        ].join("\n");
      } else {
        filename = `audira_executive_summary_${dateStr}.txt`;
        content = "data:text/plain;charset=utf-8," + encodeURIComponent(
          `========== LAPORAN FINANSIAL EKSEKUTIF AUDIRA YT (${dateStr}) ==========\n` +
          `Total Tayangan Monitored: ${(summary.total_views || 0).toLocaleString()} Views\n` +
          `Gross Revenue Estimate (IDR): Rp ${(summary.gross_estimated_revenue_idr || 0).toLocaleString()}\n` +
          `YouTube Platform Share 45% (IDR): -Rp ${(summary.youtube_platform_cut_idr || 0).toLocaleString()}\n` +
          `Pajak Penghasilan 10% (IDR): -Rp ${(summary.tax_deduction_idr || 0).toLocaleString()}\n` +
          `NET REVENUE DISTRIBUTABLE (IDR): Rp ${(summary.net_distributable_revenue_idr || 0).toLocaleString()}\n` +
          `-----------------------------------------------------------------------\n` +
          `Royalty Split Creator (70%): Rp ${(summary.royalty_split?.creator_payout_idr || 0).toLocaleString()}\n` +
          `Royalty Split Label (20%): Rp ${(summary.royalty_split?.label_payout_idr || 0).toLocaleString()}\n` +
          `=======================================================================\n`
        );
      }

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(content));
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const newReport = {
        id: `rep-${Date.now()}`,
        title: `Laporan ${type} Audira YT`,
        format: format.toUpperCase(),
        size: "2.4 MB",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "READY"
      };
      setReportsHistory(prev => [newReport, ...prev]);

    } catch (err) {
      console.error("Report generation failed", err);
      alert("Gagal mengunduh berkas laporan.");
    } finally {
      setIsGenerating(null);
    }
  };

  const summary = financialData?.summary || {};
  const channelsList = financialData?.channels || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current"/> ULTIMATE FINANCIAL & ROYALTY SPLIT ENGINE
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              NET VS GROSS REVENUE BREAKDOWN
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            LAPORAN FINANSIAL & ROYAKTI ARTIS (ENTERPRISE)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Hitung perkiraan pendapatan kotor (Gross Revenue), potongan platform YouTube (45%), estimasi pajak, dan pembagian royalti kreator/label secara transparan.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleDownloadCsv}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Download className="w-4 h-4 text-yellow-300"/> DOWNLOAD CSV FINANCIAL REPORT
          </button>
        </div>
      </div>

      {/* FINANCIAL SUMMARY HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: GROSS ESTIMATED REVENUE */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">GROSS REVENUE ESTIMATE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <DollarSign className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tighter my-1 text-slate-900">
            Rp {(summary.gross_estimated_revenue_idr || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-gray-500 uppercase">
            Sebelum potongan YouTube (100%)
          </div>
        </div>

        {/* Card 2: YOUTUBE PLATFORM SHARE */}
        <div className="bg-rose-100 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">YOUTUBE SHARE (45%)</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <PieChart className="w-4 h-4 text-rose-300" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tighter my-1 text-rose-900">
            -Rp {(summary.youtube_platform_cut_idr || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-rose-800 uppercase">
            Potongan platform Shorts/Longform
          </div>
        </div>

        {/* Card 3: NET DISTRIBUTABLE REVENUE */}
        <div className="bg-emerald-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">NET DISTRIBUTABLE REVENUE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tighter my-1 text-emerald-950">
            Rp {(summary.net_distributable_revenue_idr || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-emerald-900 uppercase">
            Bersih setelah pajak 10%
          </div>
        </div>

        {/* Card 4: CREATOR ROYALTY SHARE (70%) */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">CREATOR PAYOUT (70%)</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Users className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tighter my-1 text-purple-950">
            Rp {(summary.royalty_split?.creator_payout_idr || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-purple-900 uppercase">
            Total royalti kreator/artis
          </div>
        </div>

      </div>

      {/* ROYALTY BREAKDOWN TABLE PER CHANNEL */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-5 h-5"/> RINCIAN ROYAKTI PER CHANNEL & KREATOR ({channelsList.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Perhitungan Transparan Net vs Gross</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4">CHANNEL NAME</th>
                <th className="p-4">TOTAL VIEWS</th>
                <th className="p-4">GROSS REVENUE</th>
                <th className="p-4">YOUTUBE CUT (45%)</th>
                <th className="p-4">NET PAYOUT</th>
                <th className="p-4">CREATOR SHARE (70%)</th>
                <th className="p-4">LABEL SHARE (20%)</th>
              </tr>
            </thead>
            <tbody>
              {channelsList.map((ch: any, idx: number) => (
                <tr key={idx} className="border-b-2 border-black hover:bg-yellow-50 transition-colors text-xs font-bold">
                  <td className="p-4 uppercase font-extrabold text-slate-900">{ch.channel_name}</td>
                  <td className="p-4 font-mono">{ch.total_views.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-700">Rp {ch.gross_revenue_idr.toLocaleString()}</td>
                  <td className="p-4 font-mono text-rose-700">-Rp {ch.youtube_cut_idr.toLocaleString()}</td>
                  <td className="p-4 font-mono font-extrabold text-emerald-800">Rp {ch.net_payout_idr.toLocaleString()}</td>
                  <td className="p-4 font-mono text-purple-900">Rp {ch.creator_share_idr.toLocaleString()}</td>
                  <td className="p-4 font-mono text-sky-900">Rp {ch.label_share_idr.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
