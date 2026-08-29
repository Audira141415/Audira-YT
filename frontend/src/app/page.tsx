"use client"

import React from "react"
import Link from "next/link"
import { 
  PlaySquare, ArrowRight, ShieldCheck, Zap, LineChart, Users, Video, 
  TrendingUp, Activity, CheckCircle2, Globe, Sparkles, Lock, BarChart2, 
  Layers, ChevronRight, LogIn, ExternalLink, Database
} from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

export default function LandingPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google/login`;
  };

  const channelsList = [
    { name: "Audira Pop", views: "5,879", videos: 10, bg: "bg-yellow-300", tag: "POP MUSIC" },
    { name: "Audira Vibes", views: "351", videos: 13, bg: "bg-cyan-200", tag: "LO-FI & CHILL" },
    { name: "Audira Dangdut Lawas", views: "301", videos: 7, bg: "bg-pink-200", tag: "DANGDUT CLASSIC" },
    { name: "Audira Javanese", views: "35", videos: 5, bg: "bg-emerald-200", tag: "ETHNIC & FOLK" },
    { name: "Audira Reggae", views: "18", videos: 15, bg: "bg-purple-200", tag: "REGGAE BEATS" },
    { name: "Audira Jazz Lounge", views: "0", videos: 0, bg: "bg-amber-200", tag: "JAZZ MONETIZED" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-black flex flex-col selection:bg-yellow-300 selection:text-black">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_#000]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-yellow-400 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] group-hover:rotate-6 transition-transform">
              <PlaySquare className="w-6 h-6 text-black fill-current" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter uppercase leading-none block">AUDIRA YT</span>
              <span className="text-[9px] font-black tracking-widest uppercase bg-black text-yellow-300 px-1.5 py-0.2 rounded-none inline-block">
                NEO MONITOR v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-black text-xs uppercase tracking-tight">
            <a href="#hero" className="hover:text-yellow-600 transition-colors">UTAMA</a>
            <a href="#features" className="hover:text-yellow-600 transition-colors">FITUR SISTEM</a>
            <a href="#network" className="hover:text-yellow-600 transition-colors">CHANNEL NETWORK</a>
            <a href="#security" className="hover:text-yellow-600 transition-colors">KEAMANAN OAUTH</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="bg-white text-black font-black px-4 py-2 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5"/> LOGIN
            </Link>
            <Link 
              href="/dashboard"
              className="bg-black text-yellow-300 font-black px-5 py-2 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              ENTER DASHBOARD <ArrowRight className="w-3.5 h-3.5 text-yellow-300" />
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER SECTION */}
      <section id="hero" className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-500 text-white font-black text-[10px] uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" /> REALTIME POSTGRESQL ENGINE
                </span>
                <span className="bg-yellow-300 text-black font-black text-[10px] uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  AUTOMATED OAUTH AUTO-REFRESH
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none text-black">
                PLATFORM ANALITIK & <span className="bg-yellow-300 px-2 py-0.5 border-3 border-black shadow-[4px_4px_0_0_#000] inline-block mt-1">MONETISASI</span> MULTI-CHANNEL YOUTUBE
              </h1>

              <p className="text-sm sm:text-base font-bold text-gray-800 leading-relaxed max-w-2xl">
                Pantau performa <strong>6 Channel YouTube</strong> dan <strong>3 Akun Google OAuth</strong> secara berdampingan. Hitung velositas tayangan 24-jam, jam emas posting video, dan proyeksikan pendapatan IDR secara otomatis.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={handleGoogleLogin}
                  className="bg-black text-yellow-300 font-black text-sm uppercase px-7 py-4 border-4 border-black shadow-[6px_6px_0_0_#000] hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  MASUK SYSTEM (GOOGLE OAUTH)
                </button>

                <Link 
                  href="/dashboard"
                  className="bg-yellow-300 text-black font-black text-sm uppercase px-7 py-4 border-4 border-black shadow-[6px_6px_0_0_#000] hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                >
                  <Activity className="w-5 h-5 text-black"/> JELAJAHI DASHBOARD MONITOR &rarr;
                </Link>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t-4 border-black font-mono">
                <div>
                  <span className="block text-2xl font-black text-black">6,584+</span>
                  <span className="text-[10px] font-bold uppercase text-gray-700">Total Views</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-emerald-700">Rp 187K+</span>
                  <span className="text-[10px] font-bold uppercase text-gray-700">Proyeksi IDR</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-blue-700">100%</span>
                  <span className="text-[10px] font-bold uppercase text-gray-700">OAuth Security</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visual Feature Card */}
            <div className="lg:col-span-5 relative">
              
              {/* Neo-Brutalist Dashboard Preview Mockup Card */}
              <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] relative space-y-5">
                
                <div className="bg-yellow-300 border-3 border-black p-4 flex justify-between items-center shadow-[3px_3px_0_0_#000]">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider block text-black">TOP PERFORMING CHANNEL</span>
                    <h3 className="font-black text-xl uppercase tracking-tight">Audira Pop</h3>
                  </div>
                  <span className="bg-black text-yellow-300 font-black text-xs px-2.5 py-1 border border-black uppercase shadow-[1px_1px_0_0_#000]">
                    5,879 VIEWS
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-cyan-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                    <span>GOLDEN UPLOAD WINDOW:</span>
                    <span className="font-black text-purple-900">19:00 - 22:00 WIB</span>
                  </div>
                  <div className="bg-emerald-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                    <span>REALTIME 60M PULSE:</span>
                    <span className="font-black text-emerald-900">ACTIVE POLLING (10s)</span>
                  </div>
                  <div className="bg-pink-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[2px_2px_0_0_#000]">
                    <span>OAUTH TOKEN STATUS:</span>
                    <span className="font-black text-green-800">VALID (AUTO-REFRESH)</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-100 border-2 border-black text-center shadow-[2px_2px_0_0_#000]">
                  <span className="text-xs font-black uppercase text-gray-700 block mb-1">6 CHANNELS TERHUBUNG</span>
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {channelsList.map(ch => (
                      <span key={ch.name} className={`${ch.bg} border border-black font-black text-[9px] px-2 py-0.5 uppercase shadow-[1px_1px_0_0_#000]`}>
                        {ch.name}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. LIVE CHANNEL NETWORK TICKER */}
      <section id="network" className="bg-black text-white py-8 border-y-4 border-black overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-800 pb-2">
            <span className="text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-yellow-400" /> LIVE YOUTUBE CHANNEL NETWORK (POSTGRESQL DB)
            </span>
            <span className="text-gray-400 font-bold text-[10px] uppercase">6 Active Managed Channels</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {channelsList.map((ch, idx) => (
              <div key={idx} className={`${ch.bg} text-black border-3 border-black p-3.5 shadow-[4px_4px_0_0_#fff] flex flex-col justify-between`}>
                <div>
                  <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.2 mb-1.5 inline-block">
                    {ch.tag}
                  </span>
                  <h4 className="font-black text-sm uppercase leading-tight truncate">{ch.name}</h4>
                </div>
                <div className="mt-3 pt-2 border-t-2 border-black flex justify-between items-center text-[10px] font-mono font-bold">
                  <span>{ch.views} Views</span>
                  <span>{ch.videos} Vids</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURE HIGHLIGHTS GRID */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-[1400px] mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="bg-yellow-300 text-black font-black text-xs uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
              ENTERPRISE FEATURES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
              FITUR UNGGULAN SYSTEM MONITORS
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-700 max-w-xl mx-auto">
              Dirancang khusus untuk mempermudah pengelolaan banyak channel dan akun Google secara efisien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 bg-yellow-300 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] mb-4">
                  <TrendingUp className="w-6 h-6 text-black"/>
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight mb-2">VELOSITAS & VIRILITAS 24H</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Hitung velositas jam upload video, prediksi jam emas posting (*Golden Upload Window 19:00 - 22:00 WIB*), dan Virality Score.
                </p>
              </div>
              <Link href="/dashboard/trends" className="mt-4 text-xs font-black uppercase text-black hover:underline flex items-center gap-1">
                LIHAT TRENDS &rarr;
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 bg-cyan-200 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] mb-4">
                  <Activity className="w-6 h-6 text-black"/>
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight mb-2">REALTIME 60-MIN PULSE</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Pemantauan detik demi detik dengan ember statistik 60-menit (12 x 5m) dan live streaming active videos velocity.
                </p>
              </div>
              <Link href="/dashboard/realtime" className="mt-4 text-xs font-black uppercase text-black hover:underline flex items-center gap-1">
                LIHAT REALTIME &rarr;
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 bg-emerald-200 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] mb-4">
                  <BarChart2 className="w-6 h-6 text-black"/>
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight mb-2">KOMPARASI MULTI-CHANNEL</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Bandingkan metrik penayangan, rasio channel per-akun Google, dan proyeksi pendapatan IDR/USD secara berdampingan.
                </p>
              </div>
              <Link href="/dashboard/comparison" className="mt-4 text-xs font-black uppercase text-black hover:underline flex items-center gap-1">
                LIHAT COMPARISON &rarr;
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 bg-purple-200 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] mb-4">
                  <Lock className="w-6 h-6 text-black"/>
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight mb-2">ENKRIPSI AES-256 & OAUTH</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Kredensial token Google disimpulkan terenkripsi Fernet 32-byte dengan mekanisme perpanjangan mandiri latar belakang.
                </p>
              </div>
              <Link href="/dashboard/accounts" className="mt-4 text-xs font-black uppercase text-black hover:underline flex items-center gap-1">
                LIHAT ACCOUNTS &rarr;
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-yellow-300 border-t-4 border-black py-10 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black text-xs shadow-[2px_2px_0_0_#000]">
              YT
            </div>
            <div>
              <span className="font-black text-lg uppercase tracking-tight block">AUDIRA INTELLIGENCE MONITOR</span>
              <span className="text-[10px] font-bold uppercase text-gray-800">&copy; 2026 AUDIRA DIGITAL NETWORK. ALL RIGHTS RESERVED.</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/dashboard/accounts" className="hover:underline">Accounts</Link>
            <Link href="/dashboard/channels" className="hover:underline">Channels</Link>
            <Link href="/dashboard/reports" className="hover:underline">Reports</Link>
            <Link href="/login" className="bg-black text-white px-3 py-1.5 border border-black shadow-[2px_2px_0_0_#000]">Login OAuth</Link>
          </div>

        </div>
      </footer>

    </div>
  )
}
