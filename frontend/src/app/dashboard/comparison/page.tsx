"use client"

import { 
  ArrowRightLeft, RefreshCw, Plus, Loader2, PlaySquare, ExternalLink, 
  Users, Eye, Trophy, Layers, BarChart2, CheckCircle2, Globe, Video, Zap,
  FileSpreadsheet, FileCode, DollarSign
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

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/analytics/comparison`);
      if (res.ok) {
        setComparisonData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch comparison analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);

  // Client-Side Report Exporting
  const handleExportCSV = () => {
    if (!comparisonData || !comparisonData.comparisonMatrix) return alert("Data komparasi belum siap!");
    const headers = ["Channel Name", "Channel ID", "Account Email", "Total Videos", "Total Views", "Avg Views/Video", "Est Revenue (IDR)", "Est Revenue (USD)"];
    const rows = comparisonData.comparisonMatrix.map((ch: any) => [
      `"${ch.name}"`,
      `"${ch.channel_id}"`,
      `"${ch.accountEmail}"`,
      ch.videoCount,
      ch.totalViews,
      ch.avgViewsPerVideo,
      ch.estRevenueIDR,
      ch.estRevenueUSD
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_comparison_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!comparisonData) return alert("Data komparasi belum siap!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(comparisonData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_comparison_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = comparisonData?.chartData || [
    { name: 'Audira Reggae', Views: 18, Videos: 15 },
    { name: 'Audira Pop', Views: 5879, Videos: 10 },
    { name: 'Audira Vibes', Views: 351, Videos: 13 },
  ];

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
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            KOMPARASI MULTI-CHANNEL & AKUN GOOGLE (REAL DATA)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Bandingkan metrik performa tayangan, proyeksi pendapatan IDR/USD, dan rasio video per-akun secara berdampingan berbasis database PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
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
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> REFRESH MATRIX
          </button>
        </div>
      </div>

      {/* 4 Vibrant Real Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: LEADING CHANNEL */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TOP PERFORMING CHANNEL</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Trophy className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">
            {comparisonData?.topPerformingChannel || "LOADING..."}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1 font-mono">
            {(comparisonData?.topChannelViews || 0).toLocaleString()} Views Terakumulasi
          </div>
        </div>

        {/* Card 2: TOTAL CHANNELS COMPARED */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">CHANNELS COMPARED</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <PlaySquare className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {comparisonData?.totalChannels || 0} CHANNELS
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Dari {comparisonData?.totalAccounts || 0} Akun Google Terkoneksi
          </div>
        </div>

        {/* Card 3: AVERAGE VIEWS PER VIDEO */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">AVG VIEWS PER VIDEO</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <BarChart2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {(comparisonData?.avgViewsPerVideo || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Rata-rata Penayangan Per Video
          </div>
        </div>

        {/* Card 4: ACCOUNTS RATIO */}
        <div className="bg-pink-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">ACCOUNTS RATIO</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Users className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {comparisonData?.accountsRatio || "0.0 CH / ACC"}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Rasio Channel per Akun Google
          </div>
        </div>

      </div>

      {/* COMPARATIVE RECHARTS BAR CHART */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <BarChart2 className="w-5 h-5"/> GRAFIK KOMPARASI TAYANGAN & VIDEO PER CHANNEL
            </h2>
            <p className="text-xs font-bold text-gray-600">Perbandingan langsung volume tayangan dan jumlah video (Database Engine)</p>
          </div>
          <span className="bg-purple-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            SIDE-BY-SIDE METRICS
          </span>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#E9D5FF', border: '3px solid #000', borderRadius: '0px', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontWeight: 'bold' }} />
              <Bar dataKey="Views" fill="#FACC15" stroke="#000" strokeWidth={2} />
              <Bar dataKey="Videos" fill="#A5F3FC" stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SIDE-BY-SIDE CHANNELS CARDS MATRIX */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-5 h-5"/> KARTU KOMPARASI CHANNELS TERHUBUNG ({allChannels.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Metrik Terinci Per Channel</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Membaca matriks komparasi...
          </div>
        ) : allChannels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Perlu minimal terhubung dengan channel YouTube untuk komparasi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {allChannels.map((ch: any, idx: number) => {
              const colors = ["bg-yellow-300", "bg-cyan-200", "bg-emerald-200", "bg-pink-200", "bg-purple-200"];
              const cardBg = colors[idx % colors.length];

              return (
                <div key={ch.id || idx} className={`${cardBg} border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1.5 transition-transform`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt={ch.name} className="w-14 h-14 rounded-full border-3 border-black shadow-[3px_3px_0_0_#000] object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xl border-3 border-black shadow-[3px_3px_0_0_#000]">
                          {ch.name ? ch.name[0] : "Y"}
                        </div>
                      )}
                      <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                        🇮🇩 {ch.country || 'ID'}
                      </span>
                    </div>

                    <h3 className="font-black text-lg uppercase tracking-tight leading-tight mb-1">{ch.name}</h3>
                    <p className="text-[10px] font-bold text-gray-800 mb-3 truncate">Account: {ch.accountEmail}</p>

                    <div className="space-y-2 mb-4">
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>TOTAL VIEWS:</span>
                        <span className="font-black text-black">{(ch.totalViews || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>EST. REVENUE:</span>
                        <span className="font-black text-emerald-800">Rp {(ch.estRevenueIDR || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>VIDEOS:</span>
                        <span className="font-black text-black">{ch.videoCount} Videos</span>
                      </div>
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>AVG VIEWS/VID:</span>
                        <span className="font-black text-blue-900">{(ch.avgViewsPerVideo || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={`https://youtube.com/channel/${ch.channel_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-black text-yellow-300 font-black py-2.5 px-3 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5 hover:bg-gray-800"
                  >
                    OPEN YOUTUBE <ExternalLink className="w-3.5 h-3.5"/>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
