"use client"

import { 
  ArrowRightLeft, RefreshCw, Plus, Loader2, PlaySquare, ExternalLink, 
  Users, Eye, Trophy, Layers, BarChart2, CheckCircle2, Globe, Video, Zap,
  FileSpreadsheet, FileCode, DollarSign, Printer, Calendar, Filter, Flame, Percent
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function ComparisonPage() {
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30D"); // "24H", "7D", "30D", "ALL"
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const chFilter = selectedChannels.length > 0 ? selectedChannels.join(",") : "ALL";
      const res = await fetch(`${getApiBaseUrl()}/analytics/comparison?period=${period}&channels_filter=${encodeURIComponent(chFilter)}`);
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparison analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [period, selectedChannels]);

  const toggleChannelSelection = (chName: string) => {
    if (selectedChannels.includes(chName)) {
      setSelectedChannels(selectedChannels.filter(c => c !== chName));
    } else {
      setSelectedChannels([...selectedChannels, chName]);
    }
  };

  const handleSelectAllChannels = () => {
    setSelectedChannels([]);
  };

  // Client-Side Report Exporting
  const handleExportCSV = () => {
    if (!comparisonData || !comparisonData.comparisonMatrix) return alert("Data komparasi belum siap!");
    const headers = ["Channel Name", "Channel ID", "Account Email", "Period Views", "Total Views", "Video Count", "Avg Views/Video", "Engagement Rate %", "Est Revenue (IDR)", "Est Revenue (USD)", "Virality Score"];
    const rows = comparisonData.comparisonMatrix.map((ch: any) => [
      `"${ch.name}"`,
      `"${ch.channel_id}"`,
      `"${ch.accountEmail}"`,
      ch.periodViews,
      ch.totalViews,
      ch.videoCount,
      ch.avgViewsPerVideo,
      `${ch.engagementRate}%`,
      ch.estRevenueIDR,
      ch.estRevenueUSD,
      ch.viralityScore
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_comparison_${period.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!comparisonData) return alert("Data komparasi belum siap!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(comparisonData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_comparison_${period.toLowerCase()}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    if (!comparisonData) return alert("Data komparasi belum siap!");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Pop-up diblokir browser.");

    const matrixHtml = (comparisonData.comparisonMatrix || []).map((ch: any) => `
      <tr style="border-bottom: 1px solid #000;">
        <td style="padding: 8px; font-weight: bold;">${ch.name}</td>
        <td style="padding: 8px;">${ch.accountEmail}</td>
        <td style="padding: 8px; font-weight: bold;">${(ch.periodViews || 0).toLocaleString()}</td>
        <td style="padding: 8px;">${(ch.totalViews || 0).toLocaleString()}</td>
        <td style="padding: 8px;">${ch.videoCount}</td>
        <td style="padding: 8px;">${ch.engagementRate}%</td>
        <td style="padding: 8px; font-weight: bold; color: #166534;">Rp ${(ch.estRevenueIDR || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Komparasi Eksekutif Audira YT (${period})</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            h1 { text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 10px; }
            .badge { background: #000; color: #fff; padding: 4px 8px; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #000; }
            .kpi-box { border: 2px solid #000; padding: 12px; margin-bottom: 15px; background: #fff; }
          </style>
        </head>
        <body>
          <h1>📊 AUDIRA YT - LAPORAN KOMPARASI MULTI-CHANNEL (${period})</h1>
          <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleString('id-ID')} WIB | <strong>Periode:</strong> ${period}</p>
          
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div class="kpi-box">
              <strong>🏆 JUARA PERFORMA VIEWS:</strong><br/>
              <span style="font-size: 16px; font-weight: bold;">${comparisonData.topPerformingChannel}</span><br/>
              ${(comparisonData.topChannelViews || 0).toLocaleString()} Views
            </div>
            <div class="kpi-box">
              <strong>⚡ ENGAGEMENT LEADER:</strong><br/>
              <span style="font-size: 16px; font-weight: bold;">${comparisonData.topEngagementChannel}</span><br/>
              Rate: ${comparisonData.topEngagementRate}%
            </div>
            <div class="kpi-box">
              <strong>💰 PROYEKSI PENDAPATAN TERTINGGI:</strong><br/>
              <span style="font-size: 16px; font-weight: bold;">${comparisonData.topRevenueChannel}</span><br/>
              Rp ${(comparisonData.topRevenueIDR || 0).toLocaleString()}
            </div>
          </div>

          <h3>MATRIKS DUMP DATA KOMPARASI CHANNELS</h3>
          <table>
            <thead>
              <tr>
                <th>CHANNEL NAME</th>
                <th>OWNER ACCOUNT</th>
                <th>PERIODE VIEWS</th>
                <th>TOTAL VIEWS</th>
                <th>VIDEOS</th>
                <th>ENGAGEMENT RATE</th>
                <th>EST REVENUE (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${matrixHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const chartData = comparisonData?.chartData || [];
  const allChannels = comparisonData?.comparisonMatrix || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-purple-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-purple-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-yellow-300"/> ULTIMATE COMPARISON MATRIX
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              SIDE-BY-SIDE ANALYTICS
            </span>
            <span className="bg-yellow-300 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              PERIODE: {period}
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            KOMPARASI MULTI-CHANNEL & LAPORAN PERBANDINGAN LENGKAP
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Bandingkan metrik performa tayangan perhari/minggu/bulan, proyeksi pendapatan IDR/USD, engagement rate, dan rasio video antar seluruh channel YouTube terhubung.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handlePrintPDF}
            className="bg-emerald-300 text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-emerald-400 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Print Executive PDF Report"
          >
            <Printer className="w-4 h-4 text-black"/> CETAK LAPORAN PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Comparison to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700"/> EXPORT CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Comparison to JSON"
          >
            <FileCode className="w-4 h-4 text-blue-700"/> EXPORT JSON
          </button>
          <button 
            onClick={fetchComparisonData} 
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> REFRESH
          </button>
        </div>
      </div>

      {/* FILTER BAR: PERIODE TIMEFRAME & CHANNEL SELECTOR */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* TIMEFRAME FILTER BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1 mr-1">
            <Calendar className="w-4 h-4 text-black"/> PERIODE WAKTU:
          </span>
          {[
            { id: "24H", label: "⚡ 24 JAM (HARI INI)" },
            { id: "7D", label: "📅 7 HARI (MINGGU INI)" },
            { id: "30D", label: "🗓️ 30 HARI (BULAN INI)" },
            { id: "ALL", label: "♾️ SEMUA WAKTU" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3.5 py-2 text-xs font-black uppercase border-2 border-black transition-all shadow-[2px_2px_0_0_#000] ${
                period === item.id 
                  ? "bg-yellow-300 text-black translate-x-0.5 translate-y-0.5 shadow-none" 
                  : "bg-white hover:bg-yellow-100 text-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* QUICK MULTI-CHANNEL SELECTOR TOGGLES */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1">
            <Filter className="w-3.5 h-3.5"/> CHANNEL FILTER:
          </span>
          <button
            onClick={handleSelectAllChannels}
            className={`px-3 py-1.5 text-[11px] font-black uppercase border-2 border-black ${
              selectedChannels.length === 0 ? "bg-black text-yellow-300" : "bg-gray-100 text-black hover:bg-gray-200"
            }`}
          >
            SEMUA (ALL {allChannels.length})
          </button>
          {allChannels.map((ch: any) => (
            <button
              key={ch.id}
              onClick={() => toggleChannelSelection(ch.name)}
              className={`px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black flex items-center gap-1 transition-all ${
                selectedChannels.includes(ch.name) 
                  ? "bg-purple-300 text-black" 
                  : "bg-white text-gray-700 hover:bg-purple-100"
              }`}
            >
              {ch.avatar && <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-3.5 h-3.5 rounded-full" />}
              {ch.name}
            </button>
          ))}
        </div>

      </div>

      {/* 4 CHAMPION KPI WINNER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOP VIEWS CHAMPION */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">🏆 JUARA VIEWS ({period})</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Trophy className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">
            {comparisonData?.topPerformingChannel || "LOADING..."}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1 font-mono">
            {(comparisonData?.topChannelViews || 0).toLocaleString()} Views Dalam Periode Ini
          </div>
        </div>

        {/* Card 2: ENGAGEMENT LEADER */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">⚡ ENGAGEMENT LEADER</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Percent className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">
            {comparisonData?.topEngagementChannel || "LOADING..."}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1 font-mono">
            Rate {comparisonData?.topEngagementRate || 0}% (Likes/Comments/Views)
          </div>
        </div>

        {/* Card 3: HIGHEST REVENUE */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">💰 PENDAPATAN TERTINGGI</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <DollarSign className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">
            {comparisonData?.topRevenueChannel || "LOADING..."}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1 font-mono">
            Proyeksi Rp {(comparisonData?.topRevenueIDR || 0).toLocaleString()}
          </div>
        </div>

        {/* Card 4: UPLOAD VELOCITY LEADER */}
        <div className="bg-pink-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">🎬 MOST ACTIVE UPLOADS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Video className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">
            {comparisonData?.topActiveChannel || "LOADING..."}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Produktivitas Konten Tertinggi
          </div>
        </div>

      </div>

      {/* COMPARATIVE RECHARTS BAR CHART */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <BarChart2 className="w-5 h-5"/> GRAFIK KOMPARASI TAYANGAN & PENDAPATAN PER CHANNEL ({period})
            </h2>
            <p className="text-xs font-bold text-gray-600">Perbandingan langsung volume tayangan dan estimasi pendapatan (Database PostgreSQL)</p>
          </div>
          <span className="bg-purple-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            PERIODE: {period}
          </span>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#E9D5FF', border: '3px solid #000', borderRadius: '0px', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontWeight: 'bold' }} />
              <Bar dataKey="Views" fill="#FACC15" stroke="#000" strokeWidth={2} name="Period Views" />
              <Bar dataKey="Videos" fill="#A5F3FC" stroke="#000" strokeWidth={2} name="Total Videos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED COMPARISON MATRIX TABLE */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Layers className="w-5 h-5"/> MATRIKS KOMPARASI DETIL MULTI-CHANNEL ({allChannels.length} CHANNELS)
            </h2>
            <p className="text-xs font-bold text-gray-600">Laporan perbandingan lengkap perhari, perminggu, dan perbulan</p>
          </div>
          <span className="bg-yellow-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            POSTGRESQL AUDITED
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Membaca matriks komparasi...
          </div>
        ) : allChannels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Perlu minimal terhubung dengan channel YouTube untuk komparasi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                  <th className="p-3.5">CHANNEL & AKUN GOOGLE</th>
                  <th className="p-3.5 text-right">VIEWS ({period})</th>
                  <th className="p-3.5 text-right">TOTAL VIEWS</th>
                  <th className="p-3.5 text-center">VIDEOS</th>
                  <th className="p-3.5 text-right">AVG VIEWS/VID</th>
                  <th className="p-3.5 text-center">ENGAGEMENT RATE</th>
                  <th className="p-3.5 text-right">EST. REVENUE (IDR)</th>
                  <th className="p-3.5 text-center">SKOR VIRAL</th>
                  <th className="p-3.5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {allChannels.map((ch: any, idx: number) => (
                  <tr key={ch.id || idx} className="border-b-2 border-black hover:bg-purple-50 transition-colors font-bold text-xs bg-white">
                    <td className="p-3.5 flex items-center gap-3">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-black shrink-0 object-cover shadow-[1px_1px_0_0_#000]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xs border-2 border-black shrink-0 uppercase shadow-[1px_1px_0_0_#000]">
                          {ch.name ? ch.name[0] : "Y"}
                        </div>
                      )}
                      <div>
                        <div className="font-black text-xs uppercase flex items-center gap-1.5">
                          {ch.name}
                          <span className="bg-black text-white text-[8px] px-1.5 py-0.2 uppercase font-mono">🇮🇩 {ch.country}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">Acc: {ch.accountEmail}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-black text-yellow-900 bg-yellow-50">
                      {(ch.periodViews || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-black">
                      {(ch.totalViews || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {ch.videoCount}
                    </td>
                    <td className="p-3.5 text-right font-mono text-blue-900">
                      {(ch.avgViewsPerVideo || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center font-black text-emerald-800">
                      {ch.engagementRate}%
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-800 bg-emerald-50">
                      Rp {(ch.estRevenueIDR || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-black text-yellow-300 text-[10px] font-black px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                        ⚡ {ch.viralityScore || 85} PTS
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <a 
                        href={`https://youtube.com/channel/${ch.channel_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-black text-white hover:bg-gray-800 text-[10px] font-black px-2.5 py-1 uppercase border border-black inline-flex items-center gap-1"
                      >
                        YOUTUBE <ExternalLink className="w-3 h-3 text-yellow-300"/>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
