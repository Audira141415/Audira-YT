"use client"

import React, { useState, useEffect } from "react"
import { 
  Target, Plus, RefreshCw, Trash2, ExternalLink, Sparkles, 
  Flame, TrendingUp, Users, Video, ShieldAlert, Eye, Loader2, 
  Zap, ArrowUpRight, Search, Radio, CheckCircle2, AlertCircle
} from "lucide-react"
import { getApiBaseUrl, fetchWithAuth } from "@/lib/api"

interface CompetitorVideoItem {
  id: string;
  video_id: string;
  title: string;
  thumbnail: string;
  views: number;
  velocity: number;
  is_viral: boolean;
}

interface CompetitorChannelItem {
  id: string;
  channel_id: string;
  handle: string;
  name: string;
  avatar: string;
  niche: string;
  subscriber_count: number;
  total_views: number;
  video_count: number;
  is_active: boolean;
  videos: CompetitorVideoItem[];
  last_sync: string;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputHandle, setInputHandle] = useState("");
  const [inputNiche, setInputNiche] = useState("Dangdut");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/competitors`);
      if (res.ok) {
        const data = await res.json();
        setCompetitors(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load competitors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle || !inputHandle.trim()) {
      return alert("Silakan masukkan Handle (@nama) atau Channel ID YouTube.");
    }

    try {
      setIsSubmitting(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_input: inputHandle.trim(),
          niche: inputNiche
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Channel kompetitor berhasil ditambahkan ke radar!");
        setInputHandle("");
        setShowAddModal(false);
        fetchCompetitors();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.detail || "Terjadi kesalahan saat menambahkan kompetitor."}`);
      }
    } catch (err) {
      console.error("Error adding competitor", err);
      alert("Gagal menghubungi server backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompetitor = async (id: string, name: string) => {
    if (!confirm(`Hapus channel kompetitor "${name}" dari radar pemantauan?`)) return;

    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/competitors/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCompetitors(prev => prev.filter(c => c.id !== id));
        alert(`Channel "${name}" berhasil dihapus dari radar.`);
      }
    } catch (err) {
      console.error("Failed to delete competitor", err);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/competitors/sync`, { method: "POST" });
      if (res.ok) {
        alert("Radar Intelijen Kompetitor berhasil diperbarui!");
        fetchCompetitors();
      }
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setSyncing(false);
    }
  };

  // Filtered List
  const filtered = competitors.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.handle && c.handle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchNiche = selectedNiche === "ALL" || c.niche.toUpperCase() === selectedNiche.toUpperCase();
    return matchSearch && matchNiche;
  });

  const totalSubsAll = competitors.reduce((acc, c) => acc + (c.subscriber_count || 0), 0);
  const totalViewsAll = competitors.reduce((acc, c) => acc + (c.total_views || 0), 0);
  const viralVidsCount = competitors.reduce((acc, c) => acc + c.videos.filter(v => v.is_viral).length, 0);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 font-sans pb-24">
      {/* 🌟 HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-50 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] rounded-none">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-300 border-2 border-black font-black text-xs uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse fill-current" /> RADAR INTELIJEN KOMPETITOR (24/7 ACTIVE)
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900">
            COMPETITOR & BENCHMARK RADAR
          </h1>
          <p className="text-slate-700 font-medium text-sm mt-1">
            Pantau channel kompetitor di niche Dangdut, Pop, Jazz & dapatkan notifikasi instan Telegram saat kompetitor rilis video baru / meledak viral.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleTriggerSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-3 border-black font-black text-xs uppercase tracking-wider hover:bg-slate-100 shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-black ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? "SCANNING RADAR..." : "SCAN INTEL KINI"}
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 border-3 border-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" /> TAMBAH TARGET RADAR
          </button>
        </div>
      </div>

      {/* 📊 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border-3 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="font-black text-xs uppercase tracking-wider">TARGET RADAR AKTIF</span>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{competitors.length} CHANNELS</div>
          <p className="text-xs text-slate-500 font-semibold mt-1">Dipantau berkala per 15 menit</p>
        </div>

        <div className="bg-white border-3 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="font-black text-xs uppercase tracking-wider">TOTAL VIEWS KOMPETITOR</span>
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalViewsAll.toLocaleString()}</div>
          <p className="text-xs text-slate-500 font-semibold mt-1">Agregat total penonton pasar</p>
        </div>

        <div className="bg-white border-3 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="font-black text-xs uppercase tracking-wider">VIDEO VIRAL KOMPETITOR</span>
            <Flame className="w-5 h-5 text-red-600 fill-current" />
          </div>
          <div className="text-3xl font-black text-red-600">{viralVidsCount} VIDEOS</div>
          <p className="text-xs text-slate-500 font-semibold mt-1">Velocity &gt; 200 views/jam</p>
        </div>

        <div className="bg-white border-3 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="font-black text-xs uppercase tracking-wider">TOTAL AUDIENS KOMPETITOR</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalSubsAll.toLocaleString()}</div>
          <p className="text-xs text-slate-500 font-semibold mt-1">Potensi jangkauan niche target</p>
        </div>
      </div>

      {/* 🔍 FILTER & NICHE TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border-3 border-black p-4 shadow-[5px_5px_0_0_#000]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Cari target kompetitor atau handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-black font-semibold text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "Dangdut", "Pop", "Jazz", "Reggae", "General"].map((niche) => (
            <button
              key={niche}
              onClick={() => setSelectedNiche(niche)}
              className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedNiche.toUpperCase() === niche.toUpperCase()
                  ? "bg-black text-white shadow-[2px_2px_0_0_#ca8a04]"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              {niche}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 COMPETITORS LIST / GRID */}
      {loading ? (
        <div className="bg-white border-3 border-black p-12 text-center shadow-[6px_6px_0_0_#000]">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-3" />
          <p className="font-black text-xs uppercase tracking-wider text-slate-700">MEMINDAI RADAR KOMPETITOR 24/7...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-3 border-black p-12 text-center shadow-[6px_6px_0_0_#000]">
          <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-black text-base uppercase text-slate-900">BELUM ADA TARGET KOMPETITOR</h3>
          <p className="text-xs text-slate-600 font-semibold mt-1 mb-4">
            Tambahkan handle YouTube kompetitor (misal: @nama_channel) untuk mulai melacak video & lonjakan mereka.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-yellow-400 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_0_#000]"
          >
            + Tambah Target Radar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((comp) => (
            <div key={comp.id} className="bg-white border-3 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 border-b-2 border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={comp.avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=comp"} 
                      alt={comp.name} 
                      className="w-12 h-12 rounded-full border-2 border-black object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-slate-900">{comp.name}</h3>
                        <span className="px-2 py-0.5 bg-purple-100 border border-purple-800 text-purple-900 font-extrabold text-[10px] uppercase">
                          {comp.niche}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono font-bold">{comp.handle || comp.channel_id}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteCompetitor(comp.id, comp.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-600 transition-all"
                    title="Hapus target radar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border-2 border-black p-3 mb-4 text-center">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">SUBSCRIBERS</div>
                    <div className="text-sm font-black text-slate-900">{comp.subscriber_count.toLocaleString()}</div>
                  </div>
                  <div className="border-x-2 border-slate-200">
                    <div className="text-[10px] font-black text-slate-500 uppercase">TOTAL VIEWS</div>
                    <div className="text-sm font-black text-slate-900">{comp.total_views.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">TOTAL VIDEOS</div>
                    <div className="text-sm font-black text-slate-900">{comp.video_count} Vids</div>
                  </div>
                </div>

                {/* Recent Tracked Videos */}
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-600" /> VIDEO TERBARU DALAM RADAR:
                  </h4>
                  <div className="space-y-2">
                    {comp.videos && comp.videos.length > 0 ? (
                      comp.videos.map(v => (
                        <div key={v.id} className="flex items-center justify-between gap-3 bg-slate-100 p-2.5 border border-slate-300">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {v.is_viral && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                                VIRAL 🔥
                              </span>
                            )}
                            <p className="font-bold text-xs text-slate-900 truncate">{v.title}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <span className="font-extrabold text-xs text-slate-800">
                              {v.views.toLocaleString()} Views
                            </span>
                            <a 
                              href={`https://youtube.com/watch?v=${v.video_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">Belum ada video terdeteksi pada siklus terakhir.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>🔄 Terakhir Dipindai: {comp.last_sync}</span>
                <span className="text-emerald-700 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> RADAR READY
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 MODAL TAMBAH TARGET KOMPETITOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border-4 border-black p-6 md:p-8 max-w-lg w-full shadow-[10px_10px_0_0_#000] relative">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-1 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" /> TAMBAH TARGET RADAR KOMPETITOR
            </h2>
            <p className="text-xs text-slate-600 font-medium mb-6">
              Sistem akan memantau channel kompetitor ini secara publik 24/7 dan memberikan alert Telegram jika mereka rilis video baru atau meledak viral.
            </p>

            <form onSubmit={handleAddCompetitor} className="space-y-4">
              <div>
                <label className="block font-black text-xs uppercase tracking-wider text-slate-900 mb-1.5">
                  HANDLE YOUTUBE ATAU CHANNEL ID *
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: @dangdut_pantura atau UCxxxxxxxxx"
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  required
                  className="w-full p-3 bg-white border-3 border-black font-mono font-bold text-sm text-slate-900 focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-black text-xs uppercase tracking-wider text-slate-900 mb-1.5">
                  KATEGORI NICHE MUSIK / KONTEN
                </label>
                <select 
                  value={inputNiche}
                  onChange={(e) => setInputNiche(e.target.value)}
                  className="w-full p-3 bg-white border-3 border-black font-black text-xs uppercase text-slate-900 focus:outline-none"
                >
                  <option value="Dangdut">Dangdut / Koplo</option>
                  <option value="Pop">Indie / Pop Hits</option>
                  <option value="Jazz">Jazz / Lounge</option>
                  <option value="Reggae">Reggae / Roots</option>
                  <option value="Javanese">Gending / Javanese</option>
                  <option value="General">General Entertainment</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-300">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-white border-2 border-black font-black text-xs uppercase hover:bg-slate-100"
                >
                  BATAL
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-yellow-400 border-3 border-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 shadow-[3px_3px_0_0_#000]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                  {isSubmitting ? "MEMINDAI..." : "AKTIFKAN RADAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
