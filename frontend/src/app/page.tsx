"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  PlaySquare, ArrowRight, ShieldCheck, Zap, LineChart, Users, Video, 
  TrendingUp, Activity, CheckCircle2, Globe, Sparkles, Lock, BarChart2, 
  Layers, ChevronRight, LogIn, ExternalLink, Database, Cpu, 
  Bot, RefreshCw, Radio, Bell, ArrowUpRight, HelpCircle, Check, ChevronDown
} from "lucide-react"

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("audira_token")
      const user = localStorage.getItem("audira_user")
      if (token || user) {
        setIsLoggedIn(true)
        window.location.href = "/dashboard/"
      }
    }
  }, [])

  const channelsList = [
    { name: "Pop & Hits Network", feature1: "⚡ REALTIME MONITORED", feature2: "🤖 TELEGRAM NOTIFIER", bg: "bg-amber-50 border-amber-200", tag: "POP & TRENDING", status: "TOP PERFORMER", golden: "19:00 - 22:00 WIB" },
    { name: "Lo-Fi & Chill Radio", feature1: "📈 VELOCITY DETECTOR", feature2: "📊 60M PULSE INTERVAL", bg: "bg-sky-50 border-sky-200", tag: "CHILL & AMBIENT", status: "VIRAL SURGE", golden: "20:00 - 23:00 WIB" },
    { name: "Dangdut Classic Hub", feature1: "🎯 VIRALITY SCORE 94+", feature2: "🔒 OAUTH SECURED", bg: "bg-rose-50 border-rose-200", tag: "DANGDUT CLASSIC", status: "STABLE", golden: "18:00 - 21:00 WIB" },
    { name: "Traditional Folk Media", feature1: "⚡ 24/7 AUTO-SYNC", feature2: "🤖 INSTANT ALERTS", bg: "bg-emerald-50 border-emerald-200", tag: "ETHNIC & FOLK", status: "GROWING", golden: "17:00 - 20:00 WIB" },
    { name: "Reggae & Urban Beats", feature1: "📈 GROWTH ANALYTICS", feature2: "💰 IDR ESTIMATOR", bg: "bg-purple-50 border-purple-200", tag: "REGGAE BEATS", status: "MONETIZED", golden: "21:00 - 00:00 WIB" },
    { name: "Jazz & Acoustic Lounge", feature1: "🎯 GOLDEN HOUR AI", feature2: "🛡️ ENTERPRISE ENGINE", bg: "bg-orange-50 border-orange-200", tag: "ACOUSTIC LOUNGE", status: "MONETIZED", golden: "19:00 - 22:00 WIB" },
  ]

  const faqs = [
    {
      q: "Apakah server terdedikasi tetap berjalan 24 jam secara mandiri?",
      a: "TETAP BERJALAN 100%! Seluruh engine monitoring, database PostgreSQL, scheduler 60-detik, dan Bot Telegram berjalan mandiri di dalam server terisolasi. Dashboard web dapat diakses kapan saja."
    },
    {
      q: "Bagaimana notifikasi Telegram mendeteksi lonjakan views secara realtime?",
      a: "Sistem menghitung persentase pertumbuhan views secara realtime per 60 detik. Ketika sebuah video mengalami lonjakan views melebihi batas baseline, Telegram Bot secara instan mengirimkan alert peringatan lengkap dengan rekomendasi strategi AI."
    },
    {
      q: "Bagaimana fitur Multi-App OAuth mengamankan akun Google?",
      a: "Setiap token Google OAuth terenkripsi dengan algoritma AES-256 Fernet 32-byte. Ketika token akses kadaluarsa, sistem akan memperbarui token secara otomatis tanpa perlu merepotkan pengguna untuk re-login."
    },
    {
      q: "Apakah data analitik dan statistik tersimpan dengan aman?",
      a: "SANGAT AMAN! Semua data tersimpan di database lokal PostgreSQL server Anda tanpa ada yang diunggah ke pihak ketiga. Anda memiliki kendali penuh atas 100% data analitik channel Anda."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/30 font-sans text-slate-800 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shadow-sm">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <PlaySquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight uppercase text-slate-900 block">AUDIRA YT</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                  SERVER 24/7
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                ULTIMATE MONITORING ENGINE v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-8 font-bold text-xs uppercase tracking-wide text-slate-600">
            <a href="#hero" className="hover:text-amber-600 transition-colors flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-500"/> UTAMA</a>
            <a href="#network" className="hover:text-amber-600 transition-colors flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-amber-500"/> CHANNELS</a>
            <a href="#features" className="hover:text-amber-600 transition-colors flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500"/> FITUR SISTEM</a>
            <a href="#faq" className="hover:text-amber-600 transition-colors flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-amber-500"/> FAQ</a>
          </nav>

          {/* CTA Header Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-white animate-spin"/> MASUK KE DASHBOARD <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            ) : (
              <Link 
                href="/login"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-amber-400"/> LOGIN SUPERADMIN
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER SECTION */}
      <section id="hero" className="relative pt-16 pb-24 px-6 overflow-hidden bg-gradient-to-b from-amber-50/50 via-white to-slate-50/50">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-emerald-500 text-white font-bold text-[11px] uppercase px-3.5 py-1.5 rounded-full shadow-sm shadow-emerald-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" /> DEDICATED SERVER ENGINE 24/7
                </span>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] uppercase px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-600"/> TELEGRAM INSTANT ALERTS
                </span>
                <span className="bg-sky-100 text-sky-900 border border-sky-200 font-bold text-[11px] uppercase px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600"/> MULTI-APP OAUTH ACTIVE
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight leading-tight text-slate-900">
                PLATFORM INTELISEN & <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent inline-block">MONETISASI</span> MULTI-CHANNEL YOUTUBE 24/7
              </h1>

              <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed max-w-2xl">
                Monitor performa <strong>Multi-Channel YouTube Network</strong> dan <strong>Enterprise Google OAuth Apps</strong> secara berdampingan. Engine pintar kami menghitung velositas penayangan 24-jam, jam emas posting video, dan mengirimkan notifikasi lonjakan views instan ke Telegram HP Anda 24 jam nonstop!
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm uppercase px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Activity className="w-5 h-5 text-white animate-spin"/> MASUK KE DASHBOARD SYSTEM &rarr;
                  </Link>
                ) : (
                  <Link 
                    href="/login"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm uppercase px-8 py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <LogIn className="w-5 h-5 text-amber-400"/> MASUK LOGIN SYSTEM &rarr;
                  </Link>
                )}

                <a 
                  href="#network"
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm uppercase px-7 py-4 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <Globe className="w-5 h-5 text-amber-500"/> JELAJAHI CHANNEL NETWORK
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-200 font-mono">
                <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
                  <span className="block text-2xl font-extrabold text-slate-900">100K+</span>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Total Views</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
                  <span className="block text-2xl font-extrabold text-emerald-900">ENTERPRISE</span>
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Proyeksi IDR</span>
                </div>
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl shadow-sm">
                  <span className="block text-2xl font-extrabold text-sky-900">MULTI-APP</span>
                  <span className="text-[10px] font-bold uppercase text-sky-700">Google OAuth</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                  <span className="block text-2xl font-extrabold text-amber-900">24/7</span>
                  <span className="text-[10px] font-bold uppercase text-amber-700">Server Engine</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visual Feature Card */}
            <div className="lg:col-span-5 relative">
              
              {/* Clean Modern Card Mockup */}
              <div className="bg-white border border-slate-200/80 p-7 rounded-2xl shadow-xl shadow-slate-200/50 space-y-6">
                
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-xl flex justify-between items-center text-white shadow-md shadow-amber-500/20">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider block text-amber-100">TOP PERFORMING NETWORK</span>
                    <h3 className="font-extrabold text-xl uppercase tracking-tight">Pop & Hits Network</h3>
                  </div>
                  <span className="bg-white text-amber-900 font-extrabold text-xs px-3 py-1.5 rounded-lg uppercase shadow-sm">
                    LIVE 24/7 ACTIVE
                  </span>
                </div>

                <div className="space-y-3 font-mono">
                  <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-purple-900"><Zap className="w-4 h-4 text-purple-600"/> GOLDEN UPLOAD WINDOW:</span>
                    <span className="font-extrabold text-purple-900">19:00 - 22:00 WIB</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-900"><Activity className="w-4 h-4 text-emerald-600"/> REALTIME 60M PULSE:</span>
                    <span className="font-extrabold text-emerald-900">10s POLLING ACTIVE</span>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-sky-900"><Bot className="w-4 h-4 text-sky-600"/> TELEGRAM ALERTS:</span>
                    <span className="font-extrabold text-sky-900">CHANNELS OK</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-xs font-bold uppercase text-slate-600 block mb-2.5">MANAGED CHANNELS NETWORK</span>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {channelsList.map(ch => (
                      <span key={ch.name} className={`${ch.bg} border font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase text-slate-800`}>
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
      <section id="network" className="py-20 bg-gradient-to-b from-amber-50/40 via-orange-50/20 to-white border-y border-slate-200/80">
        <div className="max-w-[1500px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 border-b border-slate-200/80 pb-5 gap-4">
            <div>
              <span className="text-amber-600 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-amber-500" /> LIVE YOUTUBE CHANNEL NETWORK
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 tracking-tight">
                MANAGED CHANNELS NETWORK
              </h2>
            </div>
            <span className="bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase shadow-sm shadow-emerald-500/20">
              24/7 AUTO-SYNC ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channelsList.map((ch, idx) => (
              <div key={idx} className={`${ch.bg} text-slate-900 border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-extrabold uppercase bg-white text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                      {ch.tag}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                      {ch.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xl uppercase tracking-tight mb-1">{ch.name}</h4>
                  <p className="text-xs font-medium text-slate-600">Golden Hours: <strong className="text-slate-900">{ch.golden}</strong></p>
                </div>
                
                <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{ch.feature1}</span>
                  <span className="bg-amber-500 text-white px-2.5 py-1 rounded-lg shadow-sm shadow-amber-500/20">{ch.feature2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURE HIGHLIGHTS GRID */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-[1500px] mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs uppercase px-4 py-1.5 rounded-full">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
              FITUR UNGGULAN SYSTEM MONITORS
            </h2>
            <p className="text-sm font-medium text-slate-600 max-w-2xl mx-auto">
              Dirancang khusus dengan performa tinggi untuk mengelola banyak channel dan akun Google OAuth secara aman dan efisien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20 mb-6">
                  <TrendingUp className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">VELOSITAS & VIRILITAS 24H</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Hitung velositas jam upload video, prediksi jam emas posting (*Golden Upload Window 19:00 - 22:00 WIB*), dan Virality Score 0-100.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-amber-600">VIRALITY DETECTOR</span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200">ACTIVE</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-500/20 mb-6">
                  <Bot className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">TELEGRAM BOT INSTANT NOTIFIER</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Kirim pemberitahuan instan lonjakan views video, penambahan like/komentar, dan peringatan koneksi langsung ke HP Anda via Telegram.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-sky-600">TELEGRAM BOT</span>
                <span className="bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-md border border-sky-200">CHANNELS OK</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 mb-6">
                  <Lock className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">MULTI-APP OAUTH AUTO-REFRESH</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Dukungan multi-kredensial Google OAuth dengan mekanisme perpanjangan token latar belakang mandiri tanpa takut terputus.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-emerald-600">AES-256 FERNET</span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200">ACTIVE</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-500/20 mb-6">
                  <Activity className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">REALTIME 60-MIN PULSE</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Pemantauan detik demi detik dengan ember statistik 60-menit (12 x 5m) dan live streaming active videos velocity polling.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-purple-600">REALTIME PULSE</span>
                <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-md border border-purple-200">10s INTERVAL</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-500/20 mb-6">
                  <Cpu className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">SELF-HOSTED DEDICATED SERVER</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Berjalan 100% mandiri di server terdedikasi lokal dengan database PostgreSQL terisolasi tanpa bergantung pada perangkat laptop.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-rose-600">LOCAL ENGINE</span>
                <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md border border-rose-200">POSTGRESQL</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/50 border border-slate-200/80 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 mb-6">
                  <BarChart2 className="w-6 h-6"/>
                </div>
                <h3 className="font-extrabold text-xl uppercase tracking-tight mb-2.5 text-slate-900">PROYEKSI REVENUE IDR/USD</h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Hitung estimasi pendapatan rupiah (IDR) berdasarkan kalkulasi RPM/CPM dinamis dari setiap jenis kategori musik channel.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-orange-600">IDR FINANCIALS</span>
                <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-md border border-orange-200">RP ESTIMATOR</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-24 px-6 bg-slate-50/50 border-t border-slate-200/80">
        <div className="max-w-[1200px] mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs uppercase px-4 py-1.5 rounded-full">
              PERTANYAAN UMUM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
              FREQUENTLY ASKED QUESTIONS (FAQ)
            </h2>
            <p className="text-sm font-medium text-slate-600 max-w-xl mx-auto">
              Jawaban lengkap mengenai keandalan server terdedikasi, keamanan OAuth, dan notifikasi Telegram 24/7.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-amber-400 transition-all"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <h3 className="font-extrabold text-base uppercase tracking-tight text-slate-900 flex items-center gap-3">
                    <span className="bg-amber-500 text-white rounded-lg w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">
                      Q{idx+1}
                    </span>
                    {faq.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </div>
                {activeFaq === idx && (
                  <p className="mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600 leading-relaxed pl-10">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-12 px-6">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 text-white font-extrabold flex items-center justify-center rounded-xl text-sm shadow-md shadow-amber-500/20">
              YT
            </div>
            <div>
              <span className="font-extrabold text-lg uppercase tracking-tight block text-slate-900">AUDIRA INTELLIGENCE MONITOR v2.0</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">&copy; 2026 AUDIRA DIGITAL NETWORK. ALL RIGHTS RESERVED &bull; DEDICATED SERVER ENGINE</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase text-slate-600">
            <Link href="/dashboard" className="hover:text-amber-600 transition-colors">Dashboard</Link>
            <Link href="/dashboard/accounts" className="hover:text-amber-600 transition-colors">Accounts</Link>
            <Link href="/dashboard/channels" className="hover:text-amber-600 transition-colors">Channels</Link>
            <Link href="/dashboard/reports" className="hover:text-amber-600 transition-colors">Reports</Link>
            <Link href="/dashboard/settings" className="hover:text-amber-600 transition-colors">Settings</Link>
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-sm transition-colors">Login Superadmin</Link>
          </div>

        </div>
      </footer>

    </div>
  )
}
