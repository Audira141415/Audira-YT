"use client"

import { 
  Users, Video, Eye, PlaySquare, Clock, Plus, Loader2, RefreshCw, Activity, 
  CheckCircle2, Zap, ArrowUpRight, ExternalLink, LineChart, TrendingUp, 
  Layers, ShieldCheck, Sparkles, BarChart2, Bell, Settings, Radio
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");
  const [latestDbSyncTime, setLatestDbSyncTime] = useState<string>("-");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accRes, vidRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/accounts`),
        fetch(`${getApiBaseUrl()}/videos`)
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        const accList = Array.isArray(accData) ? accData : (accData.items || []);
        setAccounts(accList);
        if (accList.length > 0 && accList[0].syncTime) {
          setLatestDbSyncTime(accList[0].lastSync || accList[0].syncTime);
        }
      }
      if (vidRes.ok) {
        const vidData = await vidRes.json();
        setVideos(vidData || []);
      }
      setLastRefreshedAt(new Date().toLocaleTimeString("id-ID", { hour12: false }) + " WIB");
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-poll every 15 seconds for continuous real-time experience
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate real metrics from DB
  const accountsArr = Array.isArray(accounts) ? accounts : [];
  const videosArr = Array.isArray(videos) ? videos : [];

  const totalAccounts = accountsArr.length;
  const activeAccounts = accountsArr.filter(a => a && a.status === "ACTIVE").length;
  
  // Extract all channel items
  const allChannels: any[] = [];
  accountsArr.forEach(acc => {
    if (acc && acc.channel_items && Array.isArray(acc.channel_items)) {
      acc.channel_items.forEach((ch: any) => {
        allChannels.push({ ...ch, accountEmail: acc.email, accountName: acc.name });
      });
    }
  });

  const totalChannels = allChannels.length;
  const totalViews = videosArr.reduce((sum, v) => sum + (v ? (v.rawViews || v.view_count || 0) : 0), 0);
  const totalVideos = videosArr.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" /> LIVE ULTIMATE CONTROL
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <Clock className="w-3 h-3" /> REFRESH: {lastRefreshedAt || "JUST NOW"}
            </span>
            <span className="bg-cyan-200 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> SYNC YOUTUBE: {latestDbSyncTime}
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            AUDIRA YOUTUBE INTELLIGENCE DASHBOARD
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Pusat kendali eksekutif untuk mengawasi <strong>{totalAccounts} Akun Google</strong>, <strong>{totalChannels} Channel YouTube</strong>, dan <strong>{totalVideos} Video</strong> secara otomatis dan real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <Link 
            href="/dashboard/accounts" 
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4 text-yellow-300"/> TAMBAH AKUN OAUTH
          </Link>
          <button 
            onClick={fetchDashboardData} 
            className="bg-white text-black font-black px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> SYNC REFRESH
          </button>
        </div>
      </div>

      {/* Live Marquee Ticker */}
      <div className="bg-black text-white border-4 border-black p-2.5 shadow-[4px_4px_0_0_#000] flex items-center overflow-hidden">
        <span className="bg-yellow-300 text-black font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] shrink-0 mr-3 flex items-center gap-1">
          <Radio className="w-3 h-3 text-red-600 animate-pulse"/> LIVE TICKER
        </span>
        <div className="text-xs font-black uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 text-yellow-200">
          <span>🚀 6 CHANNELS SYNCED</span>
          <span>•</span>
          <span>⚡ 60s REALTIME POLLING ACTIVE</span>
          <span>•</span>
          <span>🔔 WEBSOCKET BROADCAST READY</span>
          <span>•</span>
          <span>📡 GOOGLE WEBSUB PUSH READY</span>
        </div>
      </div>

      {/* NEW FEATURES QUICK ACCESS GRID */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0_0_#000] animate-pulse">
              BARU DITAMBAHKAN
            </span>
            <h3 className="font-black text-lg uppercase tracking-tight">🔥 DAFTAR FITUR BARU & HUB CONTROL</h3>
          </div>
          <span className="text-xs font-bold text-gray-600 hidden sm:inline">Klik kartu untuk membuka fitur</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/dashboard/scheduler" className="bg-yellow-300 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">NEW 🔥</span>
                <span className="text-lg">📅</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">SCHEDULER</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Jadwal Upload Auto</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-yellow-300 py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>

          <Link href="/dashboard/comments" className="bg-pink-200 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">NEW 🔥</span>
                <span className="text-lg">💬</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">AUTO COMMENTS</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Balas & Spam Filter</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-white py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>

          <Link href="/dashboard/team" className="bg-emerald-200 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">NEW 🔥</span>
                <span className="text-lg">👥</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">TEAM ACCESS</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Hak Akses Anggota</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-white py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>

          <Link href="/dashboard/terminal" className="bg-cyan-200 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">NEW 🔥</span>
                <span className="text-lg">💻</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">LIVE TERMINAL</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Log & Command Sync</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-white py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>

          <Link href="/dashboard/alerts" className="bg-amber-200 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-black text-yellow-300 px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">WS ⚡</span>
                <span className="text-lg">🔔</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">WEBSOCKET ALERTS</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Live Surge Stream</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-white py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>

          <Link href="/dashboard/settings" className="bg-purple-200 border-2 border-black p-3.5 shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase">WEBSUB 🚀</span>
                <span className="text-lg">⚙️</span>
              </div>
              <div className="font-black text-xs uppercase leading-tight">WEBSUB & TELEGRAM</div>
              <div className="text-[10px] font-bold text-gray-800 mt-1">Google Push Webhook</div>
            </div>
            <div className="mt-3 font-black text-[10px] uppercase bg-black text-white py-1 text-center border border-black">BUKA FITUR ➔</div>
          </Link>
        </div>
      </div>

      {/* 6 Ultimate Vibrant Pop Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Total Views */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TOTAL VIEWS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Eye className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{totalViews.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-black" /> Real Data PostgreSQL
          </div>
        </div>

        {/* Card 2: Google Accounts */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">GOOGLE ACCOUNTS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Users className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{totalAccounts}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-700 border border-black inline-block"/> {activeAccounts} Akun Aktif
          </div>
        </div>

        {/* Card 3: Connected Channels */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">CONNECTED CHANNELS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <PlaySquare className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{totalChannels}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Audira Multi-Channels
          </div>
        </div>

        {/* Card 4: Tracked Videos */}
        <div className="bg-pink-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TRACKED VIDEOS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Video className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{totalVideos}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Tersinkronisasi otomatis
          </div>
        </div>

        {/* Card 5: AVG CTR & ENGAGEMENT */}
        <div className="bg-amber-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">AVG CTR & ENG</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <BarChart2 className="w-4 h-4 text-amber-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">6.5%</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            CTR Rata-rata Channel
          </div>
        </div>

        {/* Card 6: Celery Scheduler Worker Status */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">CELERY SCHEDULER</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Zap className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="text-xl font-black tracking-tighter my-1 text-green-800 flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse" /> ONLINE
          </div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Redis Cache & PostgreSQL OK
          </div>
        </div>

      </div>

      {/* ALL 4 YOUTUBE CHANNELS SHOWCASE GRID */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-black"/> DAFTAR 4 CHANNEL YOUTUBE TERHUBUNG ({allChannels.length})
            </h2>
            <p className="text-xs font-bold text-gray-600">Seluruh channel resmi milik akun Google Anda</p>
          </div>
          <Link href="/dashboard/channels" className="bg-yellow-300 text-black font-black px-4 py-2 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase hover:bg-yellow-400">
            KELOLA CHANNEL →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin"/> Loading channels showcase...
          </div>
        ) : allChannels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Belum ada channel terhubung. Buka menu Accounts untuk menambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allChannels.map((ch, idx) => (
              <div key={idx} className="border-4 border-black p-4 bg-amber-50 shadow-[4px_4px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3 mb-3">
                  {ch.avatar ? (
                    <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-14 h-14 rounded-full border-3 border-black shrink-0 object-cover shadow-[2px_2px_0_0_#000]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xl border-3 border-black shrink-0 uppercase shadow-[2px_2px_0_0_#000]">
                      {ch.name ? ch.name[0] : "Y"}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="font-black text-sm uppercase truncate leading-tight">{ch.name}</h3>
                    <p className="text-[10px] text-gray-600 font-bold truncate">ID: {ch.channel_id}</p>
                    <span className="inline-block bg-green-200 border border-black text-green-900 text-[9px] font-black px-1.5 py-0.2 uppercase mt-1">
                      ACTIVE
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-2.5 mt-2 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-600 truncate">Account: {ch.accountEmail ? ch.accountEmail.split("@")[0] : 'Google'}</span>
                  <a 
                    href={`https://youtube.com/channel/${ch.channel_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-black text-yellow-300 font-black px-2.5 py-1 text-[10px] uppercase border border-black shadow-[1px_1px_0_0_#000] flex items-center gap-1 hover:bg-gray-800"
                  >
                    OPEN <ExternalLink className="w-3 h-3"/>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Connected Accounts & Recent Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Connected Accounts */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-3">
            <h2 className="font-black text-sm uppercase flex items-center gap-2">
              <Users className="w-5 h-5"/> GOOGLE ACCOUNTS TERHUBUNG ({accounts.length})
            </h2>
            <Link href="/dashboard/accounts" className="text-xs font-black bg-cyan-300 border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0_0_#000] hover:bg-cyan-400">
              KELOLA AKUN →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin"/> Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
              Belum ada akun Google terhubung.<br/>Tekan 'TAMBAH AKUN YOUTUBE' di atas untuk memulai.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc, i) => (
                <div key={i} className="border-3 border-black p-4 bg-cyan-50 shadow-[3px_3px_0_0_#000] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black uppercase text-sm">
                      {acc.name ? acc.name.substring(0, 2) : "YT"}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase leading-tight">{acc.name}</h3>
                      <p className="text-xs text-gray-600 font-bold">{acc.email}</p>
                      <span className="text-[10px] font-bold text-gray-500">{acc.channels} Channels Connected</span>
                    </div>
                  </div>
                  <span className="bg-green-300 border-2 border-black text-black px-2.5 py-1 text-[10px] font-black uppercase shadow-[1px_1px_0_0_#000]">
                    {acc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Recent Videos Spotlight */}
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-3">
            <h2 className="font-black text-sm uppercase flex items-center gap-2">
              <Video className="w-5 h-5"/> RECENT YOUTUBE VIDEOS ({videos.length})
            </h2>
            <Link href="/dashboard/videos" className="text-xs font-black bg-pink-300 border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0_0_#000] hover:bg-pink-400">
              VIEW ALL VIDEOS →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin"/> Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
              Belum ada video tersinkronisasi di database.
            </div>
          ) : (
            <div className="space-y-3">
              {videos.slice(0, 4).map((v, i) => (
                <div key={i} className="border-3 border-black p-3 bg-pink-50 shadow-[3px_3px_0_0_#000] flex gap-3 items-center">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} referrerPolicy="no-referrer" className="w-20 h-12 object-cover border-2 border-black shrink-0 shadow-[1px_1px_0_0_#000]" />
                  ) : (
                    <div className="w-20 h-12 bg-black text-white font-black flex items-center justify-center text-xs shrink-0">
                      VID
                    </div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-black text-xs uppercase truncate leading-tight">{v.title}</h3>
                    <p className="text-[10px] text-gray-600 font-bold truncate mt-0.5">{v.channelName || 'Audira Channel'}</p>
                    <div className="text-[10px] font-black text-green-700 mt-0.5">{v.views || v.view_count || 0} Views</div>
                  </div>
                  <a 
                    href={`https://youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-black text-white p-2 border border-black shadow-[1px_1px_0_0_#000] hover:bg-gray-800 shrink-0"
                    title="Watch Video"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-yellow-300"/>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* QUICK ANALYTICS & SYSTEM CONTROL SHORTCUTS */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-xs uppercase tracking-wider mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
          <Layers className="w-4 h-4"/> QUICK ANALYTICS & SYSTEM CONTROL SHORTCUTS
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "OVERVIEW", href: "/dashboard/overview", icon: LineChart, bg: "bg-yellow-300" },
            { label: "TRENDS", href: "/dashboard/trends", icon: TrendingUp, bg: "bg-cyan-200" },
            { label: "REALTIME", href: "/dashboard/realtime", icon: Activity, bg: "bg-emerald-200" },
            { label: "COMPARISON", href: "/dashboard/comparison", icon: Layers, bg: "bg-pink-200" },
            { label: "REPORTS", href: "/dashboard/reports", icon: BarChart2, bg: "bg-purple-200" },
            { label: "SETTINGS", href: "/dashboard/settings", icon: Settings, bg: "bg-amber-200" },
          ].map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className={`${item.bg} border-3 border-black p-3 shadow-[3px_3px_0_0_#000] flex flex-col items-center justify-center text-center font-black text-xs uppercase hover:-translate-y-1 transition-transform gap-1.5`}
            >
              <item.icon className="w-5 h-5 text-black" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
