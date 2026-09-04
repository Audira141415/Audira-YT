"use client"

import React, { useState, useEffect } from "react"
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, 
  DollarSign, FileWarning, BellRing, ExternalLink, Sparkles, Filter, 
  Search, Radio, Shield, Loader2, ArrowUpRight, Play, Eye
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

  const fetchShieldData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithFallback("/copyright-shield/overview");
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load copyright shield data", e);
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
        alert(json.message || "Pemindaian Copyright Shield selesai!");
        fetchShieldData();
      }
    } catch (e) {
      alert("Gagal menjalankan pemindaian.");
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
        alert(json.message || "Peringatan simulasi berhasil dikirim!");
      }
    } catch (e) {
      alert("Gagal mengirim simulasi peringatan.");
    } finally {
      setTestingAlert(false);
    }
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🛡️ Copyright & Monetization Shield
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                24/7 AI Radar Active
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pemantauan Content ID, Dolar Kuning (Limited Ads), dan Status Hak Cipta Musik Real-Time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleTestAlert("YELLOW_DOLLAR")}
            disabled={testingAlert}
            className="px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition flex items-center gap-1.5"
            title="Tes Kirim Notifikasi Dolar Kuning ke Telegram"
          >
            <BellRing className="w-3.5 h-3.5" />
            {testingAlert ? "Mengirim..." : "Simulasi Dolar Kuning"}
          </button>
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Memindai Video..." : "Pindai Seluruh Video"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skor Keamanan Hak Cipta</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Shield className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{data?.health_score_pct ?? 100}%</span>
            <span className="text-xs text-emerald-500/80 font-medium">Aman Termonetisasi</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${data?.health_score_pct ?? 100}%` }} />
          </div>
        </div>

        {/* Green Dollar */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dolar Hijau (Full Ads)</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data?.clean_videos_count ?? 0}</span>
            <span className="text-xs text-slate-400">Video Sehat</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">100% pendapatan masuk ke channel</p>
        </div>

        {/* Yellow Dollar */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dolar Kuning (Limited Ads)</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{data?.yellow_dollar_count ?? 0}</span>
            <span className="text-xs text-slate-400">Perlu Penyesuaian</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Iklan dibatasi oleh YouTube</p>
        </div>

        {/* Content ID Claims */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Klaim Content ID</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><FileWarning className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{data?.content_id_claims_count ?? 0}</span>
            <span className="text-xs text-slate-400">Klaim Audio</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Royalti terbagi dengan pemilik hak cipta</p>
        </div>
      </div>

      {/* Guide & Best Practices */}
      <div className="bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-800/30 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Panduan Manajemen Hak Cipta Lagu Cover & Original (Audira Music)
        </h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Sistem secara otomatis mendeteksi audio metadata. Untuk lagu cover dangdut/pop, pastikan lisensi hak cipta lagu (publishing mechanical license) sudah disematkan pada deskripsi video agar sistem Content ID memproses status bagi hasil resmi (*Cover Song Revenue Share*).
        </p>
      </div>

      {/* Filters & Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari judul video, channel, atau label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "YELLOW", "CLAIMED"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === st 
                    ? "bg-purple-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {st === "ALL" ? "Semua Status" : st === "YELLOW" ? "Dolar Kuning" : "Klaim Content ID"}
              </button>
            ))}
          </div>
        </div>

        {/* Claims List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">Judul Video & Channel</th>
                <th className="pb-3">Status Monetisasi</th>
                <th className="pb-3">Hak Cipta</th>
                <th className="pb-3">Pemegang Hak Cipta / Lagu</th>
                <th className="pb-3">Dampak Monetisasi</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    Memuat status copyright...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-200">Seluruh Video 100% Bersih & Hijau!</p>
                    <p className="text-xs text-slate-500 mt-1">Tidak ditemukan pelanggaran hak cipta, klaim Content ID, atau dolar kuning.</p>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2 max-w-xs">
                      <div className="font-medium text-white line-clamp-1">{claim.title}</div>
                      <div className="text-[11px] text-purple-400 mt-0.5">{claim.channel_name}</div>
                    </td>
                    <td className="py-3">
                      {claim.monetization_status === "LIMITED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                          🟡 Dolar Kuning (Limited)
                        </span>
                      ) : claim.monetization_status === "DEMONETIZED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                          🔴 Dolar Merah (Mati)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          🟢 Dolar Hijau (Normal)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {claim.copyright_status === "CLAIMED_CONTENT_ID" ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                          Content ID Audio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                          Original Music
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200">{claim.claimant_name}</div>
                      <div className="text-[10px] text-slate-500">{claim.claimed_track}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-300">{claim.impact_type}</span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <a
                        href={`https://youtube.com/watch?v=${claim.video_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg inline-flex items-center gap-1 text-[11px] transition"
                      >
                        Buka di YT <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
