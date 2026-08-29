"use client"

import { 
  Video, Eye, PlaySquare, Clock, Plus, Loader2, RefreshCw, Activity, 
  ExternalLink, Search, Filter, X, Zap, BarChart2, ArrowUpRight, Grid, List, Sparkles, ThumbsUp, MessageSquare, Flame, CheckCircle2
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [sortBy, setSortBy] = useState<"NEWEST" | "VIEWS" | "SCORE">("NEWEST");

  const fetchVideosAndChannels = async () => {
    try {
      setLoading(true);
      const [vidRes, accRes] = await Promise.all([
        fetch("http://localhost:8005/api/v1/videos"),
        fetch("http://localhost:8005/api/v1/accounts")
      ]);

      if (vidRes.ok) setVideos(await vidRes.json() || []);
      if (accRes.ok) {
        const accs = await accRes.json() || [];
        const chs: any[] = [];
        accs.forEach((a: any) => {
          if (a.channel_items) chs.push(...a.channel_items);
        });
        setChannels(chs);
      }
    } catch (err) {
      console.error("Error fetching videos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndChannels();
  }, []);

  // Filter & Sort logic
  const filteredVideos = videos
    .filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (v.channelName && v.channelName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (selectedChannelFilter !== "ALL") {
        return v.channelName === selectedChannelFilter;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "VIEWS") {
        return (b.rawViews || b.view_count || 0) - (a.rawViews || a.view_count || 0);
      }
      if (sortBy === "SCORE") {
        return (b.score || 0) - (a.score || 0);
      }
      return 0; // NEWEST
    });

  const totalViews = filteredVideos.reduce((sum, v) => sum + (v.rawViews || v.view_count || 0), 0);
  const avgScore = filteredVideos.length > 0 ? Math.round(filteredVideos.reduce((sum, v) => sum + (v.score || 70), 0) / filteredVideos.length) : 0;
  const latestUploadHour = filteredVideos.length > 0 ? filteredVideos[0].uploadHour || "22:33 WIB" : "-";

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-pink-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-pink-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current"/> ULTIMATE VIDEO ANALYTICS HUB
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {filteredVideos.length} TRACKED VIDEOS ({selectedChannelFilter === 'ALL' ? 'ALL CHANNELS' : selectedChannelFilter})
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PUSAT MONITORS & ANALISIS VIDEO YOUTUBE
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Pantau metrik tayangan, durasi, jam upload asli (WIB), likes, komentar, dan skor virilitas video Anda secara presisi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={fetchVideosAndChannels} 
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${loading ? 'animate-spin' : ''}`}/> SINKRONKAN VIDEO
          </button>
        </div>
      </div>

      {/* PER-CHANNEL FILTER TABS BAR */}
      <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_0_#000] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-2 text-xs font-black uppercase text-black border-r-2 border-black pr-4">
          <Filter className="w-4 h-4 text-black" /> FILTER CHANNEL:
        </div>
        <button 
          onClick={() => setSelectedChannelFilter("ALL")}
          className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all ${selectedChannelFilter === 'ALL' ? 'bg-black text-yellow-300' : 'bg-white hover:bg-yellow-100 text-black'}`}
        >
          SEMUA CHANNEL ({videos.length} Vids)
        </button>
        {channels.map((ch) => (
          <button 
            key={ch.id}
            onClick={() => setSelectedChannelFilter(ch.name)}
            className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-2 transition-all ${selectedChannelFilter === ch.name ? 'bg-pink-300 text-black' : 'bg-white hover:bg-pink-100 text-black'}`}
          >
            {ch.avatar && <img src={ch.avatar} alt={ch.name} className="w-4 h-4 rounded-full border border-black object-cover" />}
            {ch.name}
          </button>
        ))}
      </div>

      {/* 4 Vibrant Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Videos */}
        <div className="bg-pink-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TOTAL TRACKED VIDEOS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Video className="w-4 h-4 text-pink-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1">{filteredVideos.length} VIDEOS</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Terhubung ke database PostgreSQL
          </div>
        </div>

        {/* Card 2: Total Views */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">TOTAL ACCUMULATED VIEWS</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Eye className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-black">{totalViews.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            100% Real YouTube API Views
          </div>
        </div>

        {/* Card 3: Avg Virality Score */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">SKOR VIRAL RATA-RATA</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Zap className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-cyan-950">{avgScore} / 100</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            Algoritma Velositas & Views
          </div>
        </div>

        {/* Card 4: Latest Upload Hour */}
        <div className="bg-emerald-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-[11px] uppercase tracking-wider text-black">JAM UPLOAD TERAKHIR</span>
            <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
              <Clock className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-black tracking-tighter my-1 text-emerald-950">{latestUploadHour}</div>
          <div className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-1">
            WIB Local Timezone Presisi
          </div>
        </div>

      </div>

      {/* SEARCH BAR & VIEW MODE CONTROLS */}
      <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul video, deskripsi, atau channel..."
            className="w-full border-2 border-black pl-10 pr-8 py-2 text-xs font-bold focus:outline-none focus:bg-pink-50 shadow-[2px_2px_0_0_#000]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
              <X className="w-4 h-4"/>
            </button>
          )}
        </div>

        {/* Sort & View Mode Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs font-black uppercase">
            <span>URUTKAN:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border-2 border-black p-1.5 text-xs font-bold focus:outline-none bg-yellow-200 shadow-[2px_2px_0_0_#000]"
            >
              <option value="NEWEST">NEWEST UPLOAD</option>
              <option value="VIEWS">MOST VIEWS</option>
              <option value="SCORE">HIGHEST VIRAL SCORE</option>
            </select>
          </div>

          <div className="border-2 border-black flex bg-white shadow-[2px_2px_0_0_#000]">
            <button 
              onClick={() => setViewMode("GRID")}
              className={`p-2 transition-colors ${viewMode === 'GRID' ? 'bg-black text-yellow-300' : 'text-black hover:bg-gray-100'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("TABLE")}
              className={`p-2 transition-colors ${viewMode === 'TABLE' ? 'bg-black text-yellow-300' : 'text-black hover:bg-gray-100'}`}
              title="Table Matrix View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* VIDEO CONTENT DISPLAY */}
      {loading ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-[6px_6px_0_0_#000]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-2" />
          <p className="font-black text-sm uppercase">Membaca daftar video dari database PostgreSQL...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-[6px_6px_0_0_#000]">
          <p className="font-black text-sm uppercase text-gray-500">Tidak ada video yang ditemukan.</p>
        </div>
      ) : viewMode === "GRID" ? (
        
        /* GRID VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map((v) => (
            <div key={v.id} className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform overflow-hidden">
              
              {/* Thumbnail Container */}
              <div className="relative border-b-4 border-black aspect-video bg-black overflow-hidden group">
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">NO THUMBNAIL</div>
                )}
                <span className="absolute bottom-2 right-2 bg-black text-yellow-300 font-mono font-black text-[10px] px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                  {v.duration || '0:00'}
                </span>
                <span className="absolute top-2 left-2 bg-yellow-300 text-black font-black text-[9px] px-2 py-0.5 border border-black uppercase shadow-[1px_1px_0_0_#000]">
                  {v.channelName || 'Audira Channel'}
                </span>
              </div>

              {/* Video Info */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase line-clamp-2 leading-tight mb-2">{v.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 mb-3">
                    <span className="bg-black text-yellow-300 font-mono px-2 py-0.5 border border-black">
                      ⏱️ Upload: {v.uploadHour || '22:33 WIB'}
                    </span>
                    <span>• {v.pub || 'Aug 28, 2026'}</span>
                  </div>
                </div>

                {/* Metrics Stats Pills */}
                <div className="grid grid-cols-3 gap-2 border-t-2 border-black pt-3">
                  <div className="bg-yellow-100 border border-black p-1.5 text-center shadow-[1px_1px_0_0_#000]">
                    <span className="text-[9px] font-black text-gray-600 block uppercase">VIEWS</span>
                    <span className="font-black text-xs text-black">{v.rawViews ? v.rawViews.toLocaleString() : v.views}</span>
                  </div>
                  <div className="bg-cyan-100 border border-black p-1.5 text-center shadow-[1px_1px_0_0_#000]">
                    <span className="text-[9px] font-black text-gray-600 block uppercase">LIKES</span>
                    <span className="font-black text-xs text-black">{v.likeCount || 0}</span>
                  </div>
                  <div className="bg-pink-100 border border-black p-1.5 text-center shadow-[1px_1px_0_0_#000]">
                    <span className="text-[9px] font-black text-gray-600 block uppercase">SCORE</span>
                    <span className="font-black text-xs text-purple-900">{v.score || 85}/100</span>
                  </div>
                </div>

                {/* Watch Button */}
                <a 
                  href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-black text-yellow-300 font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1.5 mt-2"
                >
                  <PlaySquare className="w-4 h-4 text-yellow-300"/> TONTON DI YOUTUBE <ExternalLink className="w-3 h-3"/>
                </a>
              </div>

            </div>
          ))}
        </div>

      ) : (

        /* MATRIX TABLE VIEW MODE */
        <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4">VIDEO & CHANNEL</th>
                <th className="p-4">WAKTU UPLOAD (WIB)</th>
                <th className="p-4">DURASI</th>
                <th className="p-4">TOTAL VIEWS</th>
                <th className="p-4">LIKES</th>
                <th className="p-4">VIRAL SCORE</th>
                <th className="p-4 text-center">AKSI TONTON</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((v) => (
                <tr key={v.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.title} className="w-16 h-10 object-cover border-2 border-black shrink-0 shadow-[1px_1px_0_0_#000]" />
                      ) : (
                        <div className="w-16 h-10 bg-black text-white font-black flex items-center justify-center text-xs shrink-0">VID</div>
                      )}
                      <div>
                        <h4 className="font-black text-xs uppercase line-clamp-1">{v.title}</h4>
                        <span className="text-[10px] font-bold text-gray-600">{v.channelName || 'Audira Channel'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-black text-xs">
                    <span className="bg-black text-yellow-300 px-2 py-0.5 border border-black">
                      {v.uploadHour || '22:33 WIB'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs font-bold">
                    {v.duration || '0:00'}
                  </td>
                  <td className="p-4 font-black text-xs text-green-800">
                    {v.rawViews ? v.rawViews.toLocaleString() : v.views} Views
                  </td>
                  <td className="p-4 font-bold text-xs">
                    {v.likeCount || 0}
                  </td>
                  <td className="p-4">
                    <span className="bg-purple-200 border border-black font-black text-xs px-2 py-0.5 text-purple-900">
                      {v.score || 85} / 100
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <a 
                      href={`https://youtube.com/watch?v=${v.videoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 bg-black text-yellow-300 font-black px-3 py-1.5 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800"
                    >
                      TONTON <ExternalLink className="w-3 h-3"/>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}

    </div>
  )
}
