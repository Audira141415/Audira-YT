"use client"

import React, { useState, useEffect } from "react"
import { 
  DollarSign, TrendingUp, BarChart3, PieChart, Sparkles, RefreshCw, 
  ExternalLink, Layers, ArrowUpRight, Check, Sliders, ShieldCheck, PlaySquare, Eye, Music
} from "lucide-react"
import { getApiBaseUrl, fetchWithAuth } from "@/lib/api"

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

import { useRouter } from "next/navigation"
import { Users, Plus, FileText, Printer, CheckCircle2, Download } from "lucide-react"

interface RoyaltyContractItem {
  id: string;
  channel_id: string;
  channel_name: string;
  video_id: string | null;
  track_title: string;
  artist_name: string;
  artist_email: string;
  label_share_pct: number;
  artist_share_pct: number;
  producer_share_pct: number;
  status: string;
  notes: string;
  created_at: string;
}

interface StatementItem {
  contract_id: string;
  track_title: string;
  artist_name: string;
  channel_name: string;
  period: string;
  views: number;
  rpm_idr: number;
  gross_revenue_idr: number;
  label_share_pct: number;
  label_payout_idr: number;
  artist_share_pct: number;
  artist_payout_idr: number;
  producer_share_pct: number;
  producer_payout_idr: number;
  payment_status: string;
}

