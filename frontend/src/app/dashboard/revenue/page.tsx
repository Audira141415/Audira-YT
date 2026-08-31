"use client"

import React, { useState, useEffect } from "react"
import { 
  DollarSign, TrendingUp, BarChart3, PieChart, Sparkles, RefreshCw, 
  ExternalLink, Layers, ArrowUpRight, Check, Sliders, ShieldCheck, PlaySquare, Eye, Music
} from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

interface ChannelRevenue {
  channel_id: string;
  name: string;
  avatar: string;
  total_views: number;
  subscribers: number;
  video_count: number;
  rpm_idr: number;
  estimated_lifetime_idr: number;
  estimated_monthly_idr: number;
  estimated_daily_idr: number;
}

interface TopVideo {
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail: string;
  view_count: number;
  like_count: number;
  rpm_idr: number;
  estimated_revenue_idr: number;
}

interface MonthlyTrend {
  month: string;
  estimated_idr: number;
  projected_views: number;
}

interface RevenueData {
  total_network_views: number;
  total_estimated_lifetime_idr: number;
  total_estimated_monthly_idr: number;
  total_estimated_daily_idr: number;
  average_network_rpm: number;
  channel_breakdown: ChannelRevenue[];
  top_earning_videos: TopVideo[];
  monthly_trend: MonthlyTrend[];
  currency: string;
  last_calculated: string;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [customRpm, setCustomRpm] = useState<number>(12000);
  const [savingRpm, setSavingRpm] = useState(false);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/revenue/summary`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load revenue data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const handleSaveRpm = async (channelName: string) => {
    try {
      setSavingRpm(true);
      const res = await fetch(`${getApiBaseUrl()}/revenue/rpm-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_name: channelName,
          rpm_idr: customRpm
        })
      });
      if (res.ok) {
        alert(`RPM untuk ${channelName} berhasil diperbarui menjadi Rp ${customRpm.toLocaleString()}!`);
        setEditingChannel(null);
        fetchRevenue();
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan RPM.");
    } finally {
      setSavingRpm(false);
    }
  };

  const formatIDR = (val: number) => {
    return `Rp ${(val || 0).toLocaleString("id-ID")}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Hero Header */}
      <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-emerald-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> REVENUE & MONETIZATION INTELLIGENCE
            </span>
            <span className="bg-yellow-300 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              INDONESIAN MUSIC RPM BENCHMARK
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            ESTIMASI PENDAPATAN & VALUASI NETWORK
          </h1>
          <p className="text-xs font-bold text-gray-900 mt-2 max-w-3xl leading-relaxed">
            Hitung proyeksi pendapatan AdSense, royalti katalog musik, dan performa RPM (Revenue Per Mille) per 1.000 views untuk masing-masing genre secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={fetchRevenue}
            disabled={loading}
            className="bg-black text-emerald-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> REFRESH ESTIMASI
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Lifetime Est. Revenue */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">TOTAL LIFETIME REVENUE</span>
            <span className="bg-emerald-400 text-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black tracking-tight text-emerald-700">
            {loading ? "..." : formatIDR(data?.total_estimated_lifetime_idr || 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-500 mt-2">
            Dari {data?.total_network_views?.toLocaleString() || 0} Total Network Views
          </div>
        </div>

        {/* Metric 2: Monthly Projected Revenue */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">PROYEKSI BULANAN</span>
            <span className="bg-yellow-300 text-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black tracking-tight text-yellow-800">
            {loading ? "..." : formatIDR(data?.total_estimated_monthly_idr || 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-500 mt-2">
            Kecepatan Monetisasi Aktif (Monthly Run-Rate)
          </div>
        </div>

        {/* Metric 3: Daily Velocity */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">ESTIMASI HARIAN (DAILY)</span>
            <span className="bg-cyan-300 text-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black tracking-tight text-cyan-800">
            {loading ? "..." : formatIDR(data?.total_estimated_daily_idr || 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-500 mt-2">
            Rata-rata pendapatan harian otomatis
          </div>
        </div>

        {/* Metric 4: Average RPM */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-gray-600">AVERAGE NETWORK RPM</span>
            <span className="bg-purple-300 text-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Sliders className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black tracking-tight text-purple-900">
            {loading ? "..." : formatIDR(data?.average_network_rpm || 13500)}
          </div>
          <div className="text-[10px] font-bold text-gray-500 mt-2">
            Per 1.000 Tayangan Video (Indonesian Music Avg)
          </div>
        </div>

      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Channels Monetization & RPM Table */}
        <div className="xl:col-span-2 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-black" /> BREAKDOWN MONETISASI PER CHANNEL
                </h2>
                <p className="text-xs font-bold text-gray-600">Estimasi pendapatan dan pengaturan RPM khusus per genre musik.</p>
              </div>
              <span className="bg-yellow-200 text-black font-black text-[10px] px-2.5 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000]">
                6 CHANNELS MONITORED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-yellow-100 text-[10px] font-black uppercase">
                    <th className="p-3">CHANNEL & GENRE</th>
                    <th className="p-3">TOTAL VIEWS</th>
                    <th className="p-3">BENCHMARK RPM</th>
                    <th className="p-3">EST. MONTHLY</th>
                    <th className="p-3">EST. LIFETIME</th>
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 text-xs font-bold">
                  {data?.channel_breakdown.map((ch) => (
                    <tr key={ch.channel_id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 flex items-center gap-2.5">
                        {ch.avatar ? (
                          <img src={ch.avatar} alt={ch.name} className="w-8 h-8 rounded-full border-2 border-black object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xs shrink-0">
                            {ch.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-black text-xs uppercase">{ch.name}</div>
                          <div className="text-[10px] text-gray-500 font-normal">{ch.subscribers} Subs • {ch.video_count} Videos</div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black">{ch.total_views.toLocaleString()}</td>
                      <td className="p-3">
                        {editingChannel === ch.name ? (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number"
                              value={customRpm}
                              onChange={(e) => setCustomRpm(Number(e.target.value))}
                              className="w-20 border-2 border-black px-1.5 py-0.5 text-xs font-mono font-black focus:outline-none"
                            />
                            <button 
                              onClick={() => handleSaveRpm(ch.name)}
                              disabled={savingRpm}
                              className="bg-green-400 text-black px-2 py-0.5 border border-black text-[10px] font-black hover:bg-green-300"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <span className="bg-gray-100 px-2 py-0.5 border border-black font-mono text-[11px] font-black">
                            {formatIDR(ch.rpm_idr)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-black text-emerald-700">{formatIDR(ch.estimated_monthly_idr)}</td>
                      <td className="p-3 font-black text-slate-900">{formatIDR(ch.estimated_lifetime_idr)}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => {
                            setEditingChannel(ch.name);
                            setCustomRpm(ch.rpm_idr);
                          }}
                          className="bg-yellow-300 text-black px-2.5 py-1 border border-black text-[10px] font-black uppercase shadow-[1px_1px_0_0_#000] hover:bg-yellow-400"
                        >
                          SET RPM
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-dashed border-black/30 flex justify-between items-center text-[10px] text-gray-500 font-bold">
            <span>* RPM dihitung berdasarkan rata-rata industri YouTube Music Indonesia 2026.</span>
            <span>Update: {data?.last_calculated}</span>
          </div>
        </div>

        {/* Right 1 Col: 6-Month Projected Growth Chart */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 border-b-4 border-black pb-3 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> PROYEKSI PERTUMBUHAN 6 BULAN
            </h3>
            
            <div className="space-y-4">
              {data?.monthly_trend.map((m, idx) => {
                const maxVal = Math.max(...(data.monthly_trend.map(t => t.estimated_idr) || [1]));
                const pct = Math.max(15, Math.round((m.estimated_idr / (maxVal || 1)) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-black">
                      <span>{m.month}</span>
                      <span className="text-emerald-700 font-mono">{formatIDR(m.estimated_idr)}</span>
                    </div>
                    <div className="h-4 border-2 border-black bg-gray-100 overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-300 to-emerald-400 border-r-2 border-black transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 bg-yellow-100 border-2 border-black p-3 shadow-[2px_2px_0_0_#000] text-xs font-bold text-gray-800">
            <div className="font-black flex items-center gap-1 text-black mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> REKOMENDASI SKALABILITAS AI:
            </div>
            Tingkatkan frekuensi rilis lagu di <b>Audira Dangdut Lawas</b> dan <b>Audira Pop</b> untuk mendongkrak proyeksi bulanan hingga +45% dalam 90 hari.
          </div>
        </div>

      </div>

      {/* Bottom Section: Top Earning Tracks Leaderboard */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Music className="w-5 h-5 text-black" /> TOP EARNING TRACKS & VIDEOS LEADERBOARD
            </h2>
            <p className="text-xs font-bold text-gray-600">Video dengan kontribusi monetisasi dan estimasi royalti tertinggi di seluruh network.</p>
          </div>
          <span className="bg-emerald-300 text-black font-black text-[10px] px-2.5 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000]">
            TOP PERFORMERS
          </span>
        </div>

        {data?.top_earning_videos && data.top_earning_videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.top_earning_videos.map((vid, idx) => (
              <div key={vid.video_id || idx} className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-black text-yellow-300 font-black text-[10px] px-2 py-0.5 uppercase border border-black">
                      RANK #{idx + 1}
                    </span>
                    <span className="text-[10px] font-black bg-gray-100 border border-black px-2 py-0.5 truncate max-w-[170px]">
                      {vid.channel_name}
                    </span>
                  </div>

                  <h3 className="font-black text-xs uppercase line-clamp-2 leading-snug mb-3" title={vid.title}>
                    {vid.title}
                  </h3>

                  <div className="bg-yellow-50 border-2 border-black p-2.5 mb-3 flex flex-col gap-1.5 text-xs font-bold">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="text-[10px] flex items-center gap-1"><Eye className="w-3 h-3"/> Views:</span>
                      <span className="font-mono font-black text-black">{vid.view_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700 border-t border-black/10 pt-1">
                      <span className="text-[10px]">Est. Revenue:</span>
                      <span className="font-mono font-black text-emerald-700">{formatIDR(vid.estimated_revenue_idr)}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={`https://youtube.com/watch?v=${vid.video_id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-black text-yellow-300 font-black py-2 px-3 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5 hover:bg-gray-800 text-center"
                >
                  TONTON DI YOUTUBE <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Belum ada data video yang termonetisasi.
          </div>
        )}
      </div>

    </div>
  );
}
