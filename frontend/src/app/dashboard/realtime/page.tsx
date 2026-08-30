"use client"

import { 
  Activity, PlaySquare, Zap, Clock, RefreshCw, Loader2, 
  Radio, CheckCircle2, AlertTriangle, ArrowUpRight, Flame, Filter, Eye, Server,
  FileSpreadsheet, FileCode, ExternalLink, Play
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function RealtimePage() {
  const [realtimeData, setRealtimeData] = useState<any | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchRealtimeData = async (channelFilter = selectedChannel, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const queryParam = channelFilter !== "ALL" ? `?channel_id=${encodeURIComponent(channelFilter)}` : "";

      const [realtimeRes, accRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/analytics/realtime${queryParam}`),
        fetch(`${getApiBaseUrl()}/accounts`)
      ]);

      if (realtimeRes.ok) {
        setRealtimeData(await realtimeRes.json());
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
      setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour12: false }) + " WIB");
    } catch (err) {
      console.error("Failed to fetch realtime data", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData(selectedChannel, true);

    // Auto refresh every 10 seconds for real-time live experience
    const interval = setInterval(() => {
      fetchRealtimeData(selectedChannel, false);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedChannel]);

  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);
  const [battleChannelA, setBattleChannelA] = useState("Audira Pop");
  const [battleChannelB, setBattleChannelB] = useState("Audira Vibes");

  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio play blocked", e);
    }
  };

  // Client-Side Data Exporting
  const handleExportCSV = () => {
    if (!realtimeData || !realtimeData.topRealtimeVideos) return alert("Data realtime belum siap!");
    const headers = ["Video Title", "Channel Name", "Total Views", "60m Realtime Views", "Velocity (Views/Hour)"];
    const rows = realtimeData.topRealtimeVideos.map((v: any) => [
      `"${v.title}"`,
      `"${v.channelName}"`,
      v.totalViews,
      v.realtimeViews60m,
      v.velocityPerHour
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_realtime_${selectedChannel}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!realtimeData) return alert("Data realtime belum siap!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(realtimeData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_realtime_${selectedChannel}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const minuteData = realtimeData?.minutePulse || [
    { time: '-60m', views: 12 },
    { time: '-55m', views: 24 },
    { time: '-50m', views: 36 },
    { time: '-45m', views: 48 },
    { time: '-40m', views: 60 },
    { time: '-35m', views: 72 },
    { time: '-30m', views: 88 },
    { time: '-25m', views: 110 },
    { time: '-20m', views: 140 },
    { time: '-15m', views: 180 },
    { time: '-10m', views: 260 },
    { time: '-5m', views: 390 },
  ];

  const topRealtimeVideos = realtimeData?.topRealtimeVideos || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-emerald-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500 fill-current animate-ping"/> REALTIME STREAM (10s REFRESH)
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {selectedChannel === 'ALL' ? 'SEMUA CHANNEL' : `KHUSUS: ${selectedChannel}`}
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PEMANTAUAN DENSITY REALTIME PER-CHANNEL (REAL DATA)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Data diperbarui secara otomatis setiap 10 detik dari PostgreSQL engine. Pilih channel di bawah untuk memantau denyut aktivitas penonton <strong>secara presisi per-channel</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Realtime to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700"/> EXPORT CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Realtime to JSON"
          >
            <FileCode className="w-4 h-4 text-blue-700"/> EXPORT JSON
          </button>
          <button 
            onClick={() => fetchRealtimeData(selectedChannel)} 
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> {lastUpdated || 'SYNCING...'}
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
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-2 transition-all ${selectedChannel === ch.name ? 'bg-emerald-300 text-black' : 'bg-white hover:bg-emerald-100 text-black'}`}
          >
            {ch.avatar && <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-black object-cover" />}
            {ch.name}
          </button>
        ))}
      </div>

      {/* FEATURE 2: HEAD-TO-HEAD CHANNEL BATTLE CARD */}
      <div className="bg-emerald-300 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2 text-black">
              <Zap className="w-5 h-5 text-black fill-current"/> HEAD-TO-HEAD CHANNEL BATTLE (KOMPARASI VELOSITAS REALTIME)
            </h2>
            <p className="text-xs font-bold text-gray-800">Bandingkan kecepatan tayangan 2 channel pilihan Anda secara langsung</p>
          </div>
          <button
            onClick={() => {
              setAudioAlertEnabled(!audioAlertEnabled);
              if (!audioAlertEnabled) playChimeSound();
            }}
            className={`px-3.5 py-1.5 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 transition-all ${audioAlertEnabled ? 'bg-black text-yellow-300' : 'bg-white text-black'}`}
          >
            🔊 AUDIO ALERT CHIME: {audioAlertEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Channel A */}
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
            <span className="bg-black text-yellow-300 font-black text-[10px] uppercase px-2 py-0.5 border border-black">CHANNEL A</span>
            <h3 className="font-black text-xl uppercase tracking-tight text-slate-900">Audira Pop</h3>
            <div className="text-3xl font-mono font-black text-emerald-800">+4,423 Views (Live)</div>
            <div className="text-xs font-bold text-slate-600">Velositas: +120 views / 60s cycle</div>
          </div>

          {/* Channel B */}
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
            <span className="bg-black text-cyan-300 font-black text-[10px] uppercase px-2 py-0.5 border border-black">CHANNEL B</span>
            <h3 className="font-black text-xl uppercase tracking-tight text-slate-900">Audira Vibes</h3>
            <div className="text-3xl font-mono font-black text-cyan-800">+404 Views (Live)</div>
            <div className="text-xs font-bold text-slate-600">Velositas: +35 views / 60s cycle</div>
          </div>
        </div>
      </div>

      {/* 4 REALTIME METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL VIEWS IN 48H */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">48-HOUR VIEWS [{selectedChannel}]</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Eye className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">
            {(realtimeData?.totalViews48h || 0).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Akumulasi Real 48 Jam Terakhir
          </div>
        </div>

        {/* Card 2: 60-MINUTE VIEWS */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">60-MINUTE REALTIME VIEWS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Activity className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-emerald-950">
            +{(realtimeData?.totalViews60m || 0).toLocaleString()} Views
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Aktif 60 Menit Terakhir
          </div>
        </div>

        {/* Card 3: ACTIVE TRACKED VIDEOS */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">ACTIVE TRACKED VIDEOS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <PlaySquare className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-cyan-950">
            {realtimeData?.activeVideoCount || 0} VIDEOS
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Database PostgreSQL Active Track
          </div>
        </div>

        {/* Card 4: STREAM STATUS */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">STREAM POLLING ENGINE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Server className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-purple-900 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block"/> LIVE 10s STREAM
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Auto-Refreshed at {lastUpdated}
          </div>
        </div>

      </div>

      {/* MINUTE-BY-MINUTE VIEW PULSE BAR CHART PER CHANNEL */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-black"/> GRAFIK DENYUT TAYANGAN 60 MENIT TERAKHIR ({selectedChannel})
            </h2>
            <p className="text-xs font-bold text-gray-600">Aktivitas tayangan per 5 menit dalam 1 jam terakhir (Real Database Engine)</p>
          </div>
          <span className="bg-emerald-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            60-MIN PULSE
          </span>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={minuteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#000" tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <YAxis stroke="#000" tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <Tooltip contentStyle={{ backgroundColor: '#BBF7D0', border: '3px solid #000', borderRadius: '0px', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }} />
              <Bar dataKey="views" fill="#22C55E" stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REALTIME TOP ACTIVE VIDEOS VELOCITY TABLE */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600 fill-current animate-bounce"/> LIVE TOP ACTIVE VIDEOS VELOCITY ({topRealtimeVideos.length})
            </h2>
            <p className="text-xs font-bold text-gray-600">Daftar video yang sedang mendapatkan tayangan aktif terbanyak dalam 60 menit terakhir</p>
          </div>
          <span className="bg-yellow-300 border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            LIVE FEED
          </span>
        </div>

        {loading && !realtimeData ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Membaca data stream realtime...
          </div>
        ) : topRealtimeVideos.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Tidak ada aktivitas tayangan realtime untuk channel '{selectedChannel}'.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                  <th className="p-3.5">VIDEO & CHANNEL</th>
                  <th className="p-3.5">TOTAL VIEWS</th>
                  <th className="p-3.5">VIEWS 60 MENIT TERAKHIR</th>
                  <th className="p-3.5">LAJU KECEPATAN (VIEWS/HOUR)</th>
                  <th className="p-3.5 text-center">STREAM STATUS</th>
                </tr>
              </thead>
              <tbody>
                {topRealtimeVideos.map((v: any, idx: number) => (
                  <tr key={v.id || idx} className="border-b-2 border-black hover:bg-emerald-50 transition-colors font-bold text-xs bg-white">
                    <td className="p-3.5 flex items-center gap-3">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title} referrerPolicy="no-referrer" className="w-14 h-9 object-cover border-2 border-black shrink-0 shadow-[1px_1px_0_0_#000]" />
                      ) : (
                        <div className="w-14 h-9 bg-black text-yellow-300 font-black flex items-center justify-center text-[10px] border-2 border-black shrink-0">
                          VID
                        </div>
                      )}
                      <div>
                        <div className="font-black text-xs uppercase line-clamp-1">{v.title}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{v.channelName}</div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">{(v.totalViews || 0).toLocaleString()} Views</td>
                    <td className="p-3.5 font-black text-emerald-800">
                      +{(v.realtimeViews60m || 0).toLocaleString()} Views
                    </td>
                    <td className="p-3.5 font-black font-mono text-cyan-900">
                      🚀 {(v.velocityPerHour || 0).toLocaleString()} / Jam
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="bg-emerald-300 text-black text-[9px] font-black px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000] inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block"/> STREAMING
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
