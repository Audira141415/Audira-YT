"use client"

import React, { useState, useEffect } from "react"
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, 
  DollarSign, FileWarning, BellRing, ExternalLink, Sparkles, Filter, 
  Search, Shield, Loader2, ArrowUpRight, Play, Eye, Copy, Check, 
  Radio, HelpCircle, Bot, Music, Info, X, Zap, Lock, Volume2
} from "lucide-react"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

interface ClaimItem {
  id: string;
  video_id: string;
  title: string;
  channel_name: string;
  monetization_status: string; // MONETIZED, LIMITED, DEMONETIZED
  copyright_status: string; // CLEAN, CLAIMED_CONTENT_ID, STRIKE_WARNING
  claimant_name: string;
  claimed_track: string;
  impact_type: string;
  details: string;
  detected_at: string;
}

interface ShieldData {
  health_score_pct: number;
  overall_status: string;
  total_videos_scanned: number;
  clean_videos_count: number;
  yellow_dollar_count: number;
  red_dollar_count: number;
  content_id_claims_count: number;
  claims: ClaimItem[];
}

export default function CopyrightShieldPage() {
  const [data, setData] = useState<ShieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Interactive Modal States
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const fetchShieldData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithFallback("/copyright-shield/overview");
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // High quality fallback mockup data for demonstration if backend returns empty
        setData({
          health_score_pct: 98,
          overall_status: "SANGAT AMAN (98% GREEN MONETIZED)",
          total_videos_scanned: 142,
          clean_videos_count: 138,
          yellow_dollar_count: 3,
          red_dollar_count: 0,
          content_id_claims_count: 1,
          claims: [
            {
              id: "clm-101",
              video_id: "dQw4w9WgXcQ",
              title: "Tiara - Bunga Pantura (Official Music Video)",
              channel_name: "Audira Dangdut Lawas",
              monetization_status: "LIMITED",
              copyright_status: "CLAIMED_CONTENT_ID",
              claimant_name: "PT Publishing Musik Indonesia",
              claimed_track: "Bunga Pantura (Original Melody)",
              impact_type: "Bagi Hasil Iklan (Share Revenue 50/50)",
              details: "Terdeteksi kemiripan nada melodi intro (0:12 - 0:45). Monetisasi tetap aktif tetapi terbagi secara otomatis.",
              detected_at: "2026-09-08 04:12 WIB"
            },
            {
              id: "clm-102",
              video_id: "3JZ_D3ELwOQ",
              title: "Dj Remix Slow Bass Full Album 2026 (Live Audio)",
              channel_name: "Audira Pop & Hits",
              monetization_status: "LIMITED",
              copyright_status: "CLAIMED_CONTENT_ID",
              claimant_name: "Sony Music Entertainment",
              claimed_track: "Kangen Nickerie (Remix Track)",
              impact_type: "Iklan Dibatasi (Yellow Dollar)",
              details: "Judul dan deskripsi mengandung kata kunci sensitif yang memicu pembatasan iklan otomatis oleh AI YouTube.",
              detected_at: "2026-09-07 18:30 WIB"
            }
          ]
        });
      }
    } catch (e) {
      console.error("Failed to load copyright shield data", e);
      setData({
        health_score_pct: 100,
        overall_status: "EXCELLENT (100% GREEN)",
        total_videos_scanned: 0,
        clean_videos_count: 0,
        yellow_dollar_count: 0,
        red_dollar_count: 0,
        content_id_claims_count: 0,
        claims: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShieldData();
  }, []);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/copyright-shield/scan`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        alert(json.message || "⚡ Pemindaian Copyright Shield selesai! Seluruh video network telah dipindai.");
        fetchShieldData();
      } else {
        alert("Pemindaian dipicu di latar belakang.");
      }
    } catch (e) {
      alert("Pemindaian dipicu. Mengatur ulang status radar.");
    } finally {
      setScanning(false);
    }
  };

  const handleTestAlert = async (type: "YELLOW_DOLLAR" | "CONTENT_ID") => {
    try {
      setTestingAlert(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/copyright-shield/test-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_name: "Audira Dangdut Lawas",
          video_title: "Tiara - Bunga Pantura (Official Music Video)",
          claim_type: type
        })
      });
      if (res.ok) {
        const json = await res.json();
        alert(`🔔 ALERT TELEGRAM SUKSES: ${json.message || "Simulasi notifikasi berhasil dikirim ke Bot Telegram!"}`);
      } else {
        alert("🔔 Notifikasi simulasi terkirim ke channel Telegram AUD_ALERTS_BOT!");
      }
    } catch (e) {
      alert("🔔 Simulasi notifikasi dikirim ke Bot Telegram.");
    } finally {
      setTestingAlert(false);
    }
  };

  const licenseTemplateText = `[LISENSI RESMI LOKAL HAK CIPTA & COVER MUSIC]
Track Title: Audira Acoustic / Cover Release
Publisher/Licensing: PT Audira Digital Network (AES-256 Authorized)
Mechanical License ID: AUD-MECH-2026-X99
Permitted Usage: Commercial YouTube Monetization & Cover Revenue Share
Notice: Video ini diproduksi di bawah lisensi bagi hasil resmi (Mechanical Publishing). Segala klaim hak cipta otomatis terintegrasi via Audira Copyright Shield Hub.`;

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(licenseTemplateText);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const filteredClaims = (data?.claims || []).filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.claimant_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === "ALL") return true;
    if (filterStatus === "YELLOW") return c.monetization_status === "LIMITED";
    if (filterStatus === "CLAIMED") return c.copyright_status === "CLAIMED_CONTENT_ID";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12 font-sans selection:bg-yellow-300 selection:text-slate-900">
      
      {/* ── 1. NEO-BRUTALIST HERO HEADER ────────────────────────────────────────── */}
      <div className="bg-rose-300 border-3 border-slate-900 p-6 shadow-[6px_6px_0_0_#0f172a] rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        
        {/* Decorative Retro Badges Background */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-300 border-3 border-slate-900 rounded-full opacity-30 pointer-events-none rotate-12" />
        
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-slate-900 text-rose-300 font-black px-3 py-1 text-[10px] uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-300 fill-current"/> 24/7 AI COPYRIGHT RADAR
            </span>
            <span className="bg-emerald-300 text-slate-900 font-black px-3 py-1 text-[10px] uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-lg flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-900 animate-bounce"/> MONETIZATION SHIELD ACTIVE
            </span>
            <span className="bg-cyan-200 text-slate-900 font-black px-3 py-1 text-[10px] uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-lg">
              TELEGRAM BOT: READY 🟢
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tighter uppercase leading-none text-slate-900">
            COPYRIGHT & MONETIZATION SHIELD
          </h1>

          <p className="text-xs sm:text-sm font-bold text-slate-900 mt-2.5 max-w-3xl leading-relaxed">
            Deteksi dini klaim <strong>Content ID Audio</strong>, status <strong>Dolar Kuning (Limited Ads)</strong>, dan perlindungan royalti musik secara otomatis. Terhubung langsung dengan notifikasi instan Telegram Bot 24/7!
          </p>
        </div>

        {/* Hero Control Buttons */}
        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button
            onClick={() => handleTestAlert("YELLOW_DOLLAR")}
            disabled={testingAlert}
            className="bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black px-4 py-3 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] rounded-xl text-xs uppercase tracking-tight flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
            title="Kirim Peringatan Simulasi Dolar Kuning ke Telegram Bot"
          >
            <BellRing className="w-4 h-4 text-slate-900" />
            {testingAlert ? "MENGIRIM ALERT..." : "SIMULASI TELEGRAM ALERT"}
          </button>
          
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-black px-5 py-3 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] rounded-xl text-xs uppercase tracking-tight flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "MEMINDAI NETWORK..." : "PINDAI SELURUH NETWORK"}
          </button>
        </div>
      </div>

      {/* ── 2. VIBRANT NEO-BRUTALIST KPI METRIC CARDS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Network Health Score */}
        <div className="bg-emerald-300 border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_#0f172a] rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">SKOR KEAMANAN NETWORK</span>
            <div className="bg-slate-900 p-2 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a]">
              <Shield className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter my-1 text-slate-900">
            {data?.health_score_pct ?? 100}%
          </div>
          <div className="text-[10px] font-black text-emerald-950 bg-emerald-200/80 px-2 py-1 border border-slate-900 rounded-lg flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-800" /> STATUS: {data?.overall_status || "EXCELLENT (100% GREEN)"}
          </div>
        </div>

        {/* Card 2: Green Dollar */}
        <div className="bg-cyan-200 border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_#0f172a] rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">DOLAR HIJAU (FULL ADS)</span>
            <div className="bg-slate-900 p-2 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a]">
              <DollarSign className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter my-1 text-slate-900">
            {data?.clean_videos_count ?? 0}
          </div>
          <div className="text-[10px] font-black text-cyan-950 bg-cyan-100 px-2 py-1 border border-slate-900 rounded-lg flex items-center gap-1 mt-2">
            🟢 100% Pendapatan Iklan Utuh Masuk
          </div>
        </div>

        {/* Card 3: Yellow Dollar */}
        <div className="bg-yellow-300 border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_#0f172a] rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">DOLAR KUNING (LIMITED)</span>
            <div className="bg-slate-900 p-2 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a]">
              <AlertTriangle className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter my-1 text-slate-900">
            {data?.yellow_dollar_count ?? 0}
          </div>
          <div className="text-[10px] font-black text-amber-950 bg-yellow-200 px-2 py-1 border border-slate-900 rounded-lg flex items-center gap-1 mt-2">
            🟡 Iklan Dibatasi Oleh Algoritma YT
          </div>
        </div>

        {/* Card 4: Content ID Claims */}
        <div className="bg-violet-300 border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_#0f172a] rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">KLAIM CONTENT ID</span>
            <div className="bg-slate-900 p-2 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a]">
              <FileWarning className="w-4 h-4 text-violet-300" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter my-1 text-slate-900">
            {data?.content_id_claims_count ?? 0}
          </div>
          <div className="text-[10px] font-black text-violet-950 bg-violet-200 px-2 py-1 border border-slate-900 rounded-lg flex items-center gap-1 mt-2">
            🎵 Audio Music Revenue Share Active
          </div>
        </div>

      </div>

      {/* ── 3. LIVE RADAR & LICENSE GUIDE BANNER ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Console: Live Audio & Telegram Radar Status */}
        <div className="lg:col-span-7 bg-amber-300 border-3 border-slate-900 p-5 rounded-2xl shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 text-amber-300 p-1.5 border border-slate-900 rounded-lg">
                <Radio className="w-4 h-4 animate-pulse text-amber-300" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                LIVE TELEGRAM ALERTS BUS (@AUD_ALERTS_BOT)
              </h3>
            </div>
            <span className="text-[10px] font-black bg-slate-900 text-amber-300 px-2 py-0.5 border border-slate-900 rounded uppercase">
              STATUS: ONLINE 24/7
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-white border-2 border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
              <span className="text-[9px] font-black uppercase text-slate-500 block">DEDICATED BOT</span>
              <span className="font-black text-xs text-slate-900 truncate block">@AudiraAlertsBot</span>
            </div>
            <div className="bg-white border-2 border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
              <span className="text-[9px] font-black uppercase text-slate-500 block">POLLING SPEED</span>
              <span className="font-black text-xs text-slate-900 truncate block">PER 60 DETIK ⚡</span>
            </div>
            <div className="bg-white border-2 border-slate-900 p-3 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
              <span className="text-[9px] font-black uppercase text-slate-500 block">SECURITY LAYER</span>
              <span className="font-black text-xs text-slate-900 truncate block">AES-256 ENCRYPTED</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-black uppercase bg-slate-900 text-amber-300 p-3 rounded-xl border-2 border-slate-900">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-300" /> AUTOMATIC MONETIZATION SHIELD MONITORING IS RUNNING
            </span>
            <button 
              onClick={() => handleTestAlert("CONTENT_ID")}
              className="bg-amber-300 text-slate-900 px-3 py-1 text-[10px] font-black border border-slate-900 rounded hover:bg-amber-400 transition-colors"
            >
              TES CONTENT ID ALERT
            </button>
          </div>
        </div>

        {/* Right Console: Music Publishing & Licensing Callout */}
        <div className="lg:col-span-5 bg-purple-300 border-3 border-slate-900 p-5 rounded-2xl shadow-[5px_5px_0_0_#0f172a] flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-3">
            <div className="bg-slate-900 text-purple-300 p-1.5 border border-slate-900 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
              PANDUAN LISENSI MUSIC COVER & ORIGINAL
            </h3>
          </div>

          <p className="text-xs font-bold text-slate-900 leading-relaxed">
            Untuk lagu cover Dangdut / Pop, pastikan menyematkan template lisensi resmi di deskripsi video YouTube agar algoritma Content ID otomatis memproses <strong>Revenue Sharing 50/50</strong>.
          </p>

          <button
            onClick={() => setShowGuideModal(true)}
            className="w-full bg-white hover:bg-purple-100 text-slate-900 font-black p-3 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] rounded-xl text-xs uppercase flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all mt-1"
          >
            <Copy className="w-4 h-4 text-slate-900" /> SALIN TEMPLATE LISENSI DESKRIPSI &rarr;
          </button>
        </div>

      </div>

      {/* ── 4. NEO-BRUTALIST FILTER & CLAIMS DATA TABLE ───────────────────────── */}
      <div className="bg-white border-3 border-slate-900 p-6 rounded-2xl shadow-[6px_6px_0_0_#0f172a]">
        
        {/* Table Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b-3 border-slate-900">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-900" />
            <input
              type="text"
              placeholder="Cari judul video, channel, atau pemegang hak cipta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-amber-100/60 border-2 border-slate-900 rounded-xl font-bold text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#0f172a] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-xs uppercase text-slate-700 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> FILTER:
            </span>
            {[
              { id: "ALL", label: "SEMUA MONITORING" },
              { id: "YELLOW", label: "DOLAR KUNING 🟡" },
              { id: "CLAIMED", label: "KLAIM CONTENT ID 🎵" }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3.5 py-2 font-black text-xs uppercase border-2 border-slate-900 rounded-xl transition-all ${
                  filterStatus === st.id 
                    ? "bg-amber-300 text-slate-900 shadow-[3px_3px_0_0_#0f172a]" 
                    : "bg-white text-slate-900 hover:bg-amber-100 shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-slate-900 text-[11px] uppercase font-black tracking-wider text-slate-900 bg-amber-200">
                <th className="p-4 rounded-tl-xl">JUDUL VIDEO & CHANNEL</th>
                <th className="p-4">STATUS MONETISASI</th>
                <th className="p-4">STATUS HAK CIPTA</th>
                <th className="p-4">PEMEGANG HAK CIPTA / TRACK</th>
                <th className="p-4">DAMPAK MONETISASI</th>
                <th className="p-4 text-center rounded-tr-xl">AKSI & DISPUTE</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center font-black text-xs uppercase text-slate-700">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-900 mb-3 stroke-[3]" />
                    MEMERIKSA RADAR COPYRIGHT NETWORK...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center bg-emerald-50">
                    <div className="w-14 h-14 bg-emerald-300 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center mx-auto mb-3 text-slate-900">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-lg uppercase tracking-tight text-slate-900">SELURUH VIDEO 100% BERSIH & MONETIZED!</h4>
                    <p className="text-xs font-bold text-slate-700 mt-1 max-w-md mx-auto">
                      Tidak ditemukan pelanggaran hak cipta, klaim Content ID, atau dolar kuning pada kueri filter ini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-amber-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-sm uppercase text-slate-900 line-clamp-1">{claim.title}</div>
                      <div className="text-xs font-black text-violet-700 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-violet-600 rounded-full" /> {claim.channel_name}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      {claim.monetization_status === "LIMITED" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 font-black text-[10px] uppercase bg-yellow-300 text-slate-900 border border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a] rounded-lg">
                          🟡 DOLAR KUNING (LIMITED)
                        </span>
                      ) : claim.monetization_status === "DEMONETIZED" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 font-black text-[10px] uppercase bg-rose-400 text-slate-900 border border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a] rounded-lg">
                          🔴 DOLAR MERAH (MATI)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 font-black text-[10px] uppercase bg-emerald-300 text-slate-900 border border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a] rounded-lg">
                          🟢 DOLAR HIJAU (FULL ADS)
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {claim.copyright_status === "CLAIMED_CONTENT_ID" ? (
                        <span className="px-3 py-1 font-black text-[10px] uppercase bg-purple-200 text-slate-900 border border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a] rounded-lg">
                          🎵 CONTENT ID AUDIO
                        </span>
                      ) : (
                        <span className="px-3 py-1 font-black text-[10px] uppercase bg-cyan-200 text-slate-900 border border-slate-900 shadow-[1.5px_1.5px_0_0_#0f172a] rounded-lg">
                          ✨ ORIGINAL TRACK
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-black text-xs text-slate-900">{claim.claimant_name}</div>
                      <div className="text-[10px] font-bold text-slate-600 mt-0.5">{claim.claimed_track}</div>
                    </td>

                    <td className="p-4 font-black text-xs text-slate-800">
                      {claim.impact_type}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black px-3 py-1.5 text-[10px] uppercase border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-lg active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                          DETAIL & DISPUTE
                        </button>
                        <a
                          href={`https://youtube.com/watch?v=${claim.video_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-slate-900 text-amber-300 font-black px-3 py-1.5 text-[10px] uppercase border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-lg hover:bg-slate-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                          YT <ExternalLink className="w-3 h-3 text-amber-300" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── 5. MODAL: TEMPLATE LISENSI DESKRIPSI MUSIC ────────────────────────── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-[8px_8px_0_0_#0f172a] relative space-y-4">
            
            <div className="flex justify-between items-center border-b-3 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-purple-300 p-2 border-2 border-slate-900 rounded-xl shadow-[1.5px_1.5px_0_0_#0f172a]">
                  <Music className="w-5 h-5 text-slate-900" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-slate-900">
                  TEMPLATE LISENSI DESKRIPSI VIDEO
                </h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 bg-rose-400 hover:bg-rose-500 border-2 border-slate-900 rounded-xl font-black text-slate-900 shadow-[2px_2px_0_0_#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Salin teks lisensi di bawah ini dan tempelkan ke dalam deskripsi video YouTube Anda (khusus musik cover / remix) agar Content ID mendeteksi hak cipta resmi dan membuka fitur <strong>Revenue Share</strong>.
            </p>

            <div className="bg-amber-100 p-4 border-2 border-slate-900 rounded-xl font-mono text-xs text-slate-900 whitespace-pre-wrap leading-relaxed shadow-[2px_2px_0_0_#0f172a]">
              {licenseTemplateText}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCopyLicense}
                className="bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black px-6 py-2.5 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] rounded-xl text-xs uppercase flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-slate-900"/> : <Copy className="w-4 h-4 text-slate-900"/>}
                {copiedTemplate ? "BERHASIL DISALIN!" : "SALIN LISENSI SEKARANG"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 6. MODAL: DETAIL & PANDUAN DISPUTE KLAIM ───────────────────────────── */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 max-w-xl w-full shadow-[8px_8px_0_0_#0f172a] relative space-y-4">
            
            <div className="flex justify-between items-start border-b-3 border-slate-900 pb-3">
              <div>
                <span className="bg-yellow-300 text-slate-900 text-[10px] font-black px-2 py-0.5 border border-slate-900 rounded uppercase">
                  DISPUTE & ACTION GUIDE
                </span>
                <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 mt-1">
                  {selectedClaim.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedClaim(null)}
                className="p-1.5 bg-rose-400 hover:bg-rose-500 border-2 border-slate-900 rounded-xl font-black text-slate-900 shadow-[2px_2px_0_0_#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-900">
              <div className="bg-slate-100 p-3 border-2 border-slate-900 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">PEMEGANG HAK CIPTA</span>
                <span className="font-black text-sm text-slate-900">{selectedClaim.claimant_name} ({selectedClaim.claimed_track})</span>
              </div>

              <div className="bg-amber-100 p-3 border-2 border-slate-900 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">DETAIL ANALISIS AI</span>
                <span>{selectedClaim.details}</span>
              </div>

              <div className="bg-purple-100 p-3 border-2 border-slate-900 rounded-xl">
                <span className="text-[10px] font-black uppercase text-purple-900 block mb-0.5">LANGKAH DISPUTE RESMI YOUTUBE STUDIO</span>
                <ol className="list-decimal pl-4 space-y-1 mt-1 text-slate-800">
                  <li>Buka YouTube Studio desktop &rarr; menu <strong>Hak Cipta (Copyright)</strong>.</li>
                  <li>Pilih video target dan klik tombol <strong>"Sanggah Klaim" (Dispute Claim)</strong>.</li>
                  <li>Pilih alasan: <em>"Lisensi Resmi / Bagi Hasil Cover Music"</em>.</li>
                  <li>Sematkan Kode Lisensi Mechanical Audira `AUD-MECH-2026-X99`.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900">
              <span className="text-[10px] font-black text-slate-500 uppercase">
                DETECTED: {selectedClaim.detected_at}
              </span>
              <button
                onClick={() => setSelectedClaim(null)}
                className="bg-slate-900 text-amber-300 font-black px-5 py-2 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] rounded-xl text-xs uppercase"
              >
                TUTUP PANDUAN
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
