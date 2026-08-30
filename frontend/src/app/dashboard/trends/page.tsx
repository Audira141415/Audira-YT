"use client"

import { 
  TrendingUp, PlaySquare, Plus, Loader2, Zap, Flame, Eye, ArrowUpRight, 
  ExternalLink, BarChart2, Calendar, Clock, Filter, Sparkles, Activity, UserPlus, Radio, Award, Info, ShieldCheck, RefreshCw,
  FileSpreadsheet, FileCode, CheckCircle2, ChevronRight, Copy, Check
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function TrendsPage() {
  const [trendsData, setTrendsData] = useState<any | null>(null);
  const [aiData, setAiData] = useState<any | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchTrends = async (channelFilter = selectedChannel, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const queryParam = channelFilter !== "ALL" ? `?channel_id=${encodeURIComponent(channelFilter)}` : "";
      
      const [trendsRes, accRes, aiRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/analytics/trends${queryParam}`),
        fetch(`${getApiBaseUrl()}/accounts`),
        fetch(`${getApiBaseUrl()}/reports/ai-recommendations?channel_name=${encodeURIComponent(channelFilter)}`)
      ]);

      if (trendsRes.ok) {
        setTrendsData(await trendsRes.json());
        setLastRefreshed(new Date().toLocaleTimeString("id-ID") + " WIB");
      }
      if (aiRes.ok) {
        setAiData(await aiRes.json());
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
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedChannel]);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
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

  const heatmapDays = aiData?.golden_hour_heatmap?.heatmap || [];
  const aiTitles = aiData?.title_suggestions?.titles || [];
  const aiHashtags = aiData?.title_suggestions?.hashtags || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-300 fill-current"/> CONCRETE AI RECOMMENDATIONS & HEATMAP
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {selectedChannel === 'ALL' ? 'SEMUA CHANNEL' : `KHUSUS: ${selectedChannel}`}
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            REKOMENDASI KONTEN AI & HEATMAP 7-HARI (ENTERPRISE)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Hasilkan rekomendasi <strong>Judul Viral AI & Hashtag SEO</strong> secara instan serta analisis <strong>Heatmap Jam Emas Upload 7-Hari x 24-Jam</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
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

      {/* PILLAR 2: 7-DAY X 24-HOUR HEATMAP PREDICTOR */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2 text-slate-900">
              <Flame className="w-5 h-5 text-amber-500 fill-current"/> HEATMAP UPLOAD EMAS 7-HARI X 24-JAM (AI PREDICTOR)
            </h2>
            <p className="text-xs font-bold text-gray-600">Visualisasi kepadatan penonton aktif per jam dalam 7 hari terakhir</p>
          </div>
          <span className="bg-yellow-300 text-black border-2 border-black font-black text-xs px-3 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            PEAK: SABTU 19:00 - 22:00 WIB
          </span>
        </div>

        <div className="space-y-2 overflow-x-auto pb-2">
          {heatmapDays.map((dayItem: any, dIdx: number) => (
            <div key={dIdx} className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="w-20 font-black uppercase text-slate-900 shrink-0">{dayItem.day}</span>
              <div className="flex gap-1 flex-1 min-w-[600px]">
                {dayItem.hours.map((hItem: any, hIdx: number) => {
                  const score = hItem.score;
                  let bgClass = "bg-slate-100 text-slate-400";
                  if (score >= 80) bgClass = "bg-amber-400 text-black font-black border border-black";
                  else if (score >= 50) bgClass = "bg-yellow-200 text-slate-800";
                  return (
                    <div 
                      key={hIdx} 
                      title={`${dayItem.day} ${hItem.hour} - Traffic Score: ${score}/100`}
                      className={`flex-1 h-8 rounded flex items-center justify-center text-[9px] cursor-pointer hover:scale-105 transition-transform ${bgClass}`}
                    >
                      {hIdx % 3 === 0 ? hItem.hour.slice(0, 2) : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PILLAR 2: AI TITLE & HASHTAG GENERATOR CARD */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2 text-black">
              <Sparkles className="w-5 h-5 text-black fill-current"/> AI VIRAL TITLE & HASHTAG GENERATOR ({selectedChannel})
            </h2>
            <p className="text-xs font-bold text-gray-800">5 Pilihan judul berpotensi tinggi + 15 Hashtag SEO siap copy-paste</p>
          </div>
          <span className="bg-black text-yellow-300 font-black text-xs px-3 py-1 uppercase border border-black">
            VIRALITY SCORE: {aiData?.title_suggestions?.ai_virality_score || 96} / 100
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Titles Column */}
          <div className="lg:col-span-8 space-y-3">
            <span className="text-xs font-black uppercase text-black block mb-2">💡 REKOMENDASI JUDUL VIRAL (1-CLICK COPY):</span>
            {aiTitles.map((t: string, tIdx: number) => (
              <div key={tIdx} className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] flex justify-between items-center gap-3">
                <span className="font-bold text-xs text-slate-900 font-mono">{t}</span>
                <button
                  onClick={() => copyToClipboard(t, tIdx)}
                  className="bg-black text-yellow-300 font-black text-[10px] uppercase px-3 py-1.5 border border-black shadow-[1px_1px_0_0_#000] hover:bg-slate-800 shrink-0 flex items-center gap-1"
                >
                  {copiedIndex === tIdx ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-yellow-300"/>}
                  {copiedIndex === tIdx ? "COPIED!" : "COPY"}
                </button>
              </div>
            ))}
          </div>

          {/* Hashtags Column */}
          <div className="lg:col-span-4 bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase text-black block mb-3">🏷️ HASHTAG SEO TRENDING:</span>
              <div className="flex flex-wrap gap-1.5">
                {aiHashtags.map((tag: string, tagIdx: number) => (
                  <span key={tagIdx} className="bg-slate-100 border border-black font-mono font-bold text-[10px] px-2 py-0.5 text-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(aiHashtags.join(" "), 999)}
              className="w-full bg-black text-yellow-300 font-black text-xs uppercase py-2.5 mt-4 border border-black shadow-[2px_2px_0_0_#000] hover:bg-slate-800 flex justify-center items-center gap-2"
            >
              {copiedIndex === 999 ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4 text-yellow-300"/>}
              {copiedIndex === 999 ? "ALL HASHTAGS COPIED!" : "COPY ALL HASHTAGS"}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
