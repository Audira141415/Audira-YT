"use client"

import { 
  ExternalLink, PlaySquare, Plus, Loader2, Video, Search, RefreshCw, 
  CheckCircle2, Globe, Users, ArrowUpRight, Eye, Layers, Filter, X, Zap, ChevronLeft, ChevronRight,
  Clock, ShieldCheck
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api"

interface Channel {
  id: string;
  channel_id: string;
  name: string;
  avatar: string;
  banner: string;
  country: string;
  videoCount: number;
  totalViews: number;
  subscriberCount: number;
  accountId: string;
  accountEmail: string;
  accountName: string;
  accountColor: string;
  status: string;
  updatedAt: string;
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return "🇮🇩";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  
  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChannels, setTotalChannels] = useState(0);
  const limit = 12;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchChannels = async (page = currentPage) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (selectedAccountFilter !== "ALL") query.append("account_email", selectedAccountFilter);

      const res = await fetch(`${getApiBaseUrl()}/channels?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.items || []);
        setTotalPages(data.pages || 1);
        setTotalChannels(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllBanners = async () => {
    try {
      setSyncingAll(true);
      const res = await fetch(`${getApiBaseUrl()}/accounts/sync-all`, { method: "POST" });
      if (res.ok) {
        alert("SINKRONISASI SUKSES! Data resmi dan statistik YouTube API telah disinkronkan.");
        fetchChannels();
      }
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncSingleChannel = async (channelId: string) => {
    try {
      setSyncingChannelId(channelId);
      const res = await fetch(`${getApiBaseUrl()}/channels/${channelId}/sync-live`, { method: "POST" });
      if (res.ok) {
        const resData = await res.json();
        alert(`SINKRONISASI SUKSES!\nChannel: ${resData.name}\nSubscribers: ${resData.subscribers}\nTotal Views: ${resData.total_views?.toLocaleString()}`);
        fetchChannels();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.detail || 'Gagal sinkronisasi channel'}`);
      }
    } catch (err) {
      console.error("Single sync error", err);
      alert("Gagal menghubungi backend untuk sinkronisasi.");
    } finally {
      setSyncingChannelId(null);
    }
  };

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(() => {
      fetchChannels(currentPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentPage, debouncedSearch, selectedAccountFilter]);

  const SkeletonCard = () => (
    <div className="bg-white border-4 border-black p-0 shadow-[6px_6px_0_0_#000] flex flex-col justify-between animate-pulse overflow-hidden">
      <div className="h-28 bg-gray-300 w-full"></div>
      <div className="p-4 pt-0 -mt-8">
        <div className="w-16 h-16 rounded-full bg-gray-400 border-4 border-black mb-3"></div>
        <div className="w-3/4 h-6 bg-gray-300 mb-2"></div>
        <div className="w-1/2 h-4 bg-gray-200 mb-4"></div>
        <div className="w-full h-16 bg-gray-100 border-2 border-black mb-4"></div>
      </div>
      <div className="p-4 pt-0">
        <div className="w-full h-9 bg-gray-300"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" /> DIRECTORY CHANNEL YOUTUBE RESMI
            </span>
            <span className="bg-emerald-300 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-black animate-spin" /> LIVE SYNC: AKTIF 24/7
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {totalChannels} TOTAL CHANNELS TERHUBUNG
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            MANAJEMEN CHANNEL & REAL-TIME STATS
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Pantau profil visual, banner header resmi langsung dari YouTube Data API v3, subscriber asli, serta performa statistik video secara real-time tanpa simulasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <Link 
            href="/dashboard/accounts" 
            className="bg-black text-cyan-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-300"/> KELOLA VIA ACCOUNTS
          </Link>
          <button 
            onClick={handleSyncAllBanners} 
            disabled={syncingAll}
            className="bg-white text-black font-black px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`}/> SYNC REFRESH ALL
          </button>
        </div>
      </div>

      {/* Filter & Live Search Bar */}
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channel name, ID, or owner email..." 
            className="border-2 border-black pl-9 pr-8 py-2 text-xs font-bold w-full focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Channels Directory Grid */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PlaySquare className="w-5 h-5 text-black"/> DIRECTORY CHANNEL YOUTUBE ({channels.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
        </h2>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
           </div>
        ) : channels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Tidak ada channel yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {channels.map((ch, idx) => {
              const bgColors = ["bg-yellow-100", "bg-cyan-100", "bg-emerald-100", "bg-pink-100", "bg-purple-100", "bg-amber-100"];
              const cardBg = bgColors[idx % bgColors.length];

              const isSyncingThis = syncingChannelId === ch.channel_id || syncingChannelId === ch.id;

              return (
                <div key={ch.id || idx} className={`bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1.5 transition-transform overflow-hidden relative`}>
                  
                  <div>
                    {/* YouTube Banner Header Image */}
                    <div className="h-28 relative border-b-4 border-black bg-gradient-to-r from-zinc-900 via-neutral-800 to-black overflow-hidden flex items-center justify-center">
                      {ch.banner ? (
                        <img 
                          src={ch.banner} 
                          alt={`${ch.name} Banner`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-amber-500 via-rose-600 to-purple-800 p-4">
                          <span className="font-black text-white text-lg uppercase tracking-wider text-center drop-shadow-md">
                            {ch.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      
                      {/* Top Right Badges */}
                      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                          {getFlagEmoji(ch.country)} {ch.country || 'ID'}
                        </span>
                        <span className="bg-emerald-300 text-black text-[10px] font-black px-2 py-0.5 uppercase border border-black shadow-[2px_2px_0_0_#000]">
                          {ch.status}
                        </span>
                      </div>
                    </div>

                    {/* Avatar Overlapping Header & Channel Info */}
                    <div className="p-5 pt-0 relative">
                      <div className="flex justify-between items-end -mt-10 mb-3 relative z-10">
                        {ch.avatar ? (
                          <img src={ch.avatar} alt={ch.name} referrerPolicy="no-referrer" className="w-18 h-18 rounded-full border-4 border-black shadow-[4px_4px_0_0_#000] object-cover bg-white shrink-0" />
                        ) : (
                          <div className="w-18 h-18 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-2xl border-4 border-black shadow-[4px_4px_0_0_#000] uppercase shrink-0">
                            {ch.name ? ch.name[0] : "Y"}
                          </div>
                        )}
                        <span className="bg-yellow-300 text-black text-[10px] font-black px-2.5 py-1 uppercase border-2 border-black shadow-[2px_2px_0_0_#000] tracking-wider">
                          OFFICIAL CHANNEL
                        </span>
                      </div>

                      {/* Title & Channel ID */}
                      <h3 className="font-black text-xl uppercase tracking-tight leading-tight mb-1">{ch.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-gray-500">ID:</span>
                        <code className="bg-yellow-200 text-black text-[11px] font-black px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] font-mono">
                          {ch.channel_id}
                        </code>
                      </div>

                      {/* Detailed Stats Grid Box */}
                      <div className={`${cardBg} border-3 border-black p-3.5 mb-4 shadow-[3px_3px_0_0_#000] flex flex-col gap-2 text-xs`}>
                        <div className="flex justify-between items-center border-b border-black/20 pb-1.5">
                          <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-black"/> SUBSCRIBERS:
                          </span>
                          <span className="font-black text-black text-xs">
                            {(ch.subscriberCount || 0).toLocaleString()} Subs
                          </span>
                        </div>

                        <div className="flex justify-between items-center border-b border-black/20 pb-1.5">
                          <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-black"/> TOTAL VIEWS:
                          </span>
                          <span className="font-black text-black text-xs">{(ch.totalViews || 0).toLocaleString()} Views</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-black/20 pb-1.5">
                          <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-black"/> TOTAL VIDEOS:
                          </span>
                          <span className="font-black text-black text-xs">{ch.videoCount || 0} Videos</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-black/20 pb-1.5">
                          <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-black"/> AKUN PEMILIK:
                          </span>
                          <span className="font-black text-black text-[11px] truncate max-w-[170px]" title={ch.accountEmail}>
                            {ch.accountName || ch.accountEmail.split('@')[0]}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-600 font-bold pt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Terakhir Sync:</span>
                          <span className="font-black text-gray-900">{ch.updatedAt || 'Baru saja'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 flex flex-col gap-2">
                    <button
                      onClick={() => handleSyncSingleChannel(ch.channel_id || ch.id)}
                      disabled={isSyncingThis}
                      className="w-full bg-emerald-400 text-black font-black py-2 px-3 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5 hover:bg-emerald-300 active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                      {isSyncingThis ? "SYNCING TO YOUTUBE..." : "LIVE SYNC YOUTUBE"}
                    </button>
                    <a 
                      href={`https://youtube.com/channel/${ch.channel_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full bg-black text-yellow-300 font-black py-2 px-3 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                    >
                      BUKA DI YOUTUBE <ExternalLink className="w-3 h-3"/>
                    </a>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        <div className="border-t-4 border-black pt-4 flex flex-col md:flex-row justify-between items-center bg-white text-xs font-black gap-4 mt-4">
          <div>Showing {channels.length} of {totalChannels} Channels</div>
          <div className="flex gap-2 items-center">
            <button 
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 border-2 border-black bg-white shadow-[2px_2px_0_0_#000] disabled:opacity-50 hover:bg-yellow-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 bg-yellow-100 border-2 border-black p-1.5 shadow-[2px_2px_0_0_#000]">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button 
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 border-2 border-black bg-white shadow-[2px_2px_0_0_#000] disabled:opacity-50 hover:bg-yellow-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}

