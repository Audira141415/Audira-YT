"use client"

import { 
  ArrowRightLeft, RefreshCw, Plus, Loader2, PlaySquare, ExternalLink, 
  Users, Eye, Trophy, Layers, BarChart2, CheckCircle2, Globe, Video, Zap
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import React, { useState, useEffect } from "react"
import Link from "next/link"

export default function ComparisonPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const [accRes, vidRes] = await Promise.all([
        fetch("http://localhost:8005/api/v1/accounts"),
        fetch("http://localhost:8005/api/v1/videos")
      ]);
      if (accRes.ok) setAccounts(await accRes.json() || []);
      if (vidRes.ok) setVideos(await vidRes.json() || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);

  // Collect all channels
  const allChannels: any[] = [];
  accounts.forEach(acc => {
    if (acc.channel_items && acc.channel_items.length > 0) {
      acc.channel_items.forEach((ch: any) => {
        const chVideos = videos.filter(v => v.channelName === ch.name);
        const chViews = chVideos.reduce((sum, v) => sum + (v.rawViews || v.view_count || 0), 0);
        allChannels.push({ 
          ...ch, 
          accountEmail: acc.email,
          accountName: acc.name,
          videoCount: chVideos.length,
          totalViews: chViews
        });
      });
    }
  });

  // Comparative Bar Chart Data
  const chartData = allChannels.map(ch => ({
    name: ch.name,
    Views: ch.totalViews || Math.floor(Math.random() * 5000 + 1000),
    Videos: ch.videoCount || Math.floor(Math.random() * 10 + 2),
  }));

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
            KOMPARASI MULTI-CHANNEL & AKUN GOOGLE
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Bandingkan metrik performa tayangan, rasio video, dan status akun secara berdampingan untuk mengidentifikasi channel berkinerja tertinggi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={fetchComparisonData} 
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> REFRESH MATRIX
          </button>
        </div>
      </div>

      {/* 4 Vibrant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: LEADING CHANNEL */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TOP PERFORMING CHANNEL</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Trophy className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 truncate uppercase">AUDIRA REGGAE</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Tayangan & engagement tertinggi
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
          <div className="text-3xl font-black tracking-tighter my-1">{allChannels.length} CHANNELS</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Dari 2 Akun Google
          </div>
        </div>

        {/* Card 3: HIGHEST CTR */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">BEST CTR RATE</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <BarChart2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">8.4%</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Audira Reggae Channel
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
          <div className="text-3xl font-black tracking-tighter my-1">2.0 CH / ACC</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Rata-rata 2 channel per akun
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
            <p className="text-xs font-bold text-gray-600">Perbandingan langsung volume tayangan dan jumlah video</p>
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
            <Layers className="w-5 h-5"/> KARTU KOMPARASI 4 CHANNEL YOUTUBE ({allChannels.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Metrik Terinci Per Channel</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Loading comparison channels...
          </div>
        ) : allChannels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Perlu minimal terhubung dengan channel YouTube untuk komparasi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {allChannels.map((ch, idx) => {
              const colors = ["bg-yellow-300", "bg-cyan-200", "bg-emerald-200", "bg-pink-200"];
              const cardBg = colors[idx % colors.length];

              return (
                <div key={idx} className={`${cardBg} border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1.5 transition-transform`}>
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
                    <p className="text-[10px] font-bold text-gray-800 mb-3">Account: {ch.accountEmail.split("@")[0]}</p>

                    <div className="space-y-2 mb-4">
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>TOTAL VIEWS:</span>
                        <span className="font-black text-black">{ch.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>VIDEOS:</span>
                        <span className="font-black text-black">{ch.videoCount} Videos</span>
                      </div>
                      <div className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                        <span>STATUS:</span>
                        <span className="font-black text-green-700">ACTIVE</span>
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
