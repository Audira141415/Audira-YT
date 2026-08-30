"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Plus, RefreshCw, Filter, User, CheckCircle2, PlaySquare, Clock, 
  PieChart, AlertTriangle, Search, MoreVertical, Trash2, ExternalLink, 
  X, Check, RefreshCcw, ShieldCheck, KeyRound, Loader2, Link2, ChevronDown, ChevronRight, Video, Sparkles, CheckSquare, Square, Mail,
  ChevronLeft, Download, Shield, Crown, Zap, FileSpreadsheet, FileCode
} from "lucide-react"
import Link from "next/link"
import { getApiBaseUrl, getOAuthRedirectUri } from "@/lib/api"

interface ChannelItem {
  id: string;
  channel_id: string;
  name: string;
  avatar: string;
  country: string;
  video_count?: number;
}

interface Account {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  status: string;
  channels: number;
  channel_items: ChannelItem[];
  lastSync: string;
  syncTime: string;
  quotaUsed: number;
  quotaPct: number;
  token: string;
  tokenExp: string;
  apiStatus: string;
  errors: number;
  color: string;
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return "🇮🇩";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ERROR">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Actions Dropdown & Modal State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // User Role (Mocked as ADMIN for full access UI)
  const [userRole] = useState<"ADMIN" | "MANAGER" | "VIEWER">("ADMIN");

  // Quota Reset Countdown Timer State
  const [quotaCountdown, setQuotaCountdown] = useState<string>("");

