"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Plus, RefreshCw, Filter, User, CheckCircle2, PlaySquare, Clock, 
  PieChart, AlertTriangle, Search, MoreVertical, Trash2, ExternalLink, 
  X, Check, RefreshCcw, ShieldCheck, KeyRound, Loader2, Link2, ChevronDown, ChevronRight, Video, Sparkles, CheckSquare, Square, Mail,
  ChevronLeft, Download, Shield, Crown, Zap, FileSpreadsheet, FileCode, Play, Pause, Cpu, Activity, Settings2, Key, Radio
} from "lucide-react"
import Link from "next/link"
import { getApiBaseUrl, getOAuthRedirectUri, getWsBaseUrl, fetchWithFallback } from "@/lib/api"

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
  
  // ✅ OAuth Integration Status (resolved from default credential even if not explicitly set)
  isOAuthConnected?: boolean;
  oauthCredentialId?: string | null;
  oauthCredentialName?: string | null;
  oauthCredentialIsDefault?: boolean;

  // 🚀 Account Pipeline Engine Telemetry
  pipelineStatus?: string;
  pipelineEnabled?: boolean;
  syncIntervalSeconds?: number;
  lastSyncDurationMs?: number;
  quotaUsedToday?: number;
  quotaLimitDaily?: number;
  jitterOffsetSeconds?: number;
  lastErrorMessage?: string | null;
}

interface OAuthCredItem {
  id: string;
  name: string;
  client_id: string;
  is_default: boolean;
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

  // Pipeline Credential Binding Modal State
  const [availableCredentials, setAvailableCredentials] = useState<OAuthCredItem[]>([]);
  const [bindingAccount, setBindingAccount] = useState<Account | null>(null);
  const [selectedCredId, setSelectedCredId] = useState<string>("");
  const [isSavingBinding, setIsSavingBinding] = useState(false);

  // Live Pipeline Trigger feedback state
  const [triggerSuccessMsg, setTriggerSuccessMsg] = useState<{ [key: string]: string }>({});

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

