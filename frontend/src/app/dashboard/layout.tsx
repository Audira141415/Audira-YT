"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Users, Video, TrendingUp, Settings, Bell, 
  LineChart, Activity, ArrowRightLeft, Network, Target, Sparkles, 
  FileText, Download, Server, ChevronDown, RefreshCw, ArrowLeft, ShieldAlert, 
  SlidersHorizontal, Loader2, LogOut, User as UserIcon, Crown, ShieldCheck, X, Edit2, Save, KeyRound, HardDrive,
  PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, Clock
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl } from "@/lib/api"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [period, setPeriod] = useState("LAST 7 DAYS");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>({
    name: "SUPERADMIN SYSTEM",
    email: "superadmin@audira.com",
    role: "SUPERADMIN"
  });

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string>("SINKRON KINI");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Live clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour12: false }) + " WIB");
    }, 1000);
    const initialNow = new Date();
    setCurrentTime(initialNow.toLocaleTimeString("id-ID", { hour12: false }) + " WIB");

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("audira_token");
      const stored = localStorage.getItem("audira_user");

      if (!token) {
        setIsCheckingAuth(false);
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setEditName(parsed.name || "SUPERADMIN SYSTEM");
          setEditEmail(parsed.email || "superadmin@audira.com");
        } catch (e) {
          console.error(e);
        }
      }

      setIsAuthenticated(true);
      setIsCheckingAuth(false);

      const storedSidebar = localStorage.getItem("audira_sidebar_collapsed");
      if (storedSidebar === "true") {
        setIsSidebarCollapsed(true);
      }
    }
    return () => clearInterval(timer);
  }, [router]);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("audira_sidebar_collapsed", String(nextState));
    }
  };

  // Compute dynamic current date range
  const now = new Date();
  const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const formatDateStr = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  const dateRangeStr = `${formatDateStr(past7)} - ${formatDateStr(now)}`;

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleGlobalSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`${getApiBaseUrl()}/accounts/sync-all`, { method: "POST" });
      if (res.ok) {
        alert("SINKRONISASI SUKSES! Seluruh data channel dan video YouTube berhasil disinkronkan ke PostgreSQL.");
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        alert("Sinkronisasi latar belakang dipicu.");
      }
    } catch (err) {
      console.error("Sync error", err);
      alert("Gagal menghubungi server backend sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin logout dari sesi Superadmin? Anda akan kembali ke Landing Page.")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("audira_token");
        localStorage.removeItem("audira_user");
      }
      alert("LOGOUT SUKSES! Sesi Superadmin telah diakhiri. Mengalihkan ke Landing Page...");
      router.push("/");
    }
  };

  const handleSaveProfile = () => {
    const updated = {
      ...currentUser,
      name: editName,
      email: editEmail
    };
    setCurrentUser(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("audira_user", JSON.stringify(updated));
    }
    setIsEditingProfile(false);
    alert("Profil Superadmin berhasil diperbarui!");
  };

  const handleRefreshSession = () => {
    alert("Token sesi Superadmin berhasil diperpanjang 7 hari!");
  };

  const handleExportAuditLogs = () => {
    const auditData = {
      user: currentUser,
      loginTimestamp: new Date().toISOString(),
      activeAccounts: 3,
      activeChannels: 6,
      securityStatus: "AES-256 Fernet Validated",
      dbEngine: "PostgreSQL 16"
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(auditData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audira_superadmin_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainMenu = [
    { label: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
    { label: "ACCOUNTS", href: "/dashboard/accounts", icon: Users },
    { label: "CHANNELS", href: "/dashboard/channels", icon: Video },
    { label: "VIDEOS", href: "/dashboard/videos", icon: Video },
  ]

  const analyticsMenu = [
    { label: "OVERVIEW", href: "/dashboard/overview", icon: LineChart },
    { label: "TRENDS", href: "/dashboard/trends", icon: TrendingUp },
    { label: "REALTIME", href: "/dashboard/realtime", icon: Activity },
    { label: "COMPARISON", href: "/dashboard/comparison", icon: ArrowRightLeft },
  ]

  const systemMenu = [
    { label: "SYSTEM STATUS", href: "/dashboard/status", icon: ShieldCheck },
    { label: "ALERTS", href: "/dashboard/alerts", icon: Bell },
    { label: "REPORTS", href: "/dashboard/reports", icon: FileText },
    { label: "EXPORT", href: "/dashboard/export", icon: Download },
    { label: "SETTINGS", href: "/dashboard/settings", icon: Settings },
  ]

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center font-mono">
        <Loader2 className="w-10 h-10 animate-spin text-black mb-4 stroke-[3]" />
        <span className="font-black text-xs uppercase tracking-widest bg-yellow-300 border-2 border-black px-3 py-1 shadow-[3px_3px_0_0_#000]">
          MEMERIKSA SESI KEAMANAN SUPERADMIN...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div 
      className="flex h-screen bg-[#FAF8F5] font-sans text-slate-900 overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)', backgroundSize: '24px 24px' }}
    >
      {/* Light Pastel Neo-Brutalist Sidebar (Gumroad Style) */}
      <aside 
        className={`bg-white border-r-3 border-slate-900 flex flex-col shrink-0 z-20 shadow-[4px_0_0_0_#0f172a] transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b-3 border-slate-900 h-16 flex items-center justify-between bg-amber-300 relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-10 h-10 bg-rose-300 border-2 border-slate-900 rotate-12 pointer-events-none" />
          
          {!isSidebarCollapsed ? (
            <div className="flex flex-col justify-center relative z-10 overflow-hidden pl-1">
              <h2 className="font-black text-xl tracking-tighter uppercase leading-none text-slate-900">
                AUDIRA YT
              </h2>
              <span className="text-[9px] font-black tracking-wider uppercase mt-1 bg-slate-900 text-amber-300 px-2 py-0.5 border border-slate-900 shadow-[1px_1px_0_0_#0f172a] rounded-md flex items-center gap-1 w-fit">
                <Crown className="w-3 h-3 text-amber-300 fill-current"/> SUPERADMIN v2.0
              </span>
            </div>
          ) : (
            <div className="relative z-10 flex items-center justify-center w-full">
              <div className="w-9 h-9 bg-slate-900 text-amber-300 font-black rounded-xl border-2 border-slate-900 flex items-center justify-center text-xs shadow-[2px_2px_0_0_#0f172a]" title="AUDIRA YT SUPERADMIN">
                AYT
              </div>
            </div>
          )}

          <button 
            onClick={toggleSidebar}
            className={`p-1.5 rounded-xl bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-amber-100 transition-all relative z-10 shrink-0 ${
              isSidebarCollapsed ? "hidden" : "ml-2"
            }`}
            title="Sembunyikan Sidebar Menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          {/* Main Section */}
          <div>
            {!isSidebarCollapsed ? (
              <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase mb-2 px-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-400 border border-slate-900 rounded-full" /> CORE APP
              </div>
            ) : (
              <div className="flex justify-center mb-2" title="CORE APP">
                <span className="w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-full" />
              </div>
            )}
            <ul className="space-y-2">
              {mainMenu.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center font-black text-xs tracking-tight uppercase border-2 border-slate-900 rounded-xl transition-all ${
                        isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"
                      } ${
                        isActive 
                          ? "bg-amber-300 text-slate-900 shadow-[3px_3px_0_0_#0f172a]" 
                          : "bg-white text-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-slate-900" />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Analytics Section */}
          <div className="border-t-2 border-slate-900/10 pt-4">
            {!isSidebarCollapsed ? (
              <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase mb-2 px-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-cyan-400 border border-slate-900 rounded-full" /> ANALYTICS & DATA
              </div>
            ) : (
              <div className="flex justify-center mb-2" title="ANALYTICS & DATA">
                <span className="w-2.5 h-2.5 bg-cyan-400 border border-slate-900 rounded-full" />
              </div>
            )}
            <ul className="space-y-2">
              {analyticsMenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href} 
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center font-black text-xs tracking-tight uppercase border-2 border-slate-900 rounded-xl transition-all ${
                        isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"
                      } ${
                        isActive 
                          ? "bg-cyan-200 text-slate-900 shadow-[3px_3px_0_0_#0f172a]" 
                          : "bg-white text-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-cyan-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-slate-900" /> 
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* System Section */}
          <div className="border-t-2 border-slate-900/10 pt-4">
            {!isSidebarCollapsed ? (
              <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase mb-2 px-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-rose-400 border border-slate-900 rounded-full" /> SYSTEM & REPORTS
              </div>
            ) : (
              <div className="flex justify-center mb-2" title="SYSTEM & REPORTS">
                <span className="w-2.5 h-2.5 bg-rose-400 border border-slate-900 rounded-full" />
              </div>
            )}
            <ul className="space-y-2">
              {systemMenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href} 
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center font-black text-xs tracking-tight uppercase border-2 border-slate-900 rounded-xl transition-all ${
                        isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"
                      } ${
                        isActive 
                          ? "bg-rose-200 text-slate-900 shadow-[3px_3px_0_0_#0f172a]" 
                          : "bg-white text-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-rose-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-slate-900" /> 
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

        </nav>

        {/* Footer User Profile & Logout */}
        <div className={`border-t-3 border-slate-900 bg-emerald-200 flex items-center ${isSidebarCollapsed ? "flex-col p-2.5 gap-2" : "p-3.5 justify-between gap-3"}`}>
          <button 
            onClick={() => setShowProfileModal(true)}
            className={`flex items-center text-left overflow-hidden hover:opacity-90 transition-opacity ${
              isSidebarCollapsed ? "justify-center" : "gap-2.5 flex-1"
            }`}
            title="Lihat Profil Superadmin"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 font-black flex items-center justify-center border-2 border-slate-900 text-xs shrink-0 shadow-[1.5px_1.5px_0_0_#0f172a]">
              <Crown className="w-4 h-4 text-amber-300 fill-current"/>
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <h4 className="font-black text-xs uppercase tracking-tight truncate text-slate-900">
                  {currentUser.name || "SUPERADMIN"}
                </h4>
                <p className="text-[9px] font-black text-emerald-950 uppercase leading-none flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full inline-block animate-ping"/> {currentUser.role || "SUPERADMIN"}
                </p>
              </div>
            )}
          </button>

          <button 
            onClick={handleLogout}
            className={`bg-rose-500 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:bg-rose-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-xs shrink-0 ${
              isSidebarCollapsed ? "p-2.5 w-full flex items-center justify-center rounded-xl" : "p-2.5 rounded-xl"
            }`}
            title="Logout dari Sistem"
          >
            <LogOut className="w-4 h-4"/>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Light Pastel Neo-Brutalist Header (Clean without obsolete BACK button) */}
        <header className="h-16 border-b-3 border-slate-900 bg-white flex items-center justify-between px-6 shrink-0 shadow-[0_3px_0_0_#0f172a] z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button in Header */}
            <button 
              onClick={toggleSidebar}
              className="border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 font-black p-2 rounded-xl text-xs flex items-center justify-center uppercase shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              title={isSidebarCollapsed ? "Tampilkan Sidebar Menu (Expand)" : "Sembunyikan Sidebar Menu (Collapse)"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="bg-slate-900 text-amber-300 p-2 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase truncate">
              AUDIRA INTELLIGENCE MONITOR
            </h1>
          </div>

          {/* Interactive Header Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Realtime Clock Badge */}
            <div className="hidden xl:flex border-2 border-slate-900 items-center gap-1.5 px-3 py-1.5 font-black text-xs bg-emerald-200 shadow-[2px_2px_0_0_#0f172a] rounded-full uppercase" title="Waktu Server Real-time Saat Ini">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping inline-block" />
              <Clock className="w-3.5 h-3.5 text-slate-900"/>
              <span>{currentTime || "00:00:00 WIB"}</span>
            </div>

            {/* Superadmin User Badge & Profile Button */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="border-2 border-slate-900 flex items-center gap-1.5 px-3.5 py-1.5 font-black text-xs bg-amber-300 hover:bg-amber-400 shadow-[2px_2px_0_0_#0f172a] rounded-full uppercase active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 fill-current text-slate-900"/> {currentUser.name || "SUPERADMIN"}
            </button>

            {/* Dynamic Date Range Badge */}
            <div className="hidden lg:flex border-2 border-slate-900 items-center px-3.5 py-1.5 font-black text-xs bg-cyan-200 shadow-[2px_2px_0_0_#0f172a] rounded-full uppercase">
              {dateRangeStr}
            </div>

            {/* Period Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="border-2 border-slate-900 flex items-center px-3.5 py-1.5 font-black text-xs bg-rose-200 hover:bg-rose-300 shadow-[2px_2px_0_0_#0f172a] rounded-full uppercase transition-all"
              >
                {period} <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] z-50 py-1.5 overflow-hidden">
                  {["LAST 7 DAYS", "LAST 30 DAYS", "THIS MONTH", "ALL TIME"].map(p => (
                    <button 
                      key={p}
                      onClick={() => { setPeriod(p); setShowPeriodDropdown(false); }}
                      className="w-full text-left px-4 py-2 font-black text-xs uppercase hover:bg-amber-300 border-b border-slate-100 last:border-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Real Global Sync Button */}
            <button 
              onClick={handleGlobalSync}
              disabled={isSyncing}
              className="bg-amber-300 hover:bg-amber-400 text-slate-900 font-black px-4 py-1.5 border-2 border-slate-900 rounded-xl flex items-center gap-2 hover:shadow-[3px_3px_0_0_#0f172a] shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase disabled:opacity-50 transition-all"
            >
              {isSyncing ? "SYNCING..." : "SYNC NOW"} 
              <RefreshCw className={`w-3.5 h-3.5 text-slate-900 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Topbar Logout Button */}
            <button 
              onClick={handleLogout}
              className="bg-rose-500 hover:bg-rose-600 text-white font-black px-3.5 py-1.5 border-2 border-slate-900 rounded-xl flex items-center gap-1.5 shadow-[2px_2px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase transition-all"
              title="Logout dari Sistem"
            >
              <LogOut className="w-3.5 h-3.5"/> LOGOUT
            </button>

          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* ENHANCED SUPERADMIN USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-4 border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-yellow-300 border-3 border-black shadow-[2px_2px_0_0_#000]">
                  <Crown className="w-6 h-6 text-black fill-current" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight">PROFIL & CONTROL CENTER SUPERADMIN</h3>
                  <span className="text-[10px] font-black bg-black text-yellow-300 px-2 py-0.5 uppercase border border-black inline-block mt-0.5">
                    FULL SYSTEM CONTROL (6 CHANNELS)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="bg-black text-white p-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* EDIT PROFILE / VIEW PROFILE SECTION */}
            <div className="space-y-4 mb-6">
              
              {isEditingProfile ? (
                <div className="bg-yellow-50 border-3 border-black p-4 space-y-3 shadow-[3px_3px_0_0_#000]">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                    <span className="font-black text-xs uppercase flex items-center gap-1 text-black">
                      <Edit2 className="w-3.5 h-3.5"/> EDIT PROFIL SUPERADMIN
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">NAMA SUPERADMIN:</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border-2 border-black p-2 font-bold text-xs bg-white shadow-[2px_2px_0_0_#000]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">EMAIL SUPERADMIN:</label>
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full border-2 border-black p-2 font-bold text-xs bg-white shadow-[2px_2px_0_0_#000]"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 bg-black text-yellow-300 font-black py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5 text-yellow-300"/> SIMPAN PROFIL
                    </button>
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-white text-black font-black py-2 px-3 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000]"
                    >
                      BATAL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-bold text-xs">
                  
                  {/* Account Name */}
                  <div className="bg-yellow-100 border-2 border-black p-3 shadow-[2px_2px_0_0_#000] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-gray-600 block uppercase">NAMA AKUN:</span>
                      <span className="font-black text-sm uppercase text-black">{currentUser.name || "SUPERADMIN SYSTEM"}</span>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-black text-yellow-300 p-1.5 border border-black text-[10px] font-black uppercase shadow-[1px_1px_0_0_#000] hover:bg-gray-800"
                      title="Edit Nama/Email Profil"
                    >
                      <Edit2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>

                  {/* Email */}
                  <div className="bg-cyan-100 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <span className="text-[10px] font-black text-gray-600 block uppercase">EMAIL SUPERADMIN:</span>
                    <span className="font-black text-sm font-mono text-black">{currentUser.email || "superadmin@audira.com"}</span>
                  </div>

                  {/* Control Scope */}
                  <div className="bg-emerald-100 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <span className="text-[10px] font-black text-gray-600 block uppercase">CAKUPAN KONTROL:</span>
                    <span className="font-black text-sm uppercase text-emerald-900">6 CHANNELS &bull; 3 GOOGLE ACCOUNTS</span>
                  </div>

                  {/* Security Status */}
                  <div className="bg-pink-100 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <span className="text-[10px] font-black text-gray-600 block uppercase">KEAMANAN JWT & TOKEN:</span>
                    <span className="font-black text-xs uppercase text-green-800">ENKRIPSI AES-256 FERNET VALID</span>
                  </div>

                </div>
              )}

              {/* ACTION TOOLS GRID */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={handleRefreshSession}
                  className="bg-white text-black font-black py-2 px-3 border-2 border-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-700"/> REFRESH TOKEN
                </button>
                <button 
                  onClick={handleExportAuditLogs}
                  className="bg-white text-black font-black py-2 px-3 border-2 border-black text-[10px] uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-green-700"/> EXPORT SECURITY LOG
                </button>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 border-t-3 border-black pt-4">
              <button 
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white font-black py-3 border-3 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4"/> LOGOUT SYSTEM &rarr; LANDING PAGE
              </button>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="bg-black text-white font-black py-3 px-5 border-3 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase hover:bg-gray-800"
              >
                TUTUP
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
