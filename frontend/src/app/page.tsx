"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  PlaySquare, ArrowRight, ShieldCheck, Zap, LineChart, Users, Video, 
  TrendingUp, Activity, CheckCircle2, Globe, Sparkles, Lock, BarChart2, 
  Layers, ChevronRight, LogIn, ExternalLink, Database, Cpu, Mail,
  Bot, RefreshCw, Radio, Bell, ArrowUpRight, HelpCircle, Check, ChevronDown,
  ShoppingBag, CreditCard, CheckSquare, PhoneCall, Sparkle, Star, Crown, UserPlus, KeyRound
} from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  
  // Hero Embedded Login Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("audira_token")
      const user = localStorage.getItem("audira_user")
      if (token && user) {
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
      }
    }
  }, [])

  const handleHeroLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Username/Email dan kata sandi wajib diisi!")
      return
    }

    try {
      setLoading(true)
      setErrorMsg("")

      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      })

      if (res.ok) {
        const data = await res.json()
        if (typeof window !== "undefined") {
          localStorage.setItem("audira_token", data.access_token || "audira_superadmin_active_session")
          localStorage.setItem("audira_user", JSON.stringify({
            ...(data.user || {}),
            role: data.user?.role || "SUPERADMIN",
            name: data.user?.name || "Audira",
            email: data.user?.email || "audira@audira.com"
          }))
        }
        router.push("/dashboard")
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.detail || "Otentikasi gagal. Periksa Username/Email dan kata sandi Anda.")
      }
    } catch (err) {
      console.error("Login failed", err)
      setErrorMsg("Gagal terhubung ke server auth API.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFillAudira = () => {
    setEmail("Audira")
    setPassword("Sigma1993")
    setErrorMsg("")
  }

  const channelsList = [
    { name: "Pop & Hits Network", feature1: "⚡ REALTIME MONITORED", feature2: "🤖 TELEGRAM NOTIFIER", bg: "bg-amber-50 border-amber-300", tag: "POP & TRENDING", status: "TOP PERFORMER", golden: "19:00 - 22:00 WIB" },
    { name: "Lo-Fi & Chill Radio", feature1: "📈 VELOCITY DETECTOR", feature2: "📊 60M PULSE INTERVAL", bg: "bg-sky-50 border-sky-300", tag: "CHILL & AMBIENT", status: "VIRAL SURGE", golden: "20:00 - 23:00 WIB" },
    { name: "Dangdut Classic Hub", feature1: "🎯 VIRALITY SCORE 94+", feature2: "🔒 OAUTH SECURED", bg: "bg-rose-50 border-rose-300", tag: "DANGDUT CLASSIC", status: "STABLE", golden: "18:00 - 21:00 WIB" },
    { name: "Traditional Folk Media", feature1: "⚡ 24/7 AUTO-SYNC", feature2: "🤖 INSTANT ALERTS", bg: "bg-emerald-50 border-emerald-300", tag: "ETHNIC & FOLK", status: "GROWING", golden: "17:00 - 20:00 WIB" },
    { name: "Reggae & Urban Beats", feature1: "📈 GROWTH ANALYTICS", feature2: "💰 IDR ESTIMATOR", bg: "bg-purple-50 border-purple-300", tag: "REGGAE BEATS", status: "MONETIZED", golden: "21:00 - 00:00 WIB" },
    { name: "Jazz & Acoustic Lounge", feature1: "🎯 GOLDEN HOUR AI", feature2: "🛡️ ENTERPRISE ENGINE", bg: "bg-orange-50 border-orange-300", tag: "ACOUSTIC LOUNGE", status: "MONETIZED", golden: "19:00 - 22:00 WIB" },
  ]

  const pricingPlans = [
    {
      name: "STARTER MONITOR",
      price: "Rp 299.000",
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
      price: "Rp 599.000",
      period: "/ bulan",
      badge: "PALING POPULER & BEST SELLER 🔥",
      popular: true,
      features: [
        "Hingga 10 YouTube Channels Monitoring",
        "Multi-App Google OAuth Credentials (3 Apps)",
        "Server Terdedikasi 24/7 Autopilot",
        "Bot Telegram Instant Surge & Event Notifier",
        "Analitik Virality Score 0-100 & Jam Emas AI",
        "Dukungan Prioritas & Update Fitur Otomatis"
      ],
      cta: "BELI PAKET PRO ENTERPRISE",
      btnClass: "bg-amber-400 hover:bg-amber-500 text-black border-2 border-black shadow-[4px_4px_0_0_#000] font-black"
    },
    {
      name: "ULTIMATE LISENSI",
      price: "Rp 999.000",
      period: "/ lisensi penuh",
      badge: "SELF-HOSTED FULL CODE 🚀",
      popular: false,
      features: [
        "UNLIMITED YouTube Channels & Akun Google",
        "Full Source Code & Setup di Server Mini PC",
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
      q: "Bagaimana cara mengakses dashboard sistem dengan akun Audira?",
      a: "Anda dapat langsung memasukkan Username 'Audira' dan Kata Sandi 'Sigma1993' pada form login di atas, atau klik tombol 'KREDENSIAL AUDIRA' untuk pengisian otomatis."
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
      q: "Bagaimana fitur Multi-App OAuth mengamankan akun Google?",
      a: "Setiap token Google OAuth terenkripsi dengan algoritma AES-256 Fernet 32-byte. Ketika token akses kadaluarsa, sistem akan memperbarui token secara otomatis di latar belakang."
    }
  ]

  return (
    <div className="min-h-screen bg-[#FFFDF5] font-sans text-slate-900 flex flex-col selection:bg-yellow-300 selection:text-black">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-yellow-300 border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_#000]">
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
            <a href="#login-section" className="hover:underline flex items-center gap-1.5"><Crown className="w-4 h-4 text-black"/> LOGIN AUDIRA</a>
            <a href="#pricing" className="hover:underline flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-black"/> PAKET HARGA</a>
            <a href="#features" className="hover:underline flex items-center gap-1.5"><Zap className="w-4 h-4 text-black"/> FITUR SISTEM</a>
            <a href="#faq" className="hover:underline flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-black"/> FAQ</a>
          </nav>

          {/* CTA Header Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard"
                className="bg-black text-yellow-300 font-black px-6 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 animate-spin text-yellow-300"/> MASUK DASHBOARD <ArrowRight className="w-4 h-4 text-yellow-300" />
              </Link>
            ) : (
              <Link 
                href="/login"
                className="bg-black text-yellow-300 font-black px-6 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-yellow-300"/> LOGIN SUPERADMIN
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER & LOGIN EMBEDDED SECTION */}
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
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none text-black">
                PLATFORM INTELISEN & <span className="bg-yellow-300 px-3 border-3 border-black shadow-[4px_4px_0_0_#000] inline-block mt-1">MONETISASI</span> YOUTUBE 24/7
              </h1>

              <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed max-w-xl">
                Pemantauan performa <strong>Multi-Channel YouTube Network</strong> & <strong>Google OAuth Apps</strong> terisolasi. Didukung kalkulasi jam emas posting (WIB), virality score 0-100, dan notifikasi lonjakan penonton ke Telegram!
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <a 
                  href="#login-section"
                  className="bg-black text-yellow-300 font-black text-sm uppercase px-7 py-3.5 border-3 border-black shadow-[5px_5px_0_0_#000] hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2.5"
                >
                  <Crown className="w-5 h-5 text-yellow-300 fill-current"/> OTENTIKASI SUPERADMIN &rarr;
                </a>

                <Link 
                  href="/register"
                  className="bg-cyan-300 hover:bg-cyan-400 text-black font-black text-sm uppercase px-7 py-3.5 border-3 border-black shadow-[5px_5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2.5"
                >
                  <UserPlus className="w-5 h-5 text-black"/> REGISTRASI AKUN BARU
                </Link>
              </div>

              {/* Metrics Badge Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 font-mono">
                <div className="bg-amber-100 border-3 border-black p-3.5 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-xl font-black text-black">6 CHANNELS</span>
                  <span className="text-[9px] font-black uppercase text-slate-800">Verified IDs</span>
                </div>
                <div className="bg-emerald-100 border-3 border-black p-3.5 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-xl font-black text-emerald-950">3 OAUTH APPS</span>
                  <span className="text-[9px] font-black uppercase text-emerald-900">Multi-Credential</span>
                </div>
                <div className="bg-pink-100 border-3 border-black p-3.5 shadow-[3px_3px_0_0_#000]">
                  <span className="block text-xl font-black text-pink-950">24/7 ONLINE</span>
                  <span className="text-[9px] font-black uppercase text-pink-900">Dedicated Engine</span>
                </div>
              </div>

            </div>

            {/* Hero Right: Embedded Login Card */}
            <div id="login-section" className="lg:col-span-6">
              
              <div className="bg-white border-4 border-black p-7 shadow-[10px_10px_0_0_#000] relative">
                
                {/* Card Top Pill */}
                <div className="flex justify-between items-center mb-5 pb-3 border-b-3 border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full border border-black"/>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full border border-black"/>
                    <div className="w-3 h-3 bg-green-500 rounded-full border border-black"/>
                    <span className="font-black text-xs uppercase tracking-wider text-black ml-1">
                      SUPERADMIN LOGIN PORTAL
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFillAudira}
                    className="bg-yellow-300 text-black font-black text-[10px] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-yellow-400 uppercase active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    title="Isi otomatis username Audira dan password Sigma1993"
                  >
                    ⚡ ISIKAN AUDIRA / SIGMA1993
                  </button>
                </div>

                <form onSubmit={handleHeroLogin} className="space-y-4">
                  
                  {/* Email / Username Field */}
                  <div>
                    <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5"/> USERNAME / EMAIL SUPERADMIN:
                    </label>
                    <input 
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
                      placeholder="Ketik Username (Audira) atau Email"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-black uppercase flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5"/> KATA SANDI:
                      </label>
                      <Link href="/forgot-password" className="text-[10px] font-black uppercase underline hover:text-amber-600">
                        LUPA KATA SANDI?
                      </Link>
                    </div>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
                      placeholder="Masukkan Kata Sandi (Sigma1993)"
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-red-200 border-2 border-black p-2.5 text-xs font-black text-red-900 uppercase shadow-[2px_2px_0_0_#000]">
                      🚨 {errorMsg}
                    </div>
                  )}

                  {/* Submit Login Button */}
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-yellow-300 hover:bg-slate-900 text-xs font-black py-3.5 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin text-yellow-300"/> : <Zap className="w-4 h-4 text-yellow-300 fill-current"/>}
                    {loading ? "AUTHENTICATING..." : "⚡ MASUK SEBAGAI SUPERADMIN"}
                  </button>

                </form>

                <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-[10px] font-black uppercase">
                  <Link href="/register" className="text-cyan-800 hover:underline">
                    + REGISTRASI AKUN BARU
                  </Link>
                  <Link href="/forgot-password" className="text-rose-800 hover:underline">
                    🔑 RESET KATA SANDI
                  </Link>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. PAKET HARGA & LISENSI */}
      <section id="pricing" className="py-20 px-6 bg-white border-b-4 border-black">
        <div className="max-w-[1500px] mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="bg-yellow-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] inline-block">
              PAKET HARGA & LISENSI
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black">
              PILIH PAKET MONITORING KEBUTUHAN ANDA
            </h2>
            <p className="text-xs font-bold text-slate-700 max-w-xl mx-auto uppercase">
              Akses penuh ke sistem intelijen monitoring 24/7 dan otomatisasi Bot Telegram.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`bg-white border-4 border-black p-7 shadow-[8px_8px_0_0_#000] flex flex-col justify-between relative ${plan.popular ? 'bg-amber-50 ring-4 ring-yellow-400' : ''}`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase bg-black text-yellow-300 px-3 py-1 border border-black inline-block mb-3">
                    {plan.badge}
                  </span>

                  <h3 className="font-black text-xl uppercase tracking-tight text-black mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-black text-black">{plan.price}</span>
                    <span className="text-xs font-bold text-slate-600">{plan.period}</span>
                  </div>

                  <hr className="border-t-2 border-black mb-5" />

                  <ul className="space-y-3 text-xs font-bold text-slate-900">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-2">
                  <a
                    href="https://wa.me/6281234567890?text=Halo%20Tim%20Audira,%20saya%20tertarik%20membeli%20Lisensi%20Audira%20YT"
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-3 rounded-none font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${plan.btnClass}`}
                  >
                    <ShoppingBag className="w-4 h-4" /> {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 px-6 bg-[#FFFDF5]">
        <div className="max-w-[1200px] mx-auto space-y-10">
          
          <div className="text-center space-y-2">
            <span className="bg-cyan-300 text-black font-black text-xs uppercase px-4 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] inline-block">
              PERTANYAAN UMUM
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black">
              FREQUENTLY ASKED QUESTIONS (FAQ)
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000] cursor-pointer hover:bg-yellow-50 transition-all"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <h3 className="font-black text-sm uppercase tracking-tight text-black flex items-center gap-2">
                    <span className="bg-black text-yellow-300 rounded px-2 py-0.5 text-xs font-black shrink-0">
                      Q{idx+1}
                    </span>
                    {faq.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-black shrink-0 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </div>
                {activeFaq === idx && (
                  <p className="mt-3 pt-3 border-t-2 border-black text-xs font-bold text-slate-800 leading-relaxed pl-8">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-black text-yellow-300 border-t-4 border-black py-10 px-6 font-mono">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-300 text-black font-black flex items-center justify-center border-2 border-black text-sm shadow-[2px_2px_0_0_#fff]">
              YT
            </div>
            <div>
              <span className="font-black text-base uppercase tracking-tight block text-white">AUDIRA INTELLIGENCE MONITOR v2.0</span>
              <span className="text-[10px] font-bold text-yellow-400 uppercase">&copy; 2026 AUDIRA DIGITAL NETWORK. ALL RIGHTS RESERVED.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-black uppercase text-yellow-300">
            <a href="#hero" className="hover:underline">Utama</a>
            <a href="#login-section" className="hover:underline">Login Form</a>
            <a href="#pricing" className="hover:underline">Paket Harga</a>
            <a href="#faq" className="hover:underline">FAQ</a>
            <Link href="/login" className="bg-yellow-300 text-black px-4 py-2 border-2 border-white hover:bg-yellow-400">Login Page</Link>
          </div>

        </div>
      </footer>

    </div>
  )
}
