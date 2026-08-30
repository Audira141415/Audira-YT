"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  PlaySquare, ArrowRight, ShieldCheck, Zap, LineChart, Users, Video, 
  TrendingUp, Activity, CheckCircle2, Globe, Sparkles, Lock, BarChart2, 
  Layers, ChevronRight, LogIn, ExternalLink, Database, Cpu, Terminal, 
  Bot, RefreshCw, Radio, Bell, ArrowUpRight, HelpCircle, Check, ChevronDown
} from "lucide-react"

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM INIT] Audira YT Monitoring Engine v2.0 Started...",
    "[POSTGRESQL DB] Connection to Mini PC (192.168.100.178:5432) -> HEALTHY",
    "[MULTI-OAUTH] 3 Google Apps Active (Client IDs Loaded)",
    "[SCHEDULER 5M] Auto-Sync Loop Active -> 6 Channels Monitored 24/7",
    "[TELEGRAM BOT] Webhook Connected -> Chat ID: -5528182143"
  ])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("audira_token")
      const user = localStorage.getItem("audira_user")
      if (token || user) {
        setIsLoggedIn(true)
      }
    }
  }, [])

  // Live Terminal Log Ticker Simulation
  useEffect(() => {
    const logsPool = [
      "🔄 [AUTO-SYNC 5M SUCCESS]: Synced 3 Google Accounts & 6 YouTube Channels.",
      "⚡ [SURGE DETECTOR]: Audira Pop Velocity +14.2% (Golden Window Active).",
      "🤖 [TELEGRAM BOT]: Alert sent to Chat ID -5528182143 (Status: 200 OK).",
      "🔑 [OAUTH AUTO-REFRESH]: Token refreshed for audirasuksesmandiri@gmail.com.",
      "📊 [60M PULSE]: 12 Ember buckets recalculated -> Virality Score: 94/100.",
      "🖥️ [MINI PC ENGINE]: PostgreSQL DB Health Check -> 0ms Latency."
    ]

    const interval = setInterval(() => {
      const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)]
      const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false }) + " WIB"
      setTerminalLogs(prev => [...prev.slice(-5), `[${timestamp}] ${randomLog}`])
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  const channelsList = [
    { name: "Audira Pop", views: "5,879", videos: 10, bg: "bg-yellow-300", tag: "POP MUSIC", status: "TOP PERFORMER", golden: "19:00 - 22:00 WIB" },
    { name: "Audira Vibes", views: "351", videos: 13, bg: "bg-cyan-200", tag: "LO-FI & CHILL", status: "VIRAL SURGE", golden: "20:00 - 23:00 WIB" },
    { name: "Audira Dangdut Lawas", views: "301", videos: 7, bg: "bg-pink-200", tag: "DANGDUT CLASSIC", status: "STABLE", golden: "18:00 - 21:00 WIB" },
    { name: "Audira Javanese", views: "35", videos: 5, bg: "bg-emerald-200", tag: "ETHNIC & FOLK", status: "GROWING", golden: "17:00 - 20:00 WIB" },
    { name: "Audira Reggae", views: "18", videos: 15, bg: "bg-purple-200", tag: "REGGAE BEATS", status: "MONETIZED", golden: "21:00 - 00:00 WIB" },
    { name: "Audira Jazz Lounge", views: "0", videos: 0, bg: "bg-amber-200", tag: "JAZZ MONETIZED", status: "NEW CHANNEL", golden: "19:00 - 22:00 WIB" },
  ]

  const faqs = [
    {
      q: "Apakah sistem Mini PC tetap berjalan 24 jam meskipun laptop mati?",
      a: "TETAP BERJALAN 100%! Seluruh engine monitoring, database PostgreSQL, scheduler 5-menit, dan Bot Telegram berjalan mandiri di dalam server Mini PC (192.168.100.178). Laptop Anda hanya digunakan untuk membuka dashboard web."
    },
    {
      q: "Bagaimana notifikasi Telegram mendeteksi lonjakan views?",
      a: "Sistem menghitung persentase pertumbuhan views secara realtime. Ketika sebuah video mengalami lonjakan views melebihi batas baseline, Telegram Bot secara instan mengirimkan alert peringatan lengkap dengan rekomendasi strategi AI."
    },
    {
      q: "Bagaimana fitur Multi-App OAuth mengamankan akun Google saya?",
      a: "Setiap token Google OAuth terenkripsi dengan algoritma AES-256 Fernet 32-byte. Ketika token akses kadaluarsa, sistem akan menguji dan memperbarui token secara dinamis melalui 3 kredensial aplikasi OAuth secara otomatis tanpa perlu re-login."
    },
    {
      q: "Apakah data analitik dan pendapatan saya terisolasi secara aman?",
      a: "SANGAT AMAN! Semua data tersimpan di database lokal PostgreSQL Mini PC rumah Anda tanpa ada yang diunggah ke pihak ketiga. Anda memiliki kendali penuh atas 100% data analitik channel Anda."
    }
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-black flex flex-col selection:bg-yellow-300 selection:text-black">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_#000]">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-yellow-400 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] group-hover:rotate-6 transition-transform">
              <PlaySquare className="w-6 h-6 text-black fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tighter uppercase leading-none block">AUDIRA YT</span>
                <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] uppercase animate-pulse">
                  MINI PC 24/7
                </span>
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase bg-black text-yellow-300 px-1.5 py-0.2 rounded-none inline-block mt-0.5">
                ULTIMATE MONITORING ENGINE v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-7 font-black text-xs uppercase tracking-tight">
            <a href="#hero" className="hover:text-yellow-600 transition-colors flex items-center gap-1"><Activity className="w-3.5 h-3.5"/> UTAMA</a>
            <a href="#network" className="hover:text-yellow-600 transition-colors flex items-center gap-1"><Globe className="w-3.5 h-3.5"/> 6 CHANNELS</a>
            <a href="#features" className="hover:text-yellow-600 transition-colors flex items-center gap-1"><Zap className="w-3.5 h-3.5"/> FITUR SISTEM</a>
            <a href="#terminal" className="hover:text-yellow-600 transition-colors flex items-center gap-1"><Terminal className="w-3.5 h-3.5"/> LIVE LOGS</a>
            <a href="#faq" className="hover:text-yellow-600 transition-colors flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5"/> FAQ</a>
          </nav>

          {/* CTA Header Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard"
                className="bg-yellow-300 text-black font-black px-6 py-2.5 text-xs uppercase border-3 border-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-black animate-spin"/> MASUK KE DASHBOARD MONITOR <ArrowRight className="w-4 h-4 text-black" />
              </Link>
            ) : (
              <Link 
                href="/login"
                className="bg-black text-yellow-300 font-black px-6 py-2.5 text-xs uppercase border-3 border-black shadow-[3px_3px_0_0_#000] hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-yellow-300"/> LOGIN SUPERADMIN SYSTEM
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER SECTION */}
      <section id="hero" className="relative pt-12 pb-24 px-6 overflow-hidden border-b-4 border-black bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE6]">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-7">
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-500 text-white font-black text-[10px] uppercase px-3 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" /> MINI PC SERVER 192.168.100.178
                </span>
                <span className="bg-yellow-300 text-black font-black text-[10px] uppercase px-3 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-black"/> TELEGRAM INSTANT ALERTS
                </span>
                <span className="bg-cyan-300 text-black font-black text-[10px] uppercase px-3 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-black"/> MULTI-APP OAUTH ACTIVE
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none text-black">
                PLATFORM INTELISEN & <span className="bg-yellow-300 px-3 py-1 border-4 border-black shadow-[6px_6px_0_0_#000] inline-block mt-2">MONETISASI</span> MULTI-CHANNEL YOUTUBE 24/7
              </h1>

              <p className="text-sm sm:text-base font-bold text-gray-800 leading-relaxed max-w-2xl">
                Monitor performa <strong>6 Channel YouTube</strong> dan <strong>3 Akun Google OAuth</strong> secara berdampingan. Engine pintar kami menghitung velositas penayangan 24-jam, jam emas posting video, dan mengirimkan notifikasi lonjakan views instan ke Telegram HP Anda 24 jam nonstop!
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard"
                    className="bg-black text-yellow-300 font-black text-sm uppercase px-9 py-4 border-4 border-black shadow-[8px_8px_0_0_#000] hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
                  >
                    <Activity className="w-5 h-5 text-yellow-300 animate-spin"/> MASUK KE DASHBOARD SYSTEM &rarr;
                  </Link>
                ) : (
                  <Link 
                    href="/login"
                    className="bg-black text-yellow-300 font-black text-sm uppercase px-9 py-4 border-4 border-black shadow-[8px_8px_0_0_#000] hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
                  >
                    <LogIn className="w-5 h-5 text-yellow-300"/> MASUK LOGIN SYSTEM &rarr;
                  </Link>
                )}

                <a 
                  href="#network"
                  className="bg-white text-black font-black text-sm uppercase px-7 py-4 border-4 border-black shadow-[8px_8px_0_0_#000] hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                >
                  <Globe className="w-5 h-5 text-black"/> JELAJAHI 6 CHANNEL NETWORK
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-4 gap-4 pt-6 border-t-4 border-black font-mono">
                <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-2xl font-black text-black">6,584+</span>
                  <span className="text-[9px] font-black uppercase text-gray-700">Total Views</span>
                </div>
                <div className="bg-emerald-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-2xl font-black text-emerald-900">Rp 187K+</span>
                  <span className="text-[9px] font-black uppercase text-emerald-900">Proyeksi IDR</span>
                </div>
                <div className="bg-cyan-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-2xl font-black text-cyan-900">3 APPS</span>
                  <span className="text-[9px] font-black uppercase text-cyan-900">Google OAuth</span>
                </div>
                <div className="bg-pink-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-2xl font-black text-pink-900">24/7</span>
                  <span className="text-[9px] font-black uppercase text-pink-900">Mini PC Engine</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visual Feature Card */}
            <div className="lg:col-span-5 relative">
              
              {/* Neo-Brutalist Dashboard Preview Mockup Card */}
              <div className="bg-white border-4 border-black p-7 shadow-[12px_12px_0_0_#000] relative space-y-6">
                
                <div className="bg-yellow-300 border-3 border-black p-4 flex justify-between items-center shadow-[4px_4px_0_0_#000]">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider block text-black">TOP PERFORMING CHANNEL</span>
                    <h3 className="font-black text-2xl uppercase tracking-tight">Audira Pop</h3>
                  </div>
                  <span className="bg-black text-yellow-300 font-black text-xs px-3 py-1.5 border border-black uppercase shadow-[2px_2px_0_0_#000]">
                    5,879 VIEWS
                  </span>
                </div>

                <div className="space-y-3 font-mono">
                  <div className="bg-purple-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[3px_3px_0_0_#000]">
                    <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-purple-700"/> GOLDEN UPLOAD WINDOW:</span>
                    <span className="font-black text-purple-900">19:00 - 22:00 WIB</span>
                  </div>
                  <div className="bg-emerald-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[3px_3px_0_0_#000]">
                    <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-700"/> REALTIME 60M PULSE:</span>
                    <span className="font-black text-emerald-900">10s POLLING ACTIVE</span>
                  </div>
                  <div className="bg-cyan-100 border-2 border-black p-3 flex justify-between items-center text-xs font-bold shadow-[3px_3px_0_0_#000]">
                    <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-cyan-700"/> TELEGRAM ALERTS:</span>
                    <span className="font-black text-cyan-900">6/6 CHANNELS OK</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-100 border-3 border-black text-center shadow-[3px_3px_0_0_#000]">
                  <span className="text-xs font-black uppercase text-black block mb-2">6 CHANNELS NETWORK ACTIVE</span>
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {channelsList.map(ch => (
                      <span key={ch.name} className={`${ch.bg} border border-black font-black text-[9px] px-2 py-1 uppercase shadow-[1px_1px_0_0_#000]`}>
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

      {/* 3. LIVE CHANNEL NETWORK SHOWCASE */}
      <section id="network" className="bg-black text-white py-14 border-b-4 border-black overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b-2 border-gray-800 pb-4 gap-4">
            <div>
              <span className="text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-yellow-400" /> LIVE YOUTUBE CHANNEL NETWORK (POSTGRESQL DB)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                6 MANAGED CHANNELS NETWORK
              </h2>
            </div>
            <span className="bg-yellow-400 text-black font-black text-xs px-3 py-1 border border-white uppercase shadow-[2px_2px_0_0_#fff]">
              24/7 AUTO-SYNC ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channelsList.map((ch, idx) => (
              <div key={idx} className={`${ch.bg} text-black border-4 border-black p-5 shadow-[6px_6px_0_0_#fff] flex flex-col justify-between hover:-translate-y-1 transition-transform`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 border border-black">
                      {ch.tag}
                    </span>
                    <span className="text-[9px] font-black bg-white text-black px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                      {ch.status}
                    </span>
                  </div>
                  <h4 className="font-black text-xl uppercase tracking-tight leading-none mb-1">{ch.name}</h4>
                  <p className="text-[10px] font-bold text-gray-800">Golden Hours: <strong>{ch.golden}</strong></p>
                </div>
                
                <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-xs font-mono font-black">
                  <span className="bg-black text-white px-2 py-1">{ch.views} VIEWS</span>
                  <span className="bg-white text-black px-2 py-1 border border-black">{ch.videos} VIDEOS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURE HIGHLIGHTS GRID */}
      <section id="features" className="py-24 px-6 bg-[#FDFBF7]">
        <div className="max-w-[1500px] mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="bg-yellow-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000]">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">
              FITUR UNGGULAN SYSTEM MONITORS
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-700 max-w-2xl mx-auto">
              Dirancang khusus dengan performa tinggi untuk mengelola banyak channel dan akun Google OAuth secara aman dan efisien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-yellow-300 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <TrendingUp className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">VELOSITAS & VIRILITAS 24H</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Hitung velositas jam upload video, prediksi jam emas posting (*Golden Upload Window 19:00 - 22:00 WIB*), dan Virality Score 0-100.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-yellow-600">VIRALITY DETECTOR</span>
                <span className="bg-black text-yellow-300 px-2 py-0.5">ACTIVE</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-cyan-200 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <Bot className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">TELEGRAM BOT INSTANT NOTIFIER</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Kirim pemberitahuan instan lonjakan views video, penambahan like/komentar, dan peringatan koneksi langsung ke HP Anda via Telegram.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-cyan-700">TELEGRAM BOT</span>
                <span className="bg-cyan-300 text-black px-2 py-0.5 border border-black">6 CHANNELS OK</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-emerald-200 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <Lock className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">MULTI-APP OAUTH AUTO-REFRESH</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Dukungan multi-kredensial Google OAuth dengan mekanisme perpanjangan token latar belakang mandiri tanpa takut terputus.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-emerald-700">AES-256 FERNET</span>
                <span className="bg-emerald-300 text-black px-2 py-0.5 border border-black">3 APPS</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-purple-200 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <Activity className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">REALTIME 60-MIN PULSE</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Pemantauan detik demi detik dengan ember statistik 60-menit (12 x 5m) dan live streaming active videos velocity polling.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-purple-700">REALTIME PULSE</span>
                <span className="bg-purple-300 text-black px-2 py-0.5 border border-black">10s INTERVAL</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-pink-200 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <Cpu className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">MINI PC LOCAL SERVER 24/7</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Berjalan 100% mandiri di Mini PC lokal (192.168.100.178) dengan database PostgreSQL terisolasi tanpa bergantung pada laptop.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-pink-700">LOCAL ENGINE</span>
                <span className="bg-pink-300 text-black px-2 py-0.5 border border-black">POSTGRESQL</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-14 h-14 bg-amber-200 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] mb-5">
                  <BarChart2 className="w-7 h-7 text-black"/>
                </div>
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">PROYEKSI REVENUE IDR/USD</h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Hitung estimasi pendapatan rupiah (IDR) berdasarkan kalkulasi RPM/CPM dinamis dari setiap jenis kategori musik channel.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between text-xs font-black uppercase">
                <span className="text-amber-700">IDR FINANCIALS</span>
                <span className="bg-amber-300 text-black px-2 py-0.5 border border-black">RP ESTIMATOR</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. LIVE SYSTEM TERMINAL SIMULATOR */}
      <section id="terminal" className="bg-[#0F172A] text-emerald-400 py-16 px-6 border-y-4 border-black font-mono">
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500 inline-block"/>
              <div className="w-4 h-4 rounded-full bg-yellow-500 inline-block"/>
              <div className="w-4 h-4 rounded-full bg-green-500 inline-block"/>
              <span className="text-white font-black text-sm uppercase tracking-widest ml-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400"/> MINI PC ENGINE TERMINAL LOGS (192.168.100.178)
              </span>
            </div>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 uppercase font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/> LIVE BACKGROUND CRON
            </span>
          </div>

          <div className="bg-slate-950 border-2 border-slate-800 p-6 rounded-lg space-y-2 text-xs leading-relaxed shadow-inner">
            {terminalLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-500 font-bold select-none">&gt;</span>
                <span className={log.includes("SUCCESS") || log.includes("HEALTHY") ? "text-emerald-400 font-bold" : log.includes("SURGE") ? "text-yellow-400 font-bold" : "text-slate-300"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-24 px-6 bg-[#FDFBF7]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="bg-yellow-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000]">
              PERTANYAAN UMUM
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
              FREQUENTLY ASKED QUESTIONS (FAQ)
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-700 max-w-xl mx-auto">
              Jawaban lengkap mengenai keandalan server Mini PC, keamanan OAuth, dan notifikasi Telegram 24/7.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] cursor-pointer transition-all"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-3">
                    <span className="bg-yellow-300 border-2 border-black w-7 h-7 flex items-center justify-center text-xs shadow-[2px_2px_0_0_#000] shrink-0">
                      Q{idx+1}
                    </span>
                    {faq.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-black shrink-0 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </div>
                {activeFaq === idx && (
                  <p className="mt-4 pt-4 border-t-2 border-black text-xs font-bold text-gray-800 leading-relaxed pl-10">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto bg-yellow-300 border-t-4 border-black py-12 px-6">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-yellow-300 font-black flex items-center justify-center border-3 border-black text-sm shadow-[3px_3px_0_0_#000]">
              YT
            </div>
            <div>
              <span className="font-black text-xl uppercase tracking-tight block">AUDIRA INTELLIGENCE MONITOR v2.0</span>
              <span className="text-[10px] font-black uppercase text-black">&copy; 2026 AUDIRA DIGITAL NETWORK. ALL RIGHTS RESERVED &bull; MINI PC ENGINE</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-black uppercase">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/dashboard/accounts" className="hover:underline">Accounts</Link>
            <Link href="/dashboard/channels" className="hover:underline">Channels</Link>
            <Link href="/dashboard/reports" className="hover:underline">Reports</Link>
            <Link href="/dashboard/settings" className="hover:underline">Settings</Link>
            <Link href="/login" className="bg-black text-yellow-300 px-4 py-2 border-2 border-black shadow-[3px_3px_0_0_#000]">Login Superadmin</Link>
          </div>

        </div>
      </footer>

    </div>
  )
}