  // Fetch available OAuth credentials for binding
  const fetchCredentials = async () => {
    try {
      const res = await fetchWithFallback("/settings/oauth-credentials");
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data) setAvailableCredentials(data || []);
      }
    } catch (e) {
      console.error("Failed to load oauth credentials", e);
    }
  };

  const fetchAccounts = async (page = currentPage) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (statusTab !== "ALL") query.append("status", statusTab);

      const res = await fetchWithFallback(`/accounts?${query.toString()}`);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          if (data.items) {
            setAccounts(data.items);
            setTotalAccounts(data.total);
            setTotalPages(data.pages);
          } else {
            setAccounts(data || []);
            setTotalAccounts(data.length || 0);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCredentials();
  }, [currentPage, debouncedSearch, statusTab]);

  // Realtime WebSocket telemetry listener for live pipeline updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(`${getWsBaseUrl()}/webhooks/ws`);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "PIPELINE_TELEMETRY" && msg.account_id) {
              setAccounts(prev => prev.map(acc => {
                if (acc.id === msg.account_id) {
                  return {
                    ...acc,
                    pipelineStatus: msg.status,
                    lastSync: msg.last_sync,
                    lastSyncDurationMs: msg.duration_ms,
                    lastErrorMessage: msg.last_error,
                    syncIntervalSeconds: msg.sync_interval || acc.syncIntervalSeconds
                  };
                }
                return acc;
              }));
            }
          } catch (err) {
            // Ignore parse error
          }
        };
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch (err) {
        // Fallback polling
      }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
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

  // 🚀 TRIGGER ISOLATED ACCOUNT PIPELINE INSTANTLY
  const handleTriggerPipeline = async (accId: string, email: string) => {
    try {
      setActionLoadingId(accId);
      setActiveMenuId(null);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${accId}/pipeline/trigger`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setTriggerSuccessMsg(prev => ({
          ...prev,
          [accId]: `⚡ Sukses (${data.duration_ms}ms)`
        }));
        setTimeout(() => {
          setTriggerSuccessMsg(prev => {
            const next = { ...prev };
            delete next[accId];
            return next;
          });
        }, 4000);
        await fetchAccounts();
      } else {
        alert(`Gagal sync pipa ${email}: ${data.message || 'Error eksekusi pipa'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke backend pipeline.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // ⏯️ TOGGLE PAUSE / RESUME PIPELINE
  const handleTogglePipeline = async (accId: string, currentEnabled: boolean) => {
    try {
      setActionLoadingId(accId);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${accId}/pipeline/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !currentEnabled })
      });
      if (res.ok) {
        await fetchAccounts();
      } else {
        alert("Gagal mengubah status pipa.");
      }
    } catch (err) {
      console.error(err);
      alert("Error menghubungi server.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // ⏱️ UPDATE PIPELINE INTERVAL
  const handleUpdateInterval = async (accId: string, intervalSeconds: number) => {
    try {
      setActionLoadingId(accId);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${accId}/pipeline/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_interval: intervalSeconds })
      });
      if (res.ok) {
        await fetchAccounts();
      } else {
        alert("Gagal memperbarui interval pipa.");
      }
    } catch (err) {
      console.error(err);
      alert("Error menghubungi server.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // 🔑 SAVE OAUTH CREDENTIAL BINDING
  const handleSaveCredentialBinding = async () => {
    if (!bindingAccount) return;
    try {
      setIsSavingBinding(true);
      const res = await fetch(`${getApiBaseUrl()}/accounts/${bindingAccount.id}/pipeline/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oauth_credential_id: selectedCredId || "NONE" })
      });
      if (res.ok) {
        setBindingAccount(null);
        await fetchAccounts();
        alert("Tautan Google OAuth Credential berhasil disimpan!");
      } else {
        alert("Gagal menyimpan tautan kredensial.");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi ke backend.");
    } finally {
      setIsSavingBinding(false);
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
    const headers = ["ID", "Name", "Email", "Status", "Pipeline Status", "Sync Interval", "Last Sync", "Latency (ms)", "Quota Used"];
    const rows = accounts.map(a => [
      a.id,
      `"${a.name}"`,
      a.email,
      a.status,
      a.pipelineStatus || "HEALTHY",
      `${a.syncIntervalSeconds || 60}s`,
      `"${a.syncTime}"`,
      a.lastSyncDurationMs || 0,
      a.quotaUsedToday || a.quotaUsed || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audira_accounts_pipeline_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportJSON = () => {
    if (accounts.length === 0) return alert("Tidak ada data akun untuk diekspor!");
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(accounts, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_accounts_pipeline_${new Date().toISOString().slice(0,10)}.json`);
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

  const handleReseedDatabase = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBaseUrl()}/accounts/reseed`, { method: "POST" });
      if (res.ok) {
        alert("🎉 SEEDING DATA AKUN & CHANNEL YOUTUBE SUKSES! Data berhasil diisi ke PostgreSQL.");
        await fetchAccounts();
      } else {
        alert("Gagal seeding data.");
      }
    } catch (err) {
      console.error("Reseed error", err);
      alert("Gagal koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Pipeline aggregate statistics
  const activePipesCount = accounts.filter(a => a.pipelineEnabled !== false && a.pipelineStatus !== "PAUSED").length;
  const healthyPipesCount = accounts.filter(a => (a.pipelineStatus === "HEALTHY" || !a.pipelineStatus) && a.pipelineEnabled !== false).length;
  const avgLatency = accounts.length > 0 
    ? Math.round(accounts.reduce((acc, curr) => acc + (curr.lastSyncDurationMs || 0), 0) / accounts.length)
    : 0;

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
      <td className="p-4"><div className="w-24 h-6 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-16 h-6 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-24 h-4 bg-gray-200 mb-1"></div><div className="w-16 h-3 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-full h-2.5 bg-gray-200 mb-1"></div><div className="w-16 h-3 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-20 h-6 bg-gray-200"></div></td>
      <td className="p-4"><div className="w-24 h-6 bg-gray-200 mx-auto"></div></td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8 relative">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-300"/> ISOLATED ACCOUNT PIPELINE ENGINE
            </span>
            <span className="bg-emerald-300 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
              <Crown className="w-3 h-3 text-black"/> ROLE: {userRole} (FULL ACCESS)
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">PIPA AKUN & CHANNEL YOUTUBE</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">Sistem pipa terisolasi mandiri untuk tiap akun Google: Zero Blast Radius, Anti-Bot Jitter, dan kuota Google Cloud independen.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleReseedDatabase}
            className="bg-emerald-400 text-black font-black px-3.5 py-2.5 border-2 border-black flex items-center gap-1.5 hover:bg-emerald-500 shadow-[3px_3px_0_0_#000] text-xs uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5"
            title="Seed Real Accounts & Channels to PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 text-black ${loading ? 'animate-spin' : ''}`}/> SEED REAL DATA DB
          </button>
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

      {/* 🚀 Account Pipeline Engine Telemetry Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-emerald-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Radio className="w-6 h-6 text-black animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">STATUS PIPA AKTIF</div>
            <div className="text-xl font-black">{activePipesCount} / {accounts.length} PIPA</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600"/> {healthyPipesCount} Beroperasi Normal
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-cyan-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">ISOLASI ASYNC WORKER</div>
            <div className="text-xl font-black">ZERO BLAST RADIUS</div>
            <div className="text-[10px] text-gray-600 font-bold">1 Worker Pool Per Akun</div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-yellow-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">LATENSI RATA-RATA PIPA</div>
            <div className="text-xl font-black">⚡ {avgLatency > 0 ? avgLatency : 142} ms</div>
            <div className="text-[10px] text-purple-700 font-bold">+3s - 12s Organic Jitter</div>
          </div>
        </div>

        <div className="bg-black text-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-yellow-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Clock className="w-6 h-6 text-black animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-yellow-300">RESET KUOTA 10K HARIAN</div>
            <div className="text-lg font-black font-mono">{quotaCountdown || "14:00 WIB"}</div>
            <div className="text-[10px] text-gray-400 font-bold">YouTube API v3 PST Reset</div>
          </div>
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
                placeholder="Cari email akun atau channel..." 
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
                <th className="p-4 py-4">AKUN GOOGLE & CREDENTIAL</th>
                <th className="p-4 py-4">STATUS PIPA</th>
                <th className="p-4 py-4">CHANNELS</th>
                <th className="p-4 py-4">SINKRONISASI & LATENSI</th>
                <th className="p-4 py-4 w-36">KUOTA HARIAN</th>
                <th className="p-4 py-4">FREKUENSI PIPA</th>
                <th className="p-4 py-4 text-center">KONTROL PIPA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-0 bg-gray-50">
                    <div className="flex flex-col items-center justify-center py-16 px-8 gap-6">
                      {/* Icon */}
                      <div className="w-20 h-20 bg-yellow-300 border-4 border-black shadow-[6px_6px_0_0_#000] flex items-center justify-center text-4xl">
                        📺
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl uppercase tracking-tight mb-2">Belum Ada Akun Google Terhubung</div>
                        <div className="text-sm font-bold text-gray-600 max-w-md">
                          Dashboard Anda masih kosong. Tambahkan akun Google dan channel YouTube Anda untuk mulai memonitor performa konten secara real-time.
                        </div>
                      </div>
                      {/* Steps */}
                      <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
                        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] text-center w-44">
                          <div className="text-xl mb-1">🔑</div>
                          <div className="font-black text-xs uppercase">Langkah 1</div>
                          <div className="text-[11px] font-bold text-gray-600 mt-1">Setup Google OAuth di Settings</div>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] text-center w-44">
                          <div className="text-xl mb-1">➕</div>
                          <div className="font-black text-xs uppercase">Langkah 2</div>
                          <div className="text-[11px] font-bold text-gray-600 mt-1">Klik tombol "+ Tambah Channel" di atas</div>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] text-center w-44">
                          <div className="text-xl mb-1">📊</div>
                          <div className="font-black text-xs uppercase">Langkah 3</div>
                          <div className="text-[11px] font-bold text-gray-600 mt-1">Channel tersync & dashboard terisi otomatis</div>
                        </div>
                      </div>
                      {/* CTA */}
                      <div className="flex gap-3 flex-wrap justify-center">
                        <button
                          onClick={handleAddAccount}
                          className="bg-black text-yellow-300 font-black px-6 py-3 border-2 border-black shadow-[4px_4px_0_0_#000] text-sm uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                        >
                          <Plus className="w-4 h-4" /> OAUTH GOOGLE LOGIN
                        </button>
                        <Link
                          href="/dashboard/settings"
                          className="bg-yellow-300 text-black font-black px-6 py-3 border-2 border-black shadow-[4px_4px_0_0_#000] text-sm uppercase flex items-center gap-2 hover:bg-yellow-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                        >
                          <Settings2 className="w-4 h-4" /> SETUP OAUTH DULU
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>

              ) : accounts.map((acc, i) => {
                const isExpanded = expandedRowIds.includes(acc.id);
                const isSelected = selectedIds.includes(acc.id);
                const pStatus = acc.pipelineStatus || "HEALTHY";
                const isPaused = acc.pipelineEnabled === false || pStatus === "PAUSED";
                const successMsg = triggerSuccessMsg[acc.id];

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
                            <div className="font-black text-sm uppercase leading-tight flex items-center gap-1.5 flex-wrap">
                              <span>{acc.name}</span>
                              {acc.isOAuthConnected ? (
                                <span className="bg-emerald-300 text-black border border-black text-[9px] px-1.5 py-0.2 font-black rounded shadow-[1px_1px_0_0_#000] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping inline-block" />
                                  OAUTH CONNECTED
                                </span>
                              ) : (
                                <span className="bg-red-200 text-red-800 border border-black text-[9px] px-1.5 py-0.2 font-black rounded flex items-center gap-1">
                                  ⚠ NOT CONNECTED
                                </span>
                              )}
                              {acc.oauthCredentialName && (
                                <span className={`text-[9px] px-1.5 py-0.2 font-black rounded border border-black ${acc.oauthCredentialIsDefault ? 'bg-yellow-300 text-black' : 'bg-purple-200 text-purple-900'}`}>
                                  {acc.oauthCredentialIsDefault ? '★ ' : ''}{acc.oauthCredentialName}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-gray-600 flex items-center gap-2 mt-0.5">
                              <span>{acc.email}</span>
                              {acc.isOAuthConnected ? (
                                <span className="bg-gray-100 border border-black text-[8.5px] font-mono font-bold px-1 text-emerald-900 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                                  {acc.token || "VALID (AUTO-REFRESH)"}
                                </span>
                              ) : (
                                <span className="bg-red-100 border border-red-400 text-[8.5px] font-mono font-bold px-1 text-red-700">
                                  NEEDS OAUTH SETUP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pipeline Status Badge */}
                      <td className="p-4">
                        {pStatus === 'SYNCING' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] bg-cyan-300 text-black animate-pulse">
                            <RefreshCw className="w-3 h-3 text-black animate-spin"/> SYNCING...
                          </span>
                        ) : isPaused ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] bg-gray-300 text-gray-700">
                            <Pause className="w-3 h-3 text-gray-700"/> DIJEDA
                          </span>
                        ) : pStatus === 'THROTTLED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] bg-amber-300 text-black">
                            <AlertTriangle className="w-3 h-3 text-black"/> THROTTLED
                          </span>
                        ) : pStatus === 'ERROR' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] bg-red-400 text-white">
                            <AlertTriangle className="w-3 h-3 text-white"/> ERROR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] bg-emerald-300 text-black">
                            <span className="w-2 h-2 rounded-full border border-black bg-green-700 animate-ping" />
                            PIPA SEHAT
                          </span>
                        )}
                        {acc.lastErrorMessage && (
                          <div className="text-[9px] text-red-600 font-bold truncate max-w-[150px] mt-0.5" title={acc.lastErrorMessage}>
                            {acc.lastErrorMessage}
                          </div>
                        )}
                      </td>

                      {/* Channels count */}
                      <td className="p-4">
                        <div className="font-black text-xs bg-cyan-100 border border-black px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000] inline-block">
                          {acc.channels} Channels
                        </div>
                      </td>

                      {/* Sync & Latency */}
                      <td className="p-4">
                        <div className="font-black text-xs flex items-center gap-1">
                          {acc.lastSync}
                          {acc.lastSyncDurationMs ? (
                            <span className="text-[10px] bg-yellow-200 border border-black px-1 font-mono">
                              ⚡{acc.lastSyncDurationMs}ms
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold">
                          Jitter: +{acc.jitterOffsetSeconds || 4}s
                        </div>
                      </td>

                      {/* Quota Usage */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2.5 border-2 border-black bg-gray-200 flex-1 relative w-full overflow-hidden shadow-[1px_1px_0_0_#000]">
                            <div className={`absolute top-0 left-0 bottom-0 ${acc.quotaPct >= 90 ? 'bg-red-500' : acc.quotaPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(acc.quotaPct, 5)}%` }}></div>
                          </div>
                          <span className="font-black text-[10px] w-6">{acc.quotaPct}%</span>
                        </div>
                        <div className="text-[9px] font-bold text-gray-600">
                          {acc.quotaUsedToday || acc.quotaUsed || 0} / {acc.quotaLimitDaily || 10000} Unit
                        </div>
                      </td>

                      {/* Frequency Selector */}
                      <td className="p-4">
                        <select 
                          value={acc.syncIntervalSeconds || 60}
                          onChange={(e) => handleUpdateInterval(acc.id, parseInt(e.target.value))}
                          disabled={actionLoadingId === acc.id}
                          className="border-2 border-black bg-white text-xs font-black px-2 py-1 shadow-[2px_2px_0_0_#000] focus:outline-none focus:bg-yellow-100"
                        >
                          <option value={30}>30s (Ultra Realtime)</option>
                          <option value={60}>60s (Realtime Standard)</option>
                          <option value={300}>5 Menit (Ekonomis)</option>
                          <option value={900}>15 Menit</option>
                          <option value={1800}>30 Menit</option>
                          <option value={3600}>1 Jam</option>
                        </select>
                      </td>

                      {/* Pipeline Action Controls */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* ⚡ Trigger Pipa Instant Sync Button */}
                          <button
                            onClick={() => handleTriggerPipeline(acc.id, acc.email)}
                            disabled={actionLoadingId === acc.id}
                            className="bg-yellow-300 text-black font-black px-2.5 py-1 border-2 border-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50"
                            title="Trigger Pipa Sinkronisasi Akun Sekarang"
                          >
                            <Zap className={`w-3 h-3 text-black ${actionLoadingId === acc.id ? 'animate-bounce' : ''}`}/>
                            {successMsg ? successMsg : (actionLoadingId === acc.id ? 'SYNCING...' : 'TRIGGER PIPA')}
                          </button>

                          {/* ⏯️ Toggle Pause/Resume */}
                          <button
                            onClick={() => handleTogglePipeline(acc.id, !isPaused)}
                            disabled={actionLoadingId === acc.id}
                            className={`font-black p-1 border-2 border-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center
                              ${isPaused ? 'bg-emerald-300 hover:bg-emerald-400 text-black' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                            title={isPaused ? "Lanjutkan Pipa" : "Jeda Pipa"}
                          >
                            {isPaused ? <Play className="w-3.5 h-3.5"/> : <Pause className="w-3.5 h-3.5"/>}
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
                              <div ref={menuRef} className="absolute right-0 top-9 bg-white border-3 border-black shadow-[5px_5px_0_0_#000] z-50 w-52 text-left py-1">
                                <button 
                                  onClick={() => {
                                    setBindingAccount(acc);
                                    setSelectedCredId(acc.oauthCredentialId || "");
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-black uppercase text-purple-700 hover:bg-purple-100 flex items-center gap-2"
                                >
                                  <Key className="w-3.5 h-3.5 text-purple-700"/> Tautkan Credential Google
                                </button>
                                <button onClick={() => handleDeleteAccount(acc.id, acc.email)} className="w-full px-3 py-2 text-xs font-black uppercase text-red-600 hover:bg-red-100 flex items-center gap-2 border-t border-gray-200">
                                  <Trash2 className="w-3.5 h-3.5 text-red-600"/> Hapus Akun
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
                               <span className="text-[10px] font-bold text-gray-500">Pemilik Pipa: {acc.email}</span>
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
          <div>Showing {accounts.length} of {totalAccounts} Pipa Akun</div>
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

      {/* 🔑 MODAL: TAUTKAN OAUTH CREDENTIAL GOOGLE PROJECT */}
      {bindingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[10px_10px_0_0_#000] max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start mb-4 border-b-4 border-black pb-3">
              <div>
                <span className="bg-purple-300 text-black font-black text-[10px] uppercase px-2 py-0.5 border border-black">
                  PIPELINE CREDENTIAL BINDING
                </span>
                <h3 className="text-xl font-black uppercase mt-1">TAUTKAN GOOGLE CLIENT ID</h3>
                <p className="text-xs text-gray-600 font-bold">Akun: {bindingAccount.email}</p>
              </div>
              <button onClick={() => setBindingAccount(null)} className="p-1 hover:bg-red-200 border-2 border-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Pilih Google Cloud Project Credential:</label>
                <select 
                  value={selectedCredId}
                  onChange={(e) => setSelectedCredId(e.target.value)}
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                >
                  <option value="">-- Gunakan Default System Credential --</option>
                  {availableCredentials.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_id ? c.client_id.substring(0, 16) + '...' : 'Client ID'}) {c.is_default ? '[DEFAULT]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 font-bold mt-1.5">
                  💡 Menautkan Project Google Cloud khusus memberikan 10.000 kuota harian mandiri terpisah untuk pipa akun ini.
                </p>
              </div>

              <div className="bg-yellow-50 border-2 border-black p-3 text-xs font-bold text-gray-800">
                <div className="font-black uppercase mb-1">Status Kredensial Saat Ini:</div>
                <div>{bindingAccount.oauthCredentialName ? `Terhubung ke: ${bindingAccount.oauthCredentialName}` : 'Menggunakan System Default Fallback'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-black">
              <button 
                onClick={() => setBindingAccount(null)}
                className="px-4 py-2 border-2 border-black text-xs font-black uppercase hover:bg-gray-100"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveCredentialBinding}
                disabled={isSavingBinding}
                className="px-4 py-2 bg-yellow-300 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000] hover:bg-yellow-400 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingBinding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                Simpan Tautan Pipa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
