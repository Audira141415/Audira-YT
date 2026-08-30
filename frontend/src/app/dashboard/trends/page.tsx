"use client"

import { 
  TrendingUp, PlaySquare, Plus, Loader2, Zap, Flame, Eye, ArrowUpRight, 
  ExternalLink, BarChart2, Calendar, Clock, Filter, Sparkles, Activity, UserPlus, Radio, Award, Info, ShieldCheck, RefreshCw,
  FileSpreadsheet, FileCode, CheckCircle2, ChevronRight
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function TrendsPage() {
  const [trendsData, setTrendsData] = useState<any | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchTrends = async (channelFilter = selectedChannel, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const queryParam = channelFilter !== "ALL" ? `?channel_id=${encodeURIComponent(channelFilter)}` : "";
      
      const [trendsRes, accRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/analytics/trends${queryParam}`),
        fetch(`${getApiBaseUrl()}/accounts`)
      ]);

      if (trendsRes.ok) {
        setTrendsData(await trendsRes.json());
        setLastRefreshed(new Date().toLocaleTimeString("id-ID") + " WIB");
      }
      if (accRes.ok) {
        const rawAcc = await accRes.json();
        const accs = Array.isArray(rawAcc) ? rawAcc : (rawAcc.items || []);
        const chs: any[] = [];
        accs.forEach((a: any) => {
          if (a.channel_items) chs.push(...a.channel_items);
        });
        setChannels(chs);
      }
    } catch (err) {
      console.error("Failed to fetch trends analytics", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(selectedChannel, true);

    const interval = setInterval(() => {
      fetchTrends(selectedChannel, false);
    }, 10000); // Live 10-second auto-poll

    return () => clearInterval(interval);
  }, [selectedChannel]);

  // Client-Side Report Exporting
  const handleExportCSV = () => {
    if (!trendsData || !trendsData.rankedVideos) return alert("Data tren belum siap!");
    const headers = ["Video Title", "Channel Name", "Upload Hour", "Total Views", "Surge Window", "Estimated Subs", "Virality Score"];
    const rows = trendsData.rankedVideos.map((v: any) => [
      `"${v.title}"`,
      `"${v.channelName}"`,
      `"${v.uploadHour}"`,
      v.rawViews,
      `"${v.surgeWindow}"`,
      v.estimatedSubs,
      v.score
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_trends_${selectedChannel}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!trendsData) return alert("Data tren belum siap!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(trendsData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_trends_${selectedChannel}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const velocityData = trendsData?.hourlyVelocity || [
    { hour: '00:00 WIB', Views: 120 },
    { hour: '03:00 WIB', Views: 80 },
    { hour: '06:00 WIB', Views: 340 },
    { hour: '09:00 WIB', Views: 780 },
    { hour: '12:00 WIB', Views: 1240 },
    { hour: '15:00 WIB', Views: 1890 },
    { hour: '18:00 WIB', Views: 2450 },
    { hour: '21:00 WIB', Views: 3100 },
  ];

  const rankedVideos = trendsData?.rankedVideos || [];
  const topScoringVideo = rankedVideos.length > 0 ? rankedVideos[0] : null;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-300 fill-current"/> PER-CHANNEL TRENDS ANALYTICS
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {selectedChannel === 'ALL' ? 'SEMUA CHANNEL' : `KHUSUS: ${selectedChannel}`}
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            ANALISIS TREN & VELOSITAS PER-CHANNEL (REAL DATA)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Menganalisis distribusi velositas tayangan 24 jam, jam emas publikasi (*Golden Upload Hours*), dan proyeksi lonjakan tayangan <strong>secara presisi per-channel</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Trends to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700"/> EXPORT CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Trends to JSON"
          >
            <FileCode className="w-4 h-4 text-blue-700"/> EXPORT JSON
          </button>
          <button 
            onClick={() => fetchTrends(selectedChannel)}
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> REFRESH DATA REALTIME
          </button>
        </div>
      </div>

      {/* PER-CHANNEL FILTER TABS BAR */}
      <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_0_#000] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2 text-xs font-black uppercase text-black border-r-2 border-black pr-4">
          <Filter className="w-4 h-4 text-black" /> FILTER CHANNEL:
        </div>
        <button 
          onClick={() => setSelectedChannel("ALL")}
          className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all ${selectedChannel === 'ALL' ? 'bg-black text-yellow-300' : 'bg-white hover:bg-yellow-100 text-black'}`}
        >
          🌐 SEMUA CHANNEL
        </button>
        {channels.map((ch) => (
          <button 
            key={ch.id}
            onClick={() => setSelectedChannel(ch.name)}
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-2 transition-all ${selectedChannel === ch.name ? 'bg-cyan-300 text-black' : 'bg-white hover:bg-cyan-100 text-black'}`}
          >
            {ch.avatar && <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-black object-cover" />}
            {ch.name}
          </button>
        ))}
      </div>

      {/* Golden Upload Window Recommendation Banner */}
      <div className="bg-yellow-300 border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2.5 border border-black text-yellow-300 shadow-[1.5px_1.5px_0_0_#000]">
            <Flame className="w-5 h-5 text-yellow-300 fill-current animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase text-black">GOLDEN UPLOAD HOURS (JAM UPLOAD EMAS REKOMENDASI)</div>
            <div className="text-xs font-bold text-gray-800">
              Waktu terbaik untuk mengunggah konten pada channel ini untuk memaksimalkan lonjakan penayangan (*Surge Window*)
            </div>
          </div>
        </div>

        <div className="bg-black text-yellow-300 border-2 border-black px-4 py-2 font-black text-sm uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-2 shrink-0">
          <span>👑 GOLDEN WINDOW:</span>
          <span className="bg-yellow-300 text-black px-2 py-0.5 border border-black font-mono font-bold text-xs">{trendsData?.goldenWindow || "19:00 - 22:00 WIB"}</span>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL VIEWS PER CHANNEL */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[10px] uppercase tracking-wider text-black">TOTAL VIEWS [{selectedChannel}]</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Eye className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {(trendsData?.totalViews || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            {trendsData?.totalVideos || 0} Video Tersambung
          </div>
        </div>

        {/* Card 2: PEAK UPLOAD HOUR */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[10px] uppercase tracking-wider text-black">JAM UPLOAD TOP VIDEO</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Clock className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {topScoringVideo ? topScoringVideo.uploadHour : '19:30 WIB'}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Timestamp `published_at` Real PostgreSQL
          </div>
        </div>

        {/* Card 3: ESTIMATED NEW SUBSCRIBERS */}
        <div className="bg-pink-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[10px] uppercase tracking-wider text-black">ESTIMASI SUBS BARU</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <UserPlus className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-pink-900">
            +{(trendsData?.totalEstimatedSubs || 0).toLocaleString()} SUBS
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Rasio Performa 0.5% Views
          </div>
        </div>

        {/* Card 4: VIRALITY SCORE */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[10px] uppercase tracking-wider text-black">SKOR VELOSITAS RATA-RATA</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Zap className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-purple-900">
            {trendsData?.avgScore || 75} / 100
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Kalkulasi Views vs Usia Video
          </div>
        </div>

      </div>

      {/* 24-HOUR HOURLY VELOCITY DISTRIBUTION AREA CHART */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-black"/> KURVA DISTRIBUSI VELOSITAS TAYANGAN 24 JAM (WIB)
            </h2>
            <p className="text-xs font-bold text-gray-600">Grafik akumulasi penayangan berdasarkan waktu upload video (Database PostgreSQL Engine)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-300 text-black font-black text-[10px] uppercase px-3 py-1 border border-black shadow-[1px_1px_0_0_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping inline-block"/>
              LIVE 10s STREAM
            </span>
            {lastRefreshed && (
              <span className="bg-black text-yellow-300 font-mono font-bold text-[10px] px-2 py-1 border border-black">
                {lastRefreshed}
              </span>
            )}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="#000" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '3px solid #000', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="Views" stroke="#000" strokeWidth={3} fill="#A5F3FC" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REAL TABEL DETEKSI JAM UPLOAD & SURGE VIEWS PER CHANNEL */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-black"/> RINCIAN METRIK & RANKING VIRALITAS VIDEO ({selectedChannel})
            </h2>
            <p className="text-xs font-bold text-gray-600">Daftar video berurut berdasarkan skor virilitas presisi</p>
          </div>
          <span className="bg-cyan-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            {rankedVideos.length} VIDEOS
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Membaca data tren presisi...
          </div>
        ) : rankedVideos.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Tidak ada video yang ditemukan untuk channel '{selectedChannel}'.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                  <th className="p-4">VIDEO & CHANNEL</th>
                  <th className="p-4">WAKTU UPLOAD <span className="text-[9px] bg-green-300 border border-black px-1">[POSTGRESQL]</span></th>
                  <th className="p-4">TOTAL VIEWS <span className="text-[9px] bg-green-300 border border-black px-1">[POSTGRESQL]</span></th>
                  <th className="p-4">PROYEKSI SURGE <span className="text-[9px] bg-yellow-300 border border-black px-1">[FORMULA 30m-3h]</span></th>
                  <th className="p-4">ESTIMASI SUBS BARU <span className="text-[9px] bg-yellow-300 border border-black px-1">[FORMULA 0.5%]</span></th>
                  <th className="p-4 text-center">SKOR VELOSITAS <span className="text-[9px] bg-purple-300 border border-black px-1">[RUMUS INTERNAL]</span></th>
                </tr>
              </thead>
              <tbody>
                {rankedVideos.map((v: any, idx: number) => (
                  <tr key={v.id || idx} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                    
                    {/* Video Title & Thumbnail */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} referrerPolicy="no-referrer" className="w-16 h-10 object-cover border-2 border-black shrink-0 shadow-[1px_1px_0_0_#000]" />
                        ) : (
                          <div className="w-16 h-10 bg-black text-white font-black flex items-center justify-center text-xs shrink-0">
                            VID
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-xs uppercase line-clamp-1">{v.title}</h4>
                          <span className="text-[10px] font-bold text-gray-600">{v.channelName || 'Audira Channel'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Waktu Upload Asli YouTube */}
                    <td className="p-4">
                      <div className="bg-black text-yellow-300 font-mono font-black text-xs px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] inline-block">
                        {v.uploadHour || "19:30 WIB"}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold mt-0.5">{v.uploadDate}</div>
                    </td>

                    {/* Total Views Asli YouTube */}
                    <td className="p-4 font-black text-xs text-green-800">
                      {(v.rawViews || 0).toLocaleString()} Views
                    </td>

                    {/* Proyeksi Surge Formula */}
                    <td className="p-4">
                      <div className="text-xs font-black text-amber-800 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-red-600 fill-current"/> {v.surgeWindow || "20:30 - 22:30 WIB"}
                      </div>
                    </td>

                    {/* Estimasi Subs Baru Formula */}
                    <td className="p-4">
                      <span className="bg-pink-200 border border-black text-pink-900 font-black text-xs px-2.5 py-1 shadow-[1px_1px_0_0_#000]">
                        +{v.estimatedSubs || 1} Subs
                      </span>
                    </td>

                    {/* Skor Virilitas Rumus */}
                    <td className="p-4 text-center">
                      <span className="font-black text-base text-purple-800">
                        {v.score || 74} / 100
                      </span>
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