export default function RevenuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "royalty">("overview");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [customRpm, setCustomRpm] = useState<number>(12000);
  const [savingRpm, setSavingRpm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Royalty Split State
  const [contracts, setContracts] = useState<RoyaltyContractItem[]>([]);
  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [statementsSummary, setStatementsSummary] = useState<any>(null);
  const [loadingRoyalty, setLoadingRoyalty] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("2026-08");

  // New Contract Form State
  const [newTrack, setNewTrack] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newArtistEmail, setNewArtistEmail] = useState("");
  const [newChannelId, setNewChannelId] = useState("");
  const [newLabelPct, setNewLabelPct] = useState(50);
  const [newArtistPct, setNewArtistPct] = useState(30);
  const [newProducerPct, setNewProducerPct] = useState(20);
  const [creatingContract, setCreatingContract] = useState(false);

  // 🔐 Role guard: Only SUPERADMIN / ADMIN can access Revenue page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("audira_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          const role = (user.role || "USER").toUpperCase();
          if (role !== "SUPERADMIN" && role !== "ADMIN") {
            setAccessDenied(true);
          }
        } catch (e) {
          setAccessDenied(true);
        }
      } else {
        router.push("/");
      }
    }
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/revenue/summary`);
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

  const fetchRoyaltyData = async () => {
    try {
      setLoadingRoyalty(true);
      const [contractsRes, statementsRes] = await Promise.all([
        fetchWithAuth(`${getApiBaseUrl()}/royalty/contracts`),
        fetchWithAuth(`${getApiBaseUrl()}/royalty/statements?period=${selectedPeriod}`)
      ]);
      if (contractsRes.ok) {
        const cData = await contractsRes.json();
        setContracts(cData || []);
      }
      if (statementsRes.ok) {
        const sData = await statementsRes.json();
        setStatements(sData.statements || []);
        setStatementsSummary(sData.summary || null);
      }
    } catch (e) {
      console.error("Failed to load royalty data", e);
    } finally {
      setLoadingRoyalty(false);
    }
  };

  useEffect(() => {
    if (!accessDenied) {
      fetchRevenue();
      fetchRoyaltyData();
    }
  }, [accessDenied, selectedPeriod]);

  const handleSaveRpm = async (channelName: string) => {
    try {
      setSavingRpm(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/revenue/rpm-config`, {
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

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrack.trim() || !newArtist.trim()) {
      return alert("Judul lagu dan nama artis wajib diisi!");
    }
    try {
      setCreatingContract(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/royalty/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: newChannelId || (data?.channel_breakdown[0]?.channel_id || "ALL"),
          track_title: newTrack.trim(),
          artist_name: newArtist.trim(),
          artist_email: newArtistEmail.trim(),
          label_share_pct: Number(newLabelPct),
          artist_share_pct: Number(newArtistPct),
          producer_share_pct: Number(newProducerPct)
        })
      });
      if (res.ok) {
        alert("Kontrak bagi hasil musisi berhasil dibuat!");
        setShowContractModal(false);
        setNewTrack("");
        setNewArtist("");
        setNewArtistEmail("");
        fetchRoyaltyData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.detail || "Terjadi kesalahan."}`);
      }
    } catch (e) {
      alert("Gagal menghubungi server.");
    } finally {
      setCreatingContract(false);
    }
  };

  const formatIDR = (val: number) => {
    return `Rp ${(val || 0).toLocaleString("id-ID")}`;
  };

  const handlePrintRoyaltyStatement = () => {
    window.print();
  };

  // \ud83d\udd10 Access denied screen for non-admin users
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="bg-rose-100 border-4 border-black p-10 shadow-[8px_8px_0_0_#000] max-w-lg w-full text-center">
          <div className="text-5xl mb-4">\ud83d\udd12</div>
          <h2 className="font-black text-2xl uppercase tracking-tighter mb-2">Akses Ditolak</h2>
          <p className="text-sm font-bold text-gray-700 mb-6">
            Halaman <strong>Revenue &amp; RPM</strong> hanya dapat diakses oleh <strong>SUPERADMIN</strong> dan <strong>ADMIN</strong>.
          </p>
          <p className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-300 px-4 py-2 inline-block">
            Role Anda: <span className="text-rose-600">{currentUser?.role || "USER"}</span>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Hubungi SUPERADMIN untuk mendapatkan akses ke data finansial platform.
          </p>
        </div>
      </div>
    );
  }

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
            onClick={() => { fetchRevenue(); fetchRoyaltyData(); }}
            disabled={loading || loadingRoyalty}
            className="bg-black text-emerald-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || loadingRoyalty) ? 'animate-spin' : ''}`} /> REFRESH ESTIMASI
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b-4 border-black pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab("overview")}
          className={`font-black text-xs uppercase px-5 py-2.5 border-3 border-black transition shadow-[3px_3px_0_0_#000] flex items-center gap-2 ${
            activeTab === "overview" 
              ? "bg-black text-yellow-300 -translate-y-0.5" 
              : "bg-white text-black hover:bg-yellow-100"
          }`}
        >
          <DollarSign className="w-4 h-4" /> 1. RINGKASAN MONETISASI & RPM CHANNEL
        </button>

        <button
          onClick={() => setActiveTab("royalty")}
          className={`font-black text-xs uppercase px-5 py-2.5 border-3 border-black transition shadow-[3px_3px_0_0_#000] flex items-center gap-2 ${
            activeTab === "royalty" 
              ? "bg-black text-yellow-300 -translate-y-0.5" 
              : "bg-white text-black hover:bg-yellow-100"
          }`}
        >
          <Users className="w-4 h-4" /> 2. BAGI HASIL ARTIS & ROYALTI (SPLIT SHEET)
        </button>
      </div>

      {activeTab === "royalty" ? (
        /* --- 📄 TAB 2: ROYALTY SPLIT & ARTIST STATEMENTS --- */
        <div className="space-y-6">
          {/* Royalty Action & Filter Bar */}
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-black" /> MANAJEMEN SPLIT SHEET & ROYALTI TIM
              </h2>
              <p className="text-xs font-bold text-gray-600 mt-1">
                Kalkulasi otomatis pembagian royalti lagu antara Label Rekaman, Artis Penyanyi, dan Produser Musik.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-yellow-100 border-2 border-black px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                <option value="2026-08">Periode: Agustus 2026</option>
                <option value="2026-07">Periode: Juli 2026</option>
                <option value="2026-06">Periode: Juni 2026</option>
              </select>

              <button
                onClick={handlePrintRoyaltyStatement}
                className="bg-white hover:bg-gray-100 text-black border-2 border-black px-3.5 py-2 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Slip (PDF)
              </button>

              <button
                onClick={() => setShowContractModal(true)}
                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Kontrak Artis
              </button>
            </div>
          </div>

          {/* Royalty KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">TOTAL BRUTO LAGU (GROSS)</span>
              <div className="text-2xl font-black text-black mt-2">
                {formatIDR(statementsSummary?.total_gross_idr || 0)}
              </div>
              <span className="text-[10px] font-bold text-gray-500">Koleksi AdSense Musik</span>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">BAGI HASIL LABEL REKAMAN</span>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {formatIDR(statementsSummary?.total_label_idr || 0)}
              </div>
              <span className="text-[10px] font-bold text-emerald-600">Hak Label (~50%)</span>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">TOTAL ROYALTI PENYANYI</span>
              <div className="text-2xl font-black text-purple-800 mt-2">
                {formatIDR(statementsSummary?.total_artist_idr || 0)}
              </div>
              <span className="text-[10px] font-bold text-purple-600">Hak Artis (~30%)</span>
            </div>

            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000]">
              <span className="text-[10px] font-black uppercase text-gray-600">TOTAL BAGI HASIL PRODUSER</span>
              <div className="text-2xl font-black text-cyan-800 mt-2">
                {formatIDR(statementsSummary?.total_producer_idr || 0)}
              </div>
              <span className="text-[10px] font-bold text-cyan-600">Hak Arranger/Produser (~20%)</span>
            </div>
          </div>

          {/* Royalty Statements Table */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> REKAPITULASI PEMBAYARAN ROYALTI PER LAGU ({selectedPeriod})
              </h3>
              <span className="bg-emerald-300 text-black font-black text-[10px] px-2 py-0.5 border border-black">
                {statements.length} KONTRAK AKTIF
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100 font-black text-gray-800 uppercase text-[10px]">
                    <th className="p-3">Judul Lagu & Artis</th>
                    <th className="p-3">Channel YouTube</th>
                    <th className="p-3">Views Lagu</th>
                    <th className="p-3">Gross AdSense</th>
                    <th className="p-3 bg-emerald-50">Label Share</th>
                    <th className="p-3 bg-purple-50">Royalti Artis</th>
                    <th className="p-3 bg-cyan-50">Produser</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/20 font-bold">
                  {loadingRoyalty ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500 font-black">
                        Memuat data split sheet royalti...
                      </td>
                    </tr>
                  ) : statements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500 font-bold">
                        Belum ada kontrak artis yang terdaftar. Klik tombol Tambah Kontrak di atas.
                      </td>
                    </tr>
                  ) : (
                    statements.map((s, idx) => (
                      <tr key={idx} className="hover:bg-yellow-50/60">
                        <td className="p-3">
                          <div className="font-black text-black">{s.track_title}</div>
                          <div className="text-[10px] text-purple-700 font-extrabold">{s.artist_name}</div>
                        </td>
                        <td className="p-3 text-gray-700">{s.channel_name}</td>
                        <td className="p-3 font-mono">{s.views.toLocaleString()}</td>
                        <td className="p-3 font-mono font-black">{formatIDR(s.gross_revenue_idr)}</td>
                        <td className="p-3 font-mono font-black text-emerald-800 bg-emerald-50/60">
                          {formatIDR(s.label_payout_idr)} <span className="text-[10px] text-gray-500">({s.label_share_pct}%)</span>
                        </td>
                        <td className="p-3 font-mono font-black text-purple-900 bg-purple-50/60">
                          {formatIDR(s.artist_payout_idr)} <span className="text-[10px] text-gray-500">({s.artist_share_pct}%)</span>
                        </td>
                        <td className="p-3 font-mono font-black text-cyan-900 bg-cyan-50/60">
                          {formatIDR(s.producer_payout_idr)} <span className="text-[10px] text-gray-500">({s.producer_share_pct}%)</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-300 text-black border border-black font-black text-[10px] px-2 py-0.5 uppercase">
                            ✓ {s.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Tambah Kontrak Baru */}
          {showContractModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-lg w-full">
                <h3 className="font-black text-lg uppercase mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
                  <Plus className="w-5 h-5 text-black" /> BUAT KONTRAK BAGI HASIL ARTIS BARU
                </h3>

                <form onSubmit={handleCreateContract} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Judul Lagu / Track:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tiara - Cover Dangdut Lawas"
                      value={newTrack}
                      onChange={(e) => setNewTrack(e.target.value)}
                      required
                      className="w-full bg-yellow-50 border-2 border-black p-2 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Nama Penyanyi / Musisi:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Siti Rahmawati"
                        value={newArtist}
                        onChange={(e) => setNewArtist(e.target.value)}
                        required
                        className="w-full bg-yellow-50 border-2 border-black p-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Email Artis (Opsional):</label>
                      <input
                        type="email"
                        placeholder="artis@gmail.com"
                        value={newArtistEmail}
                        onChange={(e) => setNewArtistEmail(e.target.value)}
                        className="w-full bg-yellow-50 border-2 border-black p-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Pilih Channel YouTube:</label>
                    <select
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      className="w-full bg-yellow-50 border-2 border-black p-2 text-xs font-bold focus:outline-none"
                    >
                      {data?.channel_breakdown.map((ch) => (
                        <option key={ch.channel_id} value={ch.channel_id}>
                          {ch.name} (RPM: Rp {ch.rpm_idr.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-100 border-2 border-black p-3 space-y-2">
                    <span className="text-[10px] font-black uppercase text-gray-700 block">Persentase Bagi Hasil (Total 100%):</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 block">Hak Label (%):</label>
                        <input
                          type="number"
                          value={newLabelPct}
                          onChange={(e) => setNewLabelPct(Number(e.target.value))}
                          className="w-full border-2 border-black p-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 block">Hak Artis (%):</label>
                        <input
                          type="number"
                          value={newArtistPct}
                          onChange={(e) => setNewArtistPct(Number(e.target.value))}
                          className="w-full border-2 border-black p-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 block">Hak Produser (%):</label>
                        <input
                          type="number"
                          value={newProducerPct}
                          onChange={(e) => setNewProducerPct(Number(e.target.value))}
                          className="w-full border-2 border-black p-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={() => setShowContractModal(false)}
                      className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-gray-200 hover:bg-gray-300"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={creatingContract}
                      className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-yellow-300 hover:bg-yellow-400 shadow-[2px_2px_0_0_#000]"
                    >
                      {creatingContract ? "Menyimpan..." : "Simpan Kontrak"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- 📊 TAB 1: EXISTING OVERVIEW & RPM BREAKDOWN --- */
        <>
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
      </>
      )}

    </div>
  );
}
