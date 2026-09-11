"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  PlaySquare, ArrowRight, ShieldCheck, Zap, LineChart, Users, Video, 
  TrendingUp, Activity, CheckCircle2, Globe, Sparkles, Lock, BarChart2, 
  Layers, ChevronRight, LogIn, ExternalLink, Database, Cpu, Mail,
  Bot, RefreshCw, Radio, Bell, ArrowUpRight, HelpCircle, Check, ChevronDown,
  ShoppingBag, CreditCard, CheckSquare, PhoneCall, Sparkle, Star, Crown, UserPlus, KeyRound,
  DollarSign, Trash2, Shield, Calendar, MessageSquare, Terminal, Eye, Flame, Clock, Award,
  Sun, Moon
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR")
  const [activeDemoTab, setActiveDemoTab] = useState<"virality" | "revenue" | "copyright" | "scheduler">("virality")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("audira_token")
      const user = localStorage.getItem("audira_user")
      const lastActivityStr = localStorage.getItem("audira_last_activity")
      const MAX_INACTIVITY_MS = 60 * 60 * 1000

      if (token && user) {
        if (lastActivityStr) {
          const lastActivityMs = parseInt(lastActivityStr, 10)
          if (!isNaN(lastActivityMs) && Date.now() - lastActivityMs > MAX_INACTIVITY_MS) {
            localStorage.removeItem("audira_token")
            localStorage.removeItem("audira_user")
            localStorage.removeItem("audira_login_time")
            localStorage.removeItem("audira_last_activity")
            setIsLoggedIn(false)
            return
          }
        }
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
    }
  }, [])

  const coreEngines = [
    {
      id: "pruning",
      title: "YouTube Auto-Pruning Engine",
      tag: "AUTO CLEANUP 🧹",
      tagBg: "bg-rose-500 text-white",
      cardBg: "bg-rose-100",
      icon: Trash2,
      desc: "Deteksi otomatis 50-batch video yang dihapus atau diprivatkan di YouTube. Otomatis membersihkan database PostgreSQL, snapshot, copyright claim, dan komentar secara cascading."
    },
    {
      id: "copyright",
      title: "Copyright Shield & License Generator",
      tag: "LEGAL SHIELD 🛡️",
      tagBg: "bg-emerald-600 text-white",
      cardBg: "bg-emerald-100",
      icon: Shield,
      desc: "Sistem pelindung hak cipta Gumroad style. Buat template lisensi resmi, kelola klaim hak cipta, dan generator kunci lisensi digital untuk mengamankan konten video Anda."
    },
    {
      id: "revenue",
      title: "Executive Revenue & CPM Estimator",
      tag: "PROJECTION 💸",
      tagBg: "bg-emerald-700 text-white",
      cardBg: "bg-emerald-200",
      icon: DollarSign,
      desc: "Estimasi pendapatan Gross & Net Creator (55%) secara real-time berdasarkan total views dengan kustomisasi CPM ($1.50 - $5.00) dan konverter otomatis IDR/USD."
    },
    {
      id: "virality",
      title: "Virality Score 0-100 & Golden Hours AI",
      tag: "AI ANALYTICS 🔥",
      tagBg: "bg-amber-500 text-black",
      cardBg: "bg-amber-100",
      icon: Flame,
      desc: "Algoritma deteksi lonjakan penonton (view surge) per 60 detik. Memberikan skor viralitas 0-100 dan merekomendasikan jam emas posting paling optimal (WIB)."
    },
    {
      id: "scheduler",
      title: "Auto-Publish Upload Scheduler",
      tag: "AUTOMATION 📅",
      tagBg: "bg-purple-600 text-white",
      cardBg: "bg-purple-100",
      icon: Calendar,
      desc: "Jadwalkan upload video secara otomatis. Engine terhubung langsung dengan Celery Beat Scheduler untuk mengeksekusi publikasi pada jam puncak penonton."
    },
    {
      id: "comments",
      title: "Auto Comments & Spam Filter Engine",
      tag: "ENGAGEMENT 💬",
      tagBg: "bg-pink-600 text-white",
      cardBg: "bg-pink-100",
      icon: MessageSquare,
      desc: "Balas komentar penonton secara otomatis dan filter komentar spam beracun untuk menjaga performa skor interaksi channel YouTube Anda."
    },
    {
      id: "team",
      title: "Multi-Tenant Team Access Control",
      tag: "COLLABORATION 👥",
      tagBg: "bg-cyan-600 text-white",
      cardBg: "bg-cyan-100",
      icon: Users,
      desc: "Kelola anggota tim dengan hak akses granular (Superadmin, Manager, Editor, Viewer) untuk pengawasan aman bersama tim kreator Anda."
    },
    {
      id: "websocket",
      title: "WebSocket Live Real-Time Event Stream",
      tag: "REALTIME ⚡",
      tagBg: "bg-yellow-400 text-black",
      cardBg: "bg-yellow-100",
      icon: Activity,
      desc: "Siaran langsung event WebSocket tanpa refresh page saat video baru di-upload, terjadi surge penonton, atau klaim hak cipta terdeteksi."
    },
    {
      id: "telegram",
      title: "Telegram Security & Intel Bot",
      tag: "2-WAY TELEGRAM 🤖",
      tagBg: "bg-sky-600 text-white",
      cardBg: "bg-sky-100",
      icon: Bot,
      desc: "Bot Telegram interaktif dua arah. Menerima notifikasi instant lonjakan views, penurunan subscriber, laporan harian, dan peringatan keamanan login."
    },
    {
      id: "minipc",
      title: "24/7 Self-Hosted Dedicated Server Stack",
      tag: "HARDWARE 🖥️",
      tagBg: "bg-slate-900 text-yellow-300",
      cardBg: "bg-slate-100",
      icon: Cpu,
      desc: "Berjalan 24/7 di atas server Mini PC / Cloud Server terisolasi dengan Docker Compose 6-container. Bebas biaya langganan cloud bulanan."
    }
  ]

  const pricingPlans = [
    {
      name: "STARTER MONITOR",
      priceIdr: "Rp 299.000",
      priceUsd: "$19",
      period: "/ bulan",
      badge: "LITE EDITION",
      popular: false,
      features: [
        "Hingga 3 YouTube Channels Monitoring",
        "1 Google OAuth App Credential",
        "Notifikasi Telegram Lonjakan Views (60s)",
        "Analitik Virality Score & Golden Hours",
        "Support via Live Chat System"
      ],
      cta: "BELI PAKET STARTER",
      btnClass: "bg-white hover:bg-slate-50 text-slate-900 border-2 border-black shadow-[3px_3px_0_0_#000]"
    },
    {
      name: "PRO ENTERPRISE",
      priceIdr: "Rp 599.000",
      priceUsd: "$39",
      period: "/ bulan",
      badge: "PALING POPULER & BEST SELLER 🔥",
      popular: true,
      features: [
        "Hingga 10 YouTube Channels Monitoring",
        "Multi-App Google OAuth Credentials (3 Apps)",
        "Server Terdedikasi 24/7 Autopilot",
        "Bot Telegram Instant Surge & Event Notifier",
        "Analitik Virality Score 0-100 & Jam Emas AI",
        "Auto-Pruning Video Terhapus & Copyright Shield",
        "Dukungan Prioritas & Update Fitur Otomatis"
      ],
      cta: "BELI PAKET PRO ENTERPRISE",
      btnClass: "bg-amber-400 hover:bg-amber-500 text-black border-2 border-black shadow-[4px_4px_0_0_#000] font-black"
    },
    {
      name: "ULTIMATE LISENSI",
      priceIdr: "Rp 999.000",
      priceUsd: "$69",
      period: "/ lisensi penuh",
      badge: "SELF-HOSTED FULL CODE 🚀",
      popular: false,
      features: [
        "UNLIMITED YouTube Channels & Akun Google",
        "Full Source Code & Setup di Server Mini PC",
        "Auto-Pruning Engine & Copyright Shield Full",
        "Kustomisasi Bot Telegram & Integrasi Webhook",
        "Database Lokal PostgreSQL Terisolasi 100%",
        "Lisensi Permanen Tanpa Biaya Bulanan",
        "Konsultasi & Support VIP Dedicated Manager"
      ],
      cta: "BELI LISENSI ULTIMATE",
      btnClass: "bg-slate-900 hover:bg-slate-800 text-yellow-300 border-2 border-black shadow-[4px_4px_0_0_#000] font-black"
    }
  ]

  const faqs = [
    {
      q: "Bagaimana cara masuk ke dashboard sistem dengan akun Audira?",
      a: "Klik tombol 'LOGIN SUPERADMIN' di sudut kanan atas untuk membuka halaman otentikasi. Anda dapat memasukkan nama pengguna/email dan kata sandi yang telah terdaftar."
    },
    {
      q: "Bagaimana sistem Auto-Pruning menangani video yang dihapus di YouTube?",
      a: "Engine Auto-Pruning memeriksa seluruh ID video di database ke YouTube Data API secara langsung dalam batch 50 item. Jika video terhapus atau diprivatkan di YouTube, sistem secara otomatis menghapus video, snapshot, klaim hak cipta, dan komentar terkait dari PostgreSQL secara cascading."
    },
    {
      q: "Apakah server terdedikasi tetap berjalan 24 jam secara mandiri?",
      a: "TETAP BERJALAN 100%! Seluruh engine monitoring, database PostgreSQL, scheduler 60-detik, dan Bot Telegram berjalan mandiri di dalam server Mini PC terisolasi (192.168.100.178)."
    },
    {
      q: "Bagaimana notifikasi Telegram mendeteksi lonjakan views secara realtime?",
      a: "Sistem menghitung persentase pertumbuhan views secara realtime per 60 detik. Ketika sebuah video mengalami lonjakan views melebihi batas baseline, Telegram Bot secara instan mengirimkan alert peringatan."
    },
    {
      q: "Apakah saya bisa mengubah mata uang estimasi pendapatan (IDR / USD)?",
      a: "BISA! Dashboard dilengkapi kalkulator CPM interaktif yang memungkinkan Anda beralih antara rupiah (IDR) dan dollar (USD) dengan penyesuaian rate CPM sesuai standar monetisasi channel Anda."
    }
  ]

  return (
    <div className="min-h-screen neo-canvas font-sans text-slate-900 dark:text-slate-100 flex flex-col selection:bg-yellow-300 selection:text-black transition-colors duration-200">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-yellow-300 dark:bg-amber-400 border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_#000]">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-black text-yellow-300 border-2 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
              <PlaySquare className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tighter uppercase text-black block">AUDIRA YT</span>
                <span className="bg-emerald-300 text-black font-black text-[9px] px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                  MINI PC 24/7
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase">
                INTELLIGENCE MONITORING ENGINE
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-8 font-black text-xs uppercase tracking-wide text-black">
            <a href="#hero" className="hover:underline flex items-center gap-1.5"><Activity className="w-4 h-4 text-black"/> UTAMA</a>
            <a href="#engines" className="hover:underline flex items-center gap-1.5"><Zap className="w-4 h-4 text-black"/> 10 FITUR ENGINE</a>
            <a href="#demo" className="hover:underline flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-black"/> INTERACTIVE DEMO</a>
            <a href="#pricing" className="hover:underline flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-black"/> PAKET HARGA</a>
            <a href="#faq" className="hover:underline flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-black"/> FAQ</a>
          </nav>

          {/* CTA Header Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="border-2 border-black flex items-center gap-1.5 px-3 py-1.5 font-black text-xs shadow-[2px_2px_0_0_#000] uppercase active:translate-x-0.5 active:translate-y-0.5 transition-all bg-white text-black hover:bg-yellow-100 cursor-pointer"
              title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span>LIGHT</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-black fill-current" />
                  <span>DARK</span>
                </>
              )}
            </button>

            {/* Currency Switcher */}
            <div className="hidden sm:flex items-center bg-white border-2 border-black p-1 shadow-[2px_2px_0_0_#000]">
              <button
                onClick={() => setCurrency("IDR")}
                className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black transition-all ${currency === "IDR" ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}
              >
                IDR (Rp)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black transition-all ${currency === "USD" ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}
              >
                USD ($)
              </button>
            </div>

            {isLoggedIn ? (
              <Link 
                href="/dashboard"
                className="bg-black text-yellow-300 font-black px-6 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 animate-spin text-yellow-300"/> MASUK DASHBOARD <ArrowRight className="w-4 h-4 text-yellow-300" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/register"
                  className="bg-cyan-300 text-black font-black px-5 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-cyan-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hidden md:flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-black"/> REGISTRASI
                </Link>
                <Link 
                  href="/login"
                  className="bg-black text-yellow-300 font-black px-5 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-yellow-300"/> LOGIN SUPERADMIN
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER SECTION */}
      <section id="hero" className="relative pt-12 pb-20 px-6 bg-[#FFFDF5] border-b-4 border-black">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-7">
              
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-emerald-300 text-black font-black text-[10px] uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-700 rounded-full animate-ping" /> MINI PC SERVER (192.168.100.178)
                </span>
                <span className="bg-cyan-300 text-black font-black text-[10px] uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5"/> TELEGRAM INSTANT ALERTS
                </span>
                <span className="bg-rose-400 text-white font-black text-[10px] uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5"/> AUTO-PRUNING ACTIVE
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none text-black">
                PLATFORM INTELISEN & <span className="bg-yellow-300 px-3 border-3 border-black shadow-[4px_4px_0_0_#000] inline-block mt-1">MONETISASI</span> YOUTUBE 24/7
              </h1>

              <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed max-w-xl">
                Pemantauan performa <strong>Multi-Channel YouTube Network</strong>, <strong>Auto-Pruning Video Terhapus</strong>, <strong>Copyright Shield</strong>, dan <strong>Executive Revenue Projection</strong>. Didukung kalkulasi virality score 0-100 dan notifikasi lonjakan penonton ke Telegram!
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/login"
                  className="bg-black text-yellow-300 font-black px-7 py-4 border-3 border-black text-sm uppercase shadow-[5px_5px_0_0_#000] hover:bg-slate-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5 text-yellow-300" /> BUKA DASHBOARD KENDALI <ArrowRight className="w-5 h-5 text-yellow-300" />
                </Link>
                <a
                  href="#engines"
                  className="bg-white text-black font-black px-6 py-4 border-3 border-black text-sm uppercase shadow-[5px_5px_0_0_#000] hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
                >
                  <Zap className="w-5 h-5 text-black" /> LIHAT 10 ENGINE FITUR
                </a>
              </div>

              {/* Stats Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-yellow-300 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <div className="text-2xl font-black">24/7</div>
                  <div className="text-[10px] font-bold uppercase">Autopilot Monitoring</div>
                </div>
                <div className="bg-cyan-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <div className="text-2xl font-black">100%</div>
                  <div className="text-[10px] font-bold uppercase">Auto-Pruning Pruned</div>
                </div>
                <div className="bg-emerald-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <div className="text-2xl font-black">60 SEC</div>
                  <div className="text-[10px] font-bold uppercase">Realtime Surge Poll</div>
                </div>
                <div className="bg-pink-200 border-2 border-black p-3 shadow-[3px_3px_0_0_#000]">
                  <div className="text-2xl font-black">AES-256</div>
                  <div className="text-[10px] font-bold uppercase">Encrypted Security</div>
                </div>
              </div>

            </div>

            {/* Hero Right Visual Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] space-y-4">
                
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full border border-black"/>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full border border-black"/>
                    <span className="w-3 h-3 bg-green-500 rounded-full border border-black"/>
                    <span className="font-black text-xs uppercase ml-2">AUDIRA YOUTUBE INTEL PREVIEW</span>
                  </div>
                  <span className="bg-black text-yellow-300 font-black text-[10px] px-2 py-0.5 uppercase border border-black">
                    LIVE SYSTEM OK
                  </span>
                </div>

                {/* Simulated Live Surge Notification */}
                <div className="bg-yellow-300 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-black text-yellow-300 font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                      🚨 TELEGRAM SURGE ALERT
                    </span>
                    <span className="text-[10px] font-bold text-gray-800">JUST NOW</span>
                  </div>
                  <div className="font-black text-sm uppercase">Audira Network Channel — "Official Release 2026"</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-3">
                    <span>⚡ +1,450 Views Baru (+24%)</span>
                    <span>🔥 Viral Score: 94/100</span>
                  </div>
                </div>

                {/* Simulated Copyright & Auto Prune Alert */}
                <div className="bg-rose-200 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-rose-600 text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                      🧹 AUTO-PRUNING ENGINE EXECUTED
                    </span>
                    <span className="text-[10px] font-bold text-gray-800">AUTOMATIC</span>
                  </div>
                  <div className="font-black text-xs uppercase">Video ID <code>dQw4w9WgXcQ</code> terhapus di YouTube.</div>
                  <div className="text-[10px] font-bold text-rose-950 mt-0.5">
                    Sistem otomatis menghapus PostgreSQL record, snapshot views, dan klaim hak cipta secara cascading.
                  </div>
                </div>

                {/* Revenue Estimator Simulation */}
                <div className="bg-emerald-200 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-black text-emerald-950 uppercase">ESTIMATED NETWORK REVENUE</div>
                    <div className="text-xl font-black text-emerald-900 mt-0.5">
                      {currency === "IDR" ? "Rp 12.450.000" : "$788.00 USD"}
                    </div>
                  </div>
                  <span className="bg-emerald-700 text-white font-black text-[10px] uppercase px-2.5 py-1 border border-black shadow-[1px_1px_0_0_#000]">
                    CPM $2.10
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. 10 CORE ENGINES SHOWCASE GRID */}
      <section id="engines" className="py-20 px-6 bg-white border-b-4 border-black">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="bg-yellow-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] inline-block">
              10 FITUR ENGINE CANGGIH
            </span>
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black uppercase tracking-tighter">
              EKOSISTEM MONITORING & OTOMASI YOUTUBE TERLENGKAP
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-700 leading-relaxed">
              Seluruh engine bekerja secara harmonis di dalam server terdedikasi Anda untuk mengontrol channel YouTube secara autopilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {coreEngines.map((engine) => {
              const IconComp = engine.icon;
              return (
                <div 
                  key={engine.id}
                  className={`${engine.cardBg} border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1.5 transition-transform relative group overflow-hidden`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`${engine.tagBg} font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]`}>
                        {engine.tag}
                      </span>
                      <div className="bg-black p-2 border border-black shadow-[1px_1px_0_0_#000]">
                        <IconComp className="w-5 h-5 text-yellow-300" />
                      </div>
                    </div>
                    <h3 className="font-black text-sm uppercase leading-snug mb-2 text-slate-950">{engine.title}</h3>
                    <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{engine.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t-2 border-black/20 flex justify-between items-center text-[10px] font-black uppercase text-slate-900">
                    <span>STATUS: ACTIVE</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE PRODUCT FEATURE DEMO TABS */}
      <section id="demo" className="py-20 px-6 bg-yellow-300 border-b-4 border-black">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="bg-black text-yellow-300 font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] inline-block">
              INTERACTIVE DEMO PREVIEW
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
              UJI FITUR UTAMA DASHBOARD SECARA INTERAKTIF
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-800">
              Klik tab di bawah untuk melihat preview tampilan sistem kontrol secara langsung.
            </p>
          </div>

          {/* Demo Tabs Control */}
          <div className="flex justify-center flex-wrap gap-3 mb-8">
            {[
              { id: "virality", label: "🔥 VIRALITY & SURGE MONITOR", color: "bg-amber-100" },
              { id: "revenue", label: "💸 REVENUE & CPM FORECASTING", color: "bg-emerald-100" },
              { id: "copyright", label: "🛡️ COPYRIGHT PROTECTION SHIELD", color: "bg-rose-100" },
              { id: "scheduler", label: "📅 AUTO PUBLISHER SCHEDULER", color: "bg-purple-100" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDemoTab(tab.id as any)}
                className={`px-5 py-3 font-black text-xs uppercase border-3 border-black transition-all ${activeDemoTab === tab.id ? 'bg-black text-yellow-300 shadow-[4px_4px_0_0_#000] -translate-y-1' : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0_0_#000]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Showcase Card */}
          <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_#000] max-w-4xl mx-auto">
            {activeDemoTab === "virality" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <h3 className="font-black text-lg uppercase flex items-center gap-2">
                    <Flame className="w-6 h-6 text-amber-500"/> VIRALITY SCORE & REALTIME SURGE MONITOR
                  </h3>
                  <span className="bg-amber-300 text-black font-black text-xs px-3 py-1 border-2 border-black">
                    SCORE: 94 / 100 [HIGH VIRAL]
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Sistem terus memantau pertumbuhan views per 60 detik. Saat terdeteksi kenaikan penonton signifikan (misal +50 views dan +15% growth), notifikasi dikirimkan ke Telegram dan dashboard.
                </p>
                <div className="bg-amber-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">LONJAKAN VIEWS</div>
                    <div className="text-xl font-black text-amber-700">+1,450 Views</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">GROWTH VELOCITY</div>
                    <div className="text-xl font-black text-green-700">+24.5% / min</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">GOLDEN HOURS REKOMENDASI</div>
                    <div className="text-xl font-black text-purple-700">19:00 WIB</div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === "revenue" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <h3 className="font-black text-lg uppercase flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-600"/> EXECUTIVE REVENUE & CPM FORECASTING
                  </h3>
                  <span className="bg-emerald-300 text-black font-black text-xs px-3 py-1 border-2 border-black">
                    CPM RATE: $2.10 / 1K VIEWS
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Kalkulasi estimasi pendapatan kotor dan bersih (55% creator share) dengan fitur beralih mata uang IDR/USD secara instan.
                </p>
                <div className="bg-emerald-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">ESTIMASI GROSS REVENUE</div>
                    <div className="text-xl font-black text-emerald-700">{currency === "IDR" ? "Rp 15.800.000" : "$1,000.00 USD"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">NET CREATOR SHARE (55%)</div>
                    <div className="text-xl font-black text-blue-700">{currency === "IDR" ? "Rp 8.690.000" : "$550.00 USD"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-600 uppercase">PROYEKSI BULANAN</div>
                    <div className="text-xl font-black text-purple-700">{currency === "IDR" ? "Rp 20.540.000" : "$1,300.00 USD"}</div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === "copyright" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <h3 className="font-black text-lg uppercase flex items-center gap-2">
                    <Shield className="w-6 h-6 text-rose-600"/> COPYRIGHT SHIELD & LICENSE GENERATOR
                  </h3>
                  <span className="bg-rose-300 text-black font-black text-xs px-3 py-1 border-2 border-black">
                    STATUS: PROTECTED 🛡️
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Buat lisensi resmi untuk lagu/video Anda, kelola klaim klaim ilegal, dan gunakan surat sanggahan otomatis untuk mempertahankan monetisasi.
                </p>
                <div className="bg-rose-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex justify-between items-center">
                  <div>
                    <div className="font-black text-sm uppercase">LICENSE KEY GENERATED:</div>
                    <code className="text-xs font-bold bg-white px-2 py-1 border border-black inline-block mt-1">
                      AUDIRA-PRO-2026-X892-KL90
                    </code>
                  </div>
                  <span className="bg-black text-yellow-300 font-black text-xs px-3 py-1.5 border border-black">
                    TEMPLATES READY
                  </span>
                </div>
              </div>
            )}

            {activeDemoTab === "scheduler" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <h3 className="font-black text-lg uppercase flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600"/> AUTO PUBLISHER SCHEDULER ENGINE
                  </h3>
                  <span className="bg-purple-300 text-black font-black text-xs px-3 py-1 border-2 border-black">
                    CELERY BEAT ACTIVE
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Jadwalkan rilis video otomatis pada jam-jam puncak penonton tanpa perlu membuka YouTube Studio secara manual.
                </p>
                <div className="bg-purple-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000] flex justify-between items-center">
                  <div>
                    <div className="font-black text-sm uppercase">NEXT SCHEDULED UPLOAD:</div>
                    <div className="text-xs font-bold text-purple-900 mt-1">"Audira Music Network Vol. 4" — Hari ini, 19:00 WIB</div>
                  </div>
                  <span className="bg-green-300 text-black font-black text-xs px-3 py-1.5 border border-black">
                    READY TO PUBLISH
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. GLOBAL PRICING MATRIX SECTION */}
      <section id="pricing" className="py-20 px-6 bg-[#FFFDF5] border-b-4 border-black">
        <div className="max-w-[1500px] mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="bg-emerald-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000]">
                TRANSPARAN & TANPA BIAYA TERSEMBUNYI
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black uppercase tracking-tighter">
              PILIH PAKET LISENSI AUDIRA YT
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-700">
              Mulai dari langganan bulanan hingga lisensi permanen Full Source Code di Server Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx}
                className={`bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] flex flex-col justify-between relative ${plan.popular ? 'ring-4 ring-yellow-400 -translate-y-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-300 text-black font-black text-[11px] uppercase px-4 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="text-xs font-black bg-gray-100 text-black px-2.5 py-1 border border-black inline-block uppercase mb-3">
                    {plan.badge}
                  </div>
                  <h3 className="font-black text-xl uppercase text-black">{plan.name}</h3>
                  <div className="my-4 pb-4 border-b-3 border-black">
                    <span className="text-4xl font-black text-slate-900">
                      {currency === "IDR" ? plan.priceIdr : plan.priceUsd}
                    </span>
                    <span className="text-xs font-bold text-gray-600 ml-1">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 my-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-xs font-bold text-slate-800 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/login"
                  className={`w-full py-4 text-center text-xs uppercase font-black transition-all ${plan.btnClass}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-20 px-6 bg-white border-b-4 border-black">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="bg-cyan-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] inline-block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
              PERTANYAAN UMUM SEPUTAR AUDIRA YT MONITOR
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-[#FFFDF5] border-3 border-black p-5 shadow-[4px_4px_0_0_#000] cursor-pointer hover:bg-yellow-50 transition-colors"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <h3 className="font-black text-sm uppercase flex items-center gap-2 text-slate-900">
                    <HelpCircle className="w-4 h-4 text-black shrink-0" />
                    {faq.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                {activeFaq === idx && (
                  <p className="text-xs font-bold text-gray-700 mt-3 pt-3 border-t-2 border-black/10 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. FOOTER SECTION */}
      <footer className="bg-black text-white pt-12 pb-8 px-6">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-gray-800 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-300 text-black border-2 border-white flex items-center justify-center font-black">
              <PlaySquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tighter uppercase text-yellow-300 block">AUDIRA YOUTUBE INTELLIGENCE</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Self-Hosted Autonomous System</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-black text-xs uppercase text-gray-300">
            <Link href="/login" className="hover:text-yellow-300">LOGIN SUPERADMIN</Link>
            <Link href="/register" className="hover:text-yellow-300">REGISTRASI</Link>
            <a href="#hero" className="hover:text-yellow-300">BERANDA</a>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] font-bold text-gray-400 gap-3">
          <div>&copy; {new Date().getFullYear()} Audira Digital Network. All Rights Reserved.</div>
          <div className="flex items-center gap-2 text-yellow-300 font-black">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"/> MINI PC SERVER ONLINE (192.168.100.178)
          </div>
        </div>
      </footer>

    </div>
  )
}
