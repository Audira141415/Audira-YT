"use client"

import { 
  ExternalLink, PlaySquare, Plus, Loader2, Video, Search, RefreshCw, 
  CheckCircle2, Globe, Users, ArrowUpRight, Eye, Layers, Filter, X, Zap
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"

export default function ChannelsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("ALL");

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8005/api/v1/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // Collect all channel items across accounts
  const allChannels: any[] = [];
  accounts.forEach(acc => {
    if (acc.channel_items && acc.channel_items.length > 0) {
      acc.channel_items.forEach((ch: any) => {
        allChannels.push({ 
          ...ch, 
          accountId: acc.id,
          accountEmail: acc.email, 
          accountName: acc.name,
          accountColor: acc.color || 'bg-black'
        });
      });
    }
  });

  // Filter channels based on search and account filter
  const filteredChannels = allChannels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ch.channel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ch.accountEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedAccountFilter !== "ALL") {
      return ch.accountEmail === selectedAccountFilter;
    }

    return true;
  });

  const primaryChannel = allChannels.length > 0 ? allChannels[0] : null;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" /> ULTIMATE CHANNELS HUB
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              {allChannels.length} CHANNELS CONNECTED
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            MANAJEMEN CHANNEL YOUTUBE RESMI
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Pantau dan kelola seluruh channel YouTube terhubung di bawah akun Google Anda dalam satu layar interaktif.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <Link 
            href="/dashboard/accounts" 
            className="bg-black text-cyan-300 font-black px-5 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-300"/> TAMBAH CHANNEL VIA ACCOUNTS
          </Link>
          <button 
            onClick={fetchChannels} 
            className="bg-white text-black font-black px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> SYNC REFRESH
          </button>
        </div>
      </div>

      {/* Featured Primary Channel Hero Card */}
      {primaryChannel && (
        <div className="bg-yellow-300 border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 flex-1">
            {primaryChannel.avatar ? (
              <img src={primaryChannel.avatar} alt={primaryChannel.name} className="w-20 h-20 rounded-full border-4 border-black shadow-[4px_4px_0_0_#000] shrink-0 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-2xl border-4 border-black shadow-[4px_4px_0_0_#000] shrink-0 uppercase">
                {primaryChannel.name ? primaryChannel.name[0] : "Y"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase border border-black">FEATURED PRIMARY CHANNEL</span>
                <span className="bg-green-300 text-green-900 border border-black text-[9px] font-black px-2 py-0.5 uppercase">ACTIVE</span>
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-tight">{primaryChannel.name}</h2>
              <p className="text-xs font-bold text-gray-800">Channel ID: <code className="bg-white px-1 border border-black font-mono">{primaryChannel.channel_id}</code></p>
              <p className="text-[10px] font-bold text-gray-700 mt-1">Owner Account: {primaryChannel.accountEmail}</p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <a 
              href={`https://youtube.com/channel/${primaryChannel.channel_id}`} 
              target="_blank" 
              rel="noreferrer"
              className="bg-black text-yellow-300 font-black px-4 py-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 hover:bg-gray-800"
            >
              OPEN ON YOUTUBE <ExternalLink className="w-3.5 h-3.5"/>
            </a>
          </div>
        </div>
      )}

      {/* Filter & Live Search Bar */}
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Account Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-black uppercase text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5"/> FILTER ACCOUNT:
          </span>
          <button 
            onClick={() => setSelectedAccountFilter("ALL")}
            className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
              selectedAccountFilter === "ALL" ? 'bg-yellow-300 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            ALL ACCOUNTS ({allChannels.length})
          </button>
          {accounts.map(acc => (
            <button 
              key={acc.id}
              onClick={() => setSelectedAccountFilter(acc.email)}
              className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
                selectedAccountFilter === acc.email ? 'bg-cyan-300 text-black' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {acc.email.split("@")[0]} ({acc.channels})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channel name or ID..." 
            className="border-2 border-black pl-9 pr-8 py-1.5 text-xs font-bold w-full focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* 4 Vibrant Channels Showcase Grid */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PlaySquare className="w-5 h-5"/> CONNECTED CHANNELS SHOWCASE ({filteredChannels.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Menampilkan channel dari database PostgreSQL</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-black"/> Loading YouTube channels...
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="py-12 text-center font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Tidak ada channel yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredChannels.map((ch, idx) => {
              const bgColors = ["bg-yellow-300", "bg-cyan-200", "bg-emerald-200", "bg-pink-200", "bg-purple-200", "bg-amber-200"];
              const cardBg = bgColors[idx % bgColors.length];

              return (
                <div key={idx} className={`${cardBg} border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between hover:-translate-y-1.5 transition-transform`}>
                  <div>
                    {/* Top Avatar & Status Header */}
                    <div className="flex justify-between items-start mb-4">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt={ch.name} className="w-16 h-16 rounded-full border-3 border-black shadow-[3px_3px_0_0_#000] object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xl border-3 border-black shadow-[3px_3px_0_0_#000] uppercase">
                          {ch.name ? ch.name[0] : "Y"}
                        </div>
                      )}
                      <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                        🇮🇩 {ch.country || 'ID'}
                      </span>
                    </div>

                    {/* Channel Title & Details */}
                    <h3 className="font-black text-lg uppercase tracking-tight leading-tight mb-1">{ch.name}</h3>
                    <p className="text-[10px] font-bold text-gray-800 mb-2">ID: <code className="bg-white px-1 border border-black font-mono">{ch.channel_id}</code></p>
                    
                    <div className="bg-white border-2 border-black p-2 mb-4 text-[10px] font-bold text-gray-700 shadow-[2px_2px_0_0_#000]">
                      <div>Owner: <span className="font-black text-black">{ch.accountEmail}</span></div>
                      <div>Status: <span className="text-green-700 font-black">ACTIVE & SYNCED</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a 
                      href={`https://youtube.com/channel/${ch.channel_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 bg-black text-yellow-300 font-black py-2 px-3 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1 hover:bg-gray-800"
                    >
                      OPEN YOUTUBE <ExternalLink className="w-3 h-3"/>
                    </a>
                    <Link
                      href="/dashboard/videos"
                      className="bg-white text-black font-black py-2 px-3 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center"
                      title="View Videos"
                    >
                      VIDEOS →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detailed Channels Comparison Table */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-6">
        <h2 className="font-black text-sm uppercase mb-4 border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-5 h-5"/> TABEL RINCIAN CHANNEL YOUTUBE ({filteredChannels.length})
          </span>
          <span className="text-xs font-bold text-gray-500">Status Otorisasi & Akses Data</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4">CHANNEL NAME</th>
                <th className="p-4">CHANNEL ID</th>
                <th className="p-4">OWNER ACCOUNT EMAIL</th>
                <th className="p-4">COUNTRY</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.map((ch, idx) => (
                <tr key={idx} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt={ch.name} className="w-9 h-9 rounded-full border-2 border-black object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-black text-white font-black flex items-center justify-center border-2 border-black uppercase text-xs">
                          {ch.name ? ch.name[0] : "Y"}
                        </div>
                      )}
                      <span className="font-black text-sm uppercase">{ch.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 border border-black">{ch.channel_id}</code>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-gray-700">{ch.accountEmail}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-black bg-yellow-200 border border-black px-2 py-0.5">🇮🇩 {ch.country || 'ID'}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-black bg-green-300 border border-black text-black px-2.5 py-1 uppercase shadow-[1px_1px_0_0_#000]">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <a 
                      href={`https://youtube.com/channel/${ch.channel_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 bg-black text-yellow-300 font-black px-3 py-1 text-[10px] uppercase border border-black shadow-[1px_1px_0_0_#000] hover:bg-gray-800"
                    >
                      OPEN <ExternalLink className="w-3 h-3"/>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
