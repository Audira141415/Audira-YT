"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Plus, RefreshCw, Filter, User, CheckCircle2, PlaySquare, Clock, 
  PieChart, AlertTriangle, Search, MoreVertical, Trash2, ExternalLink, 
  X, Check, RefreshCcw, ShieldCheck, KeyRound, Loader2, Link2, ChevronDown, ChevronRight, Video, Sparkles, CheckSquare, Square, Mail
} from "lucide-react"
import Link from "next/link"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ERROR">("ALL");

  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Actions Dropdown & Modal State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [channelModalAccount, setChannelModalAccount] = useState<any | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add Channel by Handle Modal
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [selectedTargetAccountId, setSelectedTargetAccountId] = useState<string>("");
  const [customNewEmail, setCustomNewEmail] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8005/api/v1/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data || []);
        if (data && data.length > 0 && !selectedTargetAccountId) {
          setSelectedTargetAccountId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Close 3-dots dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddAccount = async () => {
    try {
      setLoading(true);
      const redirectUri = window.location.origin + "/dashboard/accounts/callback";
      const res = await fetch(`http://localhost:8005/api/v1/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || 'Failed to initiate Google Login'}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server backend");
      setLoading(false);
    }
  }

  const handleAddChannelByHandle = async () => {
    if (!channelInput.trim()) {
      alert("Harap masukkan Handle, Username, atau ID Channel YouTube!");
      return;
    }

    if (selectedTargetAccountId === "NEW_ACCOUNT" && !customNewEmail.trim()) {
      alert("Harap masukkan email akun Google baru (contoh: agusdwiriantoo@gmail.com)!");
      return;
    }

    try {
      setIsAddingChannel(true);
      const payload: any = { 
        channel_input: channelInput.trim()
      };

      if (selectedTargetAccountId === "NEW_ACCOUNT") {
        payload.new_account_email = customNewEmail.trim();
      } else {
        payload.account_id = selectedTargetAccountId || (accounts.length > 0 ? accounts[0].id : null);
      }

      const res = await fetch("http://localhost:8005/api/v1/accounts/add-channel-by-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Gagal: ${errData.detail || 'Channel tidak ditemukan'}`);
        return;
      }

      const data = await res.json();
      alert(`Berhasil! Channel '${data.channel_name}' berhasil terhubung dan ${data.synced_videos} video disinkronkan!`);
      setShowAddChannelModal(false);
      setChannelInput("");
      setCustomNewEmail("");
      await fetchAccounts();

    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server.");
    } finally {
      setIsAddingChannel(false);
    }
  }

  const handleRefreshAll = async () => {
    try {
      setIsSyncingAll(true);
      const res = await fetch("http://localhost:8005/api/v1/accounts/sync-all", { method: "POST" });
      if (res.ok) {
        await fetchAccounts();
        alert("Seluruh akun berhasil disinkronkan!");
      } else {
        alert("Gagal melakukan sinkronisasi massal.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke backend server.");
    } finally {
      setIsSyncingAll(false);
    }
  }

  const handleSyncSingleAccount = async (accId: string) => {
    try {
      setActionLoadingId(accId);
      setActiveMenuId(null);
      const res = await fetch(`http://localhost:8005/api/v1/accounts/${accId}/sync`, { method: "POST" });
      if (res.ok) {
        await fetchAccounts();
        alert("Akun berhasil disinkronkan!");
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.detail || 'Sinkronisasi gagal'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke backend.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleDeleteAccount = async (accId: string, email: string) => {
    setActiveMenuId(null);
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${email}?`)) return;

    try {
      setActionLoadingId(accId);
      const res = await fetch(`http://localhost:8005/api/v1/accounts/${accId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAccounts();
        alert("Akun berhasil dihapus.");
      } else {
        alert("Gagal menghapus akun.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccounts.map(a => a.id));
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  // Filtered Accounts Logic
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (acc.name && acc.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusTab === "ACTIVE") return acc.status === "ACTIVE";
    if (statusTab === "INACTIVE") return acc.status === "INACTIVE";
    if (statusTab === "ERROR") return acc.status === "ERROR" || acc.errors > 0;
    
    return true;
  });

  // Dynamic Summary Stats
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => a.status === "ACTIVE").length;
  const totalChannels = accounts.reduce((sum, a) => sum + (a.channels || 0), 0);
  const errorAccounts = accounts.filter(a => a.status === "ERROR" || a.errors > 0).length;
  const avgQuota = accounts.length > 0 ? Math.round(accounts.reduce((sum, a) => sum + (a.quotaPct || 0), 0) / accounts.length) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8 relative">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div>
          <div className="inline-block bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] mb-2">
            MULTI-ACCOUNT GOOGLE & YOUTUBE HUB
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">KELOLA AKUN & CHANNEL YOUTUBE</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">Hubungkan banyak akun Google OAuth dan kelola channel YouTube terhubung secara terpusat.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { if(accounts.length>0) setSelectedTargetAccountId(accounts[0].id); setShowAddChannelModal(true); }} 
            className="bg-cyan-300 text-black font-black px-4 py-2.5 border-2 border-black flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase"
          >
            <Link2 className="w-4 h-4 text-black" /> TAMBAH CHANNEL BY HANDLE / ID
          </button>
          <button 
            onClick={handleAddAccount} 
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase"
          >
            <Plus className="w-4 h-4 text-yellow-300" /> OAUTH GOOGLE LOGIN
          </button>
          <button 
            onClick={handleRefreshAll} 
            disabled={isSyncingAll} 
            className="bg-white text-black font-black px-4 py-2.5 border-2 border-black flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} /> {isSyncingAll ? 'REFRESHING...' : 'REFRESH ALL'}
          </button>
        </div>
      </div>

      {/* 6 Vibrant Neo-Brutalist Pop Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: "TOTAL ACCOUNTS", value: totalAccounts.toString(), sub: "Akun terhubung", icon: User, bg: "bg-yellow-300" },
          { title: "ACTIVE ACCOUNTS", value: activeAccounts.toString(), sub: "Sedang aktif", icon: CheckCircle2, iconColor: "text-green-800", bg: "bg-emerald-200" },
          { title: "CHANNELS", value: totalChannels.toString(), sub: "Total channel", icon: PlaySquare, bg: "bg-cyan-200" },
          { title: "LAST SYNC", value: accounts.length > 0 ? accounts[0].lastSync || "Just now" : "-", sub: "Terakhir disinkronkan", icon: Clock, bg: "bg-pink-200" },
          { title: "QUOTA USAGE", value: `${avgQuota}%`, sub: "Rata-rata penggunaan", icon: PieChart, bg: "bg-amber-200" },
          { title: "ERROR ACCOUNTS", value: errorAccounts.toString(), sub: "Perlu perhatian", icon: AlertTriangle, iconColor: errorAccounts > 0 ? "text-red-600" : "text-black", bg: "bg-purple-200" },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border-4 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-transform`}>
            <h3 className="font-black text-[10px] tracking-tight uppercase mb-2 text-black">{card.title}</h3>
            <div className="flex justify-between items-end mb-2">
              <div className="text-3xl font-black tracking-tighter leading-none">{card.value}</div>
              <div className="bg-black p-1.5 border border-black shadow-[1px_1px_0_0_#000]">
                <card.icon className={`w-4 h-4 ${card.iconColor || 'text-white'}`} />
              </div>
            </div>
            <div className="text-gray-800 font-bold text-[10px] mt-auto">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
        
        {/* Tabs & Live Search Bar */}
        <div className="border-b-4 border-black p-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-yellow-50 px-4">
          <div className="flex gap-6 text-[11px] font-black tracking-wider uppercase pt-4 overflow-x-auto w-full md:w-auto">
            {[
              { id: "ALL", label: "ALL ACCOUNTS", count: accounts.length },
              { id: "ACTIVE", label: "ACTIVE", count: accounts.filter(a => a.status === "ACTIVE").length },
              { id: "INACTIVE", label: "INACTIVE", count: accounts.filter(a => a.status === "INACTIVE").length },
              { id: "ERROR", label: "ERROR", count: accounts.filter(a => a.status === "ERROR" || a.errors > 0).length },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                className={`pb-3 -mb-1 px-2 font-black transition-all flex items-center gap-1.5 ${
                  statusTab === tab.id 
                    ? 'text-black border-b-4 border-black bg-white shadow-[2px_0_0_0_#000]' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] font-black px-1.5 py-0.2 border border-black rounded ${statusTab === tab.id ? 'bg-yellow-300 text-black' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative py-2.5 w-full md:w-72 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account email or name..." 
                className="border-2 border-black pl-9 pr-8 py-1.5 text-xs font-bold w-full focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Rows Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-black text-white px-6 py-3 border-b-4 border-black flex items-center justify-between">
            <div className="text-xs font-black uppercase flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-yellow-300"/> {selectedIds.length} Akun Dipilih
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleRefreshAll}
                className="bg-yellow-300 text-black font-black px-3 py-1 border border-black text-xs uppercase hover:bg-yellow-400"
              >
                Sync Selected
              </button>
              <button 
                onClick={() => { setSelectedIds([]); }}
                className="bg-gray-800 text-white font-black px-3 py-1 border border-black text-xs uppercase hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4 py-4 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5">
                    {selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-black"/>
                    ) : (
                      <Square className="w-4 h-4 text-gray-400"/>
                    )}
                  </button>
                </th>
                <th className="p-4 py-4 w-10"></th>
                <th className="p-4 py-4">ACCOUNT & EMAIL</th>
                <th className="p-4 py-4">STATUS</th>
                <th className="p-4 py-4">CONNECTED CHANNELS</th>
                <th className="p-4 py-4">LAST SYNC</th>
                <th className="p-4 py-4 w-40">QUOTA USAGE</th>
                <th className="p-4 py-4">TOKEN STATUS</th>
                <th className="p-4 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center font-black text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black"/> Loading Google accounts from database...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center font-bold text-gray-500 bg-gray-50">
                    Tidak ada akun Google yang ditemukan.<br/>Klik '+ OAUTH GOOGLE LOGIN' atau 'TAMBAH CHANNEL BY HANDLE' di atas.
                  </td>
                </tr>
              ) : filteredAccounts.map((acc, i) => {
                const isExpanded = expandedRowIds.includes(acc.id);
                const isSelected = selectedIds.includes(acc.id);

                return (
                  <React.Fragment key={acc.id || i}>
                    <tr className={`border-b-2 border-black hover:bg-amber-50 transition-colors ${isSelected ? 'bg-yellow-100' : 'bg-white'}`}>
                      
                      {/* Select Checkbox */}
                      <td className="p-4 text-center">
                        <button onClick={() => toggleSelectRow(acc.id)} className="p-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-black"/>
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 hover:text-black"/>
                          )}
                        </button>
                      </td>

                      {/* Expand Arrow */}
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleRowExpand(acc.id)} 
                          className="p-1 hover:bg-yellow-200 border border-black rounded shadow-[1px_1px_0_0_#000] transition-colors"
                          title="Expand channel details"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-black"/> : <ChevronRight className="w-4 h-4 text-black"/>}
                        </button>
                      </td>

                      {/* Account & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shadow-[2px_2px_0_0_#000] ${acc.color || 'bg-black'}`}>
                            {acc.name ? acc.name.substring(0, 2).toUpperCase() : acc.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-sm uppercase leading-tight">{acc.name}</div>
                            <div className="text-xs font-bold text-gray-600">{acc.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000]
                          ${acc.status === 'ACTIVE' ? 'bg-emerald-300 text-black' : acc.status === 'INACTIVE' ? 'bg-yellow-300 text-black' : 'bg-red-300 text-black'}`}>
                          <span className={`w-2 h-2 rounded-full border border-black ${acc.status === 'ACTIVE' ? 'bg-green-700' : 'bg-red-700'}`} />
                          {acc.status}
                        </span>
                      </td>

                      {/* Connected Channels Column with Previews */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-black text-xs bg-cyan-100 border border-black px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
                            {acc.channels} Channels
                          </div>
                          <button 
                            onClick={() => setChannelModalAccount(acc)}
                            className="text-[10px] font-black text-blue-700 hover:underline uppercase flex items-center gap-0.5"
                          >
                            View Modal <ExternalLink className="w-3 h-3"/>
                          </button>
                        </div>
                        
                        {/* Channel Avatar Thumbnails Row */}
                        {acc.channel_items && acc.channel_items.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {acc.channel_items.slice(0, 3).map((ch: any, idx: number) => (
                              ch.avatar ? (
                                <img key={idx} src={ch.avatar} title={ch.name} alt={ch.name} className="w-5 h-5 rounded-full border border-black object-cover" />
                              ) : (
                                <div key={idx} title={ch.name} className="w-5 h-5 rounded-full bg-black text-white text-[8px] font-black flex items-center justify-center border border-black">
                                  {ch.name ? ch.name[0] : "Y"}
                                </div>
                              )
                            ))}
                            {acc.channel_items.length > 3 && (
                              <span className="text-[9px] font-black text-gray-600 ml-1">+{acc.channel_items.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Last Sync */}
                      <td className="p-4">
                        <div className="font-black text-xs">{acc.lastSync}</div>
                        <div className="text-[10px] text-gray-600 font-bold">{acc.syncTime}</div>
                      </td>

                      {/* Quota Usage */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2.5 border-2 border-black bg-gray-200 flex-1 relative w-full overflow-hidden shadow-[1px_1px_0_0_#000]">
                            <div className={`absolute top-0 left-0 bottom-0 
                              ${acc.quotaPct >= 90 ? 'bg-red-500' : acc.quotaPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                              style={{ width: `${Math.max(acc.quotaPct, 5)}%` }}>
                            </div>
                          </div>
                          <span className="font-black text-[10px] w-6">{acc.quotaPct}%</span>
                        </div>
                        <div className="text-[9px] font-bold text-gray-600">{acc.quotaUsed ? acc.quotaUsed.toLocaleString() : 0} / 10,000 units</div>
                      </td>

                      {/* Token Status */}
                      <td className="p-4">
                        <span className={`inline-block border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]
                          ${acc.token === 'VALID' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                          {acc.token}
                        </span>
                      </td>

                      {/* Actions (3-Dots Menu) */}
                      <td className="p-4 text-center relative">
                        {actionLoadingId === acc.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-black"/>
                        ) : (
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === acc.id ? null : acc.id)}
                            className="p-1.5 hover:bg-yellow-200 rounded border-2 border-black bg-white shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}

                        {/* Dropdown Menu */}
                        {activeMenuId === acc.id && (
                          <div ref={menuRef} className="absolute right-4 top-12 bg-white border-4 border-black shadow-[6px_6px_0_0_#000] z-50 w-56 text-left py-1">
                            <button 
                              onClick={() => handleSyncSingleAccount(acc.id)}
                              className="w-full px-3.5 py-2 text-xs font-black uppercase hover:bg-yellow-200 flex items-center gap-2 border-b border-gray-200"
                            >
                              <RefreshCcw className="w-4 h-4 text-blue-600"/> Sync Account
                            </button>
                            <button 
                              onClick={() => { setActiveMenuId(null); setChannelModalAccount(acc); }}
                              className="w-full px-3.5 py-2 text-xs font-black uppercase hover:bg-yellow-200 flex items-center gap-2 border-b border-gray-200"
                            >
                              <PlaySquare className="w-4 h-4 text-purple-600"/> View Channels Modal
                            </button>
                            <button 
                              onClick={() => { setActiveMenuId(null); setSelectedTargetAccountId(acc.id); setShowAddChannelModal(true); }}
                              className="w-full px-3.5 py-2 text-xs font-black uppercase hover:bg-yellow-200 flex items-center gap-2 border-b border-gray-200"
                            >
                              <Link2 className="w-4 h-4 text-emerald-600"/> Add Channel Handle
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(acc.id, acc.email)}
                              className="w-full px-3.5 py-2 text-xs font-black uppercase text-red-600 hover:bg-red-100 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4 text-red-600"/> Delete Account
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>

                    {/* Expandable Sub-Row (Inline Channel Preview Cards) */}
                    {isExpanded && (
                      <tr className="bg-yellow-50 border-b-4 border-black">
                        <td colSpan={9} className="p-5">
                          <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-black">
                              <h4 className="font-black text-xs uppercase flex items-center gap-2">
                                <PlaySquare className="w-4 h-4 text-black"/> CHANNELS DARI {acc.email} ({acc.channel_items?.length || 0})
                              </h4>
                              <button 
                                onClick={() => { setSelectedTargetAccountId(acc.id); setShowAddChannelModal(true); }}
                                className="bg-yellow-300 text-black font-black px-2.5 py-1 border border-black text-[10px] uppercase shadow-[1px_1px_0_0_#000] hover:bg-yellow-400"
                              >
                                + Add Channel to this account
                              </button>
                            </div>

                            {acc.channel_items && acc.channel_items.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {acc.channel_items.map((ch: any) => (
                                  <div key={ch.id} className="border-2 border-black p-3 bg-amber-50 shadow-[2px_2px_0_0_#000] flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      {ch.avatar ? (
                                        <img src={ch.avatar} alt={ch.name} className="w-10 h-10 rounded-full border-2 border-black shrink-0 object-cover" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black shrink-0 text-sm">
                                          {ch.name ? ch.name[0] : "Y"}
                                        </div>
                                      )}
                                      <div className="overflow-hidden">
                                        <h5 className="font-black text-xs uppercase truncate leading-tight">{ch.name}</h5>
                                        <p className="text-[10px] text-gray-600 font-bold truncate">ID: {ch.channel_id}</p>
                                      </div>
                                    </div>
                                    <a 
                                      href={`https://youtube.com/channel/${ch.channel_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-black text-white p-1.5 border border-black shadow-[1px_1px_0_0_#000] hover:bg-gray-800"
                                      title="Open YouTube"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-yellow-300"/>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center text-xs font-bold text-gray-500 border border-dashed border-gray-400">
                                Belum ada channel terhubung pada akun ini. Klik '+ Add Channel' untuk menambahkan.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t-4 border-black flex flex-col sm:flex-row justify-between items-center bg-gray-50 text-xs font-black">
          <div>Showing {filteredAccounts.length} of {accounts.length} Google Accounts</div>
          <div className="text-gray-500 text-[10px] uppercase font-bold mt-1 sm:mt-0">
            PostgreSQL Multi-Account Database Connected
          </div>
        </div>

      </div>

      {/* Modal 1: Connected Channels Modal */}
      {channelModalAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-3">
              <div>
                <h3 className="font-black text-lg uppercase flex items-center gap-2">
                  <PlaySquare className="w-5 h-5"/> CONNECTED CHANNELS
                </h3>
                <p className="text-xs text-gray-600 font-bold">{channelModalAccount.email}</p>
              </div>
              <button onClick={() => setChannelModalAccount(null)} className="p-1 hover:bg-gray-200 border-2 border-black shadow-[2px_2px_0_0_#000]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
              {channelModalAccount.channel_items && channelModalAccount.channel_items.length > 0 ? (
                channelModalAccount.channel_items.map((ch: any) => (
                  <div key={ch.id} className="border-3 border-black p-3.5 flex items-center justify-between bg-yellow-100 shadow-[3px_3px_0_0_#000]">
                    <div className="flex items-center gap-3">
                      {ch.avatar ? (
                        <img src={ch.avatar} alt={ch.name} className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-black text-yellow-300 flex items-center justify-center font-black text-base border-2 border-black shrink-0">
                          {ch.name ? ch.name[0] : "Y"}
                        </div>
                      )}
                      <div>
                        <div className="font-black text-sm uppercase leading-tight">{ch.name}</div>
                        <div className="text-[10px] text-gray-700 font-mono font-bold">ID: {ch.channel_id}</div>
                      </div>
                    </div>
                    <a 
                      href={`https://youtube.com/channel/${ch.channel_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-black text-yellow-300 font-black px-3 py-1.5 text-[10px] uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1"
                    >
                      OPEN <ExternalLink className="w-3 h-3"/>
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-400 text-gray-600 font-bold text-xs">
                  Belum ada channel terhubung pada akun ini.<br/>Tekan 'TAMBAH CHANNEL BY HANDLE' untuk memasukkan channel Anda.
                </div>
              )}
            </div>

            <button onClick={() => setChannelModalAccount(null)} className="w-full bg-black text-white font-black py-2.5 uppercase border-2 border-black shadow-[3px_3px_0_0_#000] text-xs">
              CLOSE MODAL
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Add Channel by Handle Modal */}
      {showAddChannelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-3">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Link2 className="w-5 h-5 text-black"/> TAMBAH CHANNEL KE AKUN
              </h3>
              <button onClick={() => setShowAddChannelModal(false)} className="p-1 hover:bg-gray-200 border-2 border-black shadow-[2px_2px_0_0_#000]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Selector */}
            <div className="mb-4">
              <label className="block text-xs font-black uppercase mb-1">Pilih Akun Google Target:</label>
              <select 
                value={selectedTargetAccountId}
                onChange={(e) => setSelectedTargetAccountId(e.target.value)}
                className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.email} ({acc.name}) - [{acc.channels} channels]
                  </option>
                ))}
                <option value="NEW_ACCOUNT" className="font-black text-green-700 bg-yellow-200">
                  + TAMBAH AKUN GOOGLE BARU... (Contoh: agusdwiriantoo@gmail.com)
                </option>
              </select>
            </div>

            {/* Custom New Email Input Field if NEW_ACCOUNT selected */}
            {selectedTargetAccountId === "NEW_ACCOUNT" && (
              <div className="mb-4 bg-yellow-100 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
                <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-black"/> Email Akun Google Baru:
                </label>
                <input 
                  type="email" 
                  value={customNewEmail}
                  onChange={(e) => setCustomNewEmail(e.target.value)}
                  placeholder="Masukkan email (contoh: agusdwiriantoo@gmail.com)"
                  className="w-full border-2 border-black p-2 text-xs font-bold focus:outline-none bg-white shadow-[1px_1px_0_0_#000]"
                />
              </div>
            )}

            <p className="text-xs font-bold text-gray-700 mb-3">
              Masukkan **Handle YouTube** (contoh: <code className="bg-yellow-200 px-1 border border-black">@AudiraDigitalNetwork</code>), URL Channel, atau Channel ID.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-black uppercase mb-1">Handle / Channel ID / URL</label>
              <input 
                type="text" 
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="Contoh: @AudiraDigitalNetwork atau UC0Wn..."
                className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              />
            </div>

            {/* Quick Click Demo Tags */}
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">Contoh Cepat (Klik untuk isi):</span>
              <div className="flex flex-wrap gap-1.5">
                {["@AudiraDigitalNetwork", "@AudiraReggae", "@AudiraPop", "@AudiraDangdut"].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setChannelInput(tag)}
                    className="text-[9px] font-black bg-cyan-100 hover:bg-cyan-200 border border-black px-2 py-0.5 shadow-[1px_1px_0_0_#000]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleAddChannelByHandle}
                disabled={isAddingChannel}
                className="flex-1 bg-yellow-300 text-black font-black py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex justify-center items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 hover:bg-yellow-400"
              >
                {isAddingChannel ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                {isAddingChannel ? "SEARCHING..." : "FETCH & LINK CHANNEL"}
              </button>
              <button 
                onClick={() => setShowAddChannelModal(false)}
                className="bg-white text-black font-black px-4 py-2.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