  // Add Channel by Handle Modal
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [selectedTargetAccountId, setSelectedTargetAccountId] = useState<string>("");
  const [customNewEmail, setCustomNewEmail] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Quota Countdown Timer Effect (Resets at 14:00 WIB / 00:00 PST)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Target today's or tomorrow's 14:00 WIB (UTC+7)
      const target = new Date();
      target.setUTCHours(7, 0, 0, 0); // 07:00 UTC = 14:00 WIB
      if (now.getTime() >= target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setQuotaCountdown(`${hours}j ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchAccounts = async (page = currentPage) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (statusTab !== "ALL") query.append("status", statusTab);

      const res = await fetch(`${getApiBaseUrl()}/accounts?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setAccounts(data.items);
          setTotalAccounts(data.total);
          setTotalPages(data.pages);
          if (data.items.length > 0 && !selectedTargetAccountId) {
            setSelectedTargetAccountId(data.items[0].id);
          }
        } else {
           setAccounts(data || []);
           setTotalAccounts(data.length || 0);
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
  }, [currentPage, debouncedSearch, statusTab]);

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
      const redirectUri = getOAuthRedirectUri("/dashboard/accounts/callback");
      const res = await fetch(`${getApiBaseUrl()}/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
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

  const handleSyncSingleAccount = async (accId: string) => {
    try {
      setActionLoadingId(accId);
      setActiveMenuId(null);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${accId}/sync`, { method: "POST" });
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
    if (userRole !== "ADMIN") {
      alert("Akses ditolak: Hanya pengguna dengan peran ADMIN yang dapat menghapus akun.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${email}?`)) return;
    try {
      setActionLoadingId(accId);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${accId}`, { method: "DELETE" });
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

  const handleBulkDelete = async () => {
    if (userRole !== "ADMIN") {
      alert("Akses ditolak: Hanya pengguna dengan peran ADMIN yang dapat melakukan Hapus Massal.");
      return;
    }
    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} akun terpilih secara permanen?`)) return;
    try {
      setIsDeletingBulk(true);
      const res = await fetch(`${getApiBaseUrl()}/accounts/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_ids: selectedIds })
      });
      if (res.ok) {
        alert(`${selectedIds.length} akun berhasil dihapus.`);
        setSelectedIds([]);
        await fetchAccounts();
      } else {
        alert("Gagal menghapus beberapa akun.");
      }
    } catch (err) {
      console.error(err);
      alert("Error menghubungi server.");
    } finally {
      setIsDeletingBulk(false);
    }
  }

  // Client-Side Data Export (CSV & JSON)
  const handleExportCSV = () => {
    if (accounts.length === 0) return alert("Tidak ada data akun untuk diekspor!");
    const headers = ["ID", "Name", "Email", "Status", "Channels Count", "Token Status", "Last Sync"];
    const rows = accounts.map(a => [
      a.id,
      `"${a.name}"`,
      a.email,
      a.status,
      a.channels,
      a.token,
      `"${a.syncTime}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_accounts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportJSON = () => {
    if (accounts.length === 0) return alert("Tidak ada data akun untuk diekspor!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(accounts, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_accounts_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(a => a.id));
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  // Skeleton UI Component
  const SkeletonRow = () => (
    <tr className="border-b-2 border-black bg-white animate-pulse">
      <td className="p-4"><div className="w-4 h-4 bg-gray-200 mx-auto"></div></td>
      <td className="p-4"><div className="w-4 h-4 bg-gray-200 mx-auto"></div></td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200"></div>
          <div>
            <div className="w-24 h-4 bg-gray-200 mb-1"></div>
            <div className="w-32 h-3 bg-gray-200"></div>
          </div>
        </div>
      </td>
      <td className="p-4"><div className="w-16 h-6 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-24 h-6 bg-gray-200 mb-1"></div><div className="w-20 h-4 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-16 h-4 bg-gray-200 mb-1"></div><div className="w-20 h-3 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-full h-2.5 bg-gray-200 mb-1"></div><div className="w-16 h-3 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-12 h-4 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-12 h-6 bg-gray-200 mx-auto"></div></td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8 relative">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              MULTI-ACCOUNT GOOGLE HUB
            </span>
            <span className="bg-emerald-300 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <Crown className="w-3 h-3 text-black"/> ROLE: {userRole} (FULL ACCESS)
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">KELOLA AKUN & CHANNEL YOUTUBE</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">Hubungkan banyak akun Google OAuth dan kelola channel YouTube terhubung secara terpusat.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Accounts to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700"/> EXPORT CSV
          </button>
          <button 
            onClick={handleExportJSON}
            className="bg-white text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export Accounts to JSON"
          >
            <FileCode className="w-4 h-4 text-blue-700"/> EXPORT JSON
          </button>
          <button 
            onClick={handleAddAccount} 
            className="bg-black text-yellow-300 font-black px-4 py-2.5 border-2 border-black flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase"
          >
            <Plus className="w-4 h-4 text-yellow-300" /> OAUTH GOOGLE LOGIN
          </button>
        </div>
      </div>

      {/* Quota Reset Countdown Banner */}
      <div className="bg-black text-white border-4 border-black p-3.5 shadow-[5px_5px_0_0_#000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-300 p-2 border border-black text-black shadow-[1.5px_1.5px_0_0_#000]">
            <Clock className="w-4 h-4 text-black animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase text-yellow-300">YOUTUBE API DAILY QUOTA RESET TIMER</div>
            <div className="text-[10px] text-gray-300 font-bold">Kuota harian 10,000 unit di-reset oleh YouTube setiap pukul 14:00 WIB (00:00 PST)</div>
          </div>
        </div>

        <div className="bg-yellow-300 text-black border-2 border-black px-3.5 py-1.5 font-black font-mono text-xs shadow-[2px_2px_0_0_#000] flex items-center gap-2">
          <span>⏳ RESET DALAM:</span>
          <span className="text-sm bg-black text-yellow-300 px-2 py-0.5 border border-black">{quotaCountdown || "Loading..."}</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
        
        {/* Tabs & Live Search Bar */}
        <div className="border-b-4 border-black p-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-yellow-50 px-4">
          <div className="flex gap-6 text-[11px] font-black tracking-wider uppercase pt-4 overflow-x-auto w-full md:w-auto">
            {["ALL", "ACTIVE", "INACTIVE", "ERROR"].map((tab) => (
              <button 
                key={tab}
                onClick={() => { setStatusTab(tab as any); setCurrentPage(1); }}
                className={`pb-3 -mb-1 px-2 font-black transition-all flex items-center gap-1.5 ${
                  statusTab === tab 
                    ? 'text-black border-b-4 border-black bg-white shadow-[2px_0_0_0_#000]' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {tab}
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
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="bg-red-500 text-white font-black px-3 py-1 border border-black text-xs uppercase hover:bg-red-600 disabled:opacity-50"
              >
                {isDeletingBulk ? 'Deleting...' : 'Delete Selected'}
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="bg-gray-800 text-white font-black px-3 py-1 border border-black text-xs uppercase hover:bg-gray-700"
              >
                Cancel
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
                    {selectedIds.length === accounts.length && accounts.length > 0 ? (
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
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center font-bold text-gray-500 bg-gray-50">
                    Tidak ada akun Google yang ditemukan.
                  </td>
                </tr>
              ) : accounts.map((acc, i) => {
                const isExpanded = expandedRowIds.includes(acc.id);
                const isSelected = selectedIds.includes(acc.id);

                return (
                  <React.Fragment key={acc.id || i}>
                    <tr className={`border-b-2 border-black hover:bg-amber-50 transition-colors ${isSelected ? 'bg-yellow-100' : 'bg-white'}`}>
                      <td className="p-4 text-center">
                        <button onClick={() => toggleSelectRow(acc.id)} className="p-0.5">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-black"/> : <Square className="w-4 h-4 text-gray-300 hover:text-black"/>}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleRowExpand(acc.id)} 
                          className="p-1 hover:bg-yellow-200 border border-black rounded shadow-[1px_1px_0_0_#000] transition-colors"
                          title="Expand Channel Mini Cards"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-black"/> : <ChevronRight className="w-4 h-4 text-black"/>}
                        </button>
                      </td>
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
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000]
                          ${acc.status === 'ACTIVE' ? 'bg-emerald-300 text-black' : acc.status === 'INACTIVE' ? 'bg-yellow-300 text-black' : 'bg-red-300 text-black'}`}>
                          <span className={`w-2 h-2 rounded-full border border-black ${acc.status === 'ACTIVE' ? 'bg-green-700' : 'bg-red-700'}`} />
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-black text-xs bg-cyan-100 border border-black px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
                            {acc.channels} Channels
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-xs">{acc.lastSync}</div>
                        <div className="text-[10px] text-gray-600 font-bold">{acc.syncTime}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2.5 border-2 border-black bg-gray-200 flex-1 relative w-full overflow-hidden shadow-[1px_1px_0_0_#000]">
                            <div className={`absolute top-0 left-0 bottom-0 ${acc.quotaPct >= 90 ? 'bg-red-500' : acc.quotaPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(acc.quotaPct, 5)}%` }}></div>
                          </div>
                          <span className="font-black text-[10px] w-6">{acc.quotaPct}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0_0_#000]
                          ${acc.token && acc.token.includes('VALID') ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                          {acc.token}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Direct Single-Account Sync Button */}
                          <button
                            onClick={() => handleSyncSingleAccount(acc.id)}
                            disabled={actionLoadingId === acc.id}
                            className="bg-cyan-300 text-black font-black px-2.5 py-1 border-2 border-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] hover:bg-cyan-400 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50"
                            title="Sync This Account Now"
                          >
                            <RefreshCw className={`w-3 h-3 ${actionLoadingId === acc.id ? 'animate-spin' : ''}`}/> SYNC
                          </button>

                          {/* 3-Dots Action Menu */}
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === acc.id ? null : acc.id)}
                              className="p-1 hover:bg-yellow-200 rounded border-2 border-black bg-white shadow-[1.5px_1.5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === acc.id && (
                              <div ref={menuRef} className="absolute right-0 top-9 bg-white border-3 border-black shadow-[5px_5px_0_0_#000] z-50 w-48 text-left py-1">
                                <button onClick={() => handleDeleteAccount(acc.id, acc.email)} className="w-full px-3 py-2 text-xs font-black uppercase text-red-600 hover:bg-red-100 flex items-center gap-2">
                                  <Trash2 className="w-3.5 h-3.5 text-red-600"/> Delete Account
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Expanded Mini Channel Cards */}
                    {isExpanded && (
                      <tr className="bg-yellow-50 border-b-4 border-black">
                        <td colSpan={9} className="p-5">
                          <div className="bg-white border-3 border-black p-5 shadow-[5px_5px_0_0_#000]">
                             <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                               <h4 className="font-black text-xs uppercase flex items-center gap-2">
                                 <PlaySquare className="w-4 h-4 text-black"/> CHANNELS TERHUBUNG ({acc.channel_items ? acc.channel_items.length : 0})
                               </h4>
                               <span className="text-[10px] font-bold text-gray-500">Pemilik: {acc.email}</span>
                             </div>

                             {acc.channel_items && acc.channel_items.length > 0 ? (
                               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                 {acc.channel_items.map((ch) => (
                                   <div key={ch.id} className="border-2 border-black p-3 bg-amber-50 shadow-[3px_3px_0_0_#000] flex flex-col justify-between hover:-translate-y-1 transition-transform">
                                     <div>
                                       <div className="flex items-center gap-2.5 mb-2">
                                         {ch.avatar ? (
                                           <img src={ch.avatar} alt={ch.name} className="w-10 h-10 rounded-full border-2 border-black shrink-0 object-cover shadow-[1px_1px_0_0_#000]" />
                                         ) : (
                                           <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center text-xs border-2 border-black shrink-0 uppercase shadow-[1px_1px_0_0_#000]">
                                             {ch.name ? ch.name[0] : "Y"}
                                           </div>
                                         )}
                                         <div className="overflow-hidden">
                                           <h5 className="font-black text-xs uppercase truncate leading-tight">{ch.name}</h5>
                                           <div className="text-[9px] font-bold text-gray-600 truncate">ID: {ch.channel_id}</div>
                                         </div>
                                       </div>

                                       <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 bg-white border border-black p-1.5 mb-2.5">
                                         <span>Negara: {getFlagEmoji(ch.country)} {ch.country || 'ID'}</span>
                                         <span className="font-black text-black">{ch.video_count || 0} Videos</span>
                                       </div>
                                     </div>

                                     <a 
                                       href={`https://youtube.com/channel/${ch.channel_id}`}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="bg-black text-yellow-300 font-black py-1.5 text-[10px] uppercase border border-black shadow-[1px_1px_0_0_#000] flex items-center justify-center gap-1 hover:bg-gray-800"
                                     >
                                       BUKA YOUTUBE <ExternalLink className="w-3 h-3"/>
                                     </a>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="py-4 text-center text-xs font-bold text-gray-500 border border-dashed border-black">
                                 Belum ada channel terhubung pada akun ini.
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

        {/* Server-Side Pagination Footer */}
        <div className="p-4 border-t-4 border-black flex flex-col md:flex-row justify-between items-center bg-gray-50 text-xs font-black gap-4">
          <div>Showing {accounts.length} of {totalAccounts} Accounts</div>
          <div className="flex gap-2 items-center">
            <button 
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 border-2 border-black bg-white shadow-[2px_2px_0_0_#000] disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3">Page {currentPage} of {totalPages || 1}</span>
            <button 
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 border-2 border-black bg-white shadow-[2px_2px_0_0_#000] disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
