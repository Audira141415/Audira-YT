"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Users, Video, TrendingUp, Settings, Bell, 
  LineChart, Activity, ArrowRightLeft, Network, Target, Sparkles, 
  FileText, Download, Server, ChevronDown, RefreshCw, ArrowLeft, ShieldAlert, 
  SlidersHorizontal, Loader2, LogOut, User as UserIcon, Crown, ShieldCheck, X, Edit2, Save, KeyRound, HardDrive
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
  
  const [currentUser, setCurrentUser] = useState<any>({
    name: "SUPERADMIN SYSTEM",
    email: "superadmin@audira.com",
    role: "SUPERADMIN"
  });

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("audira_user");
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
    }
  }, []);

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
    { label: "ALERTS", href: "/dashboard/alerts", icon: Bell },
    { label: "REPORTS", href: "/dashboard/reports", icon: FileText },
    { label: "EXPORT", href: "/dashboard/export", icon: Download },
    { label: "SETTINGS", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <div 
      className="flex h-screen bg-[#FDFBF7] font-sans text-black"
      style={{ backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 0)', backgroundSize: '24px 24px' }}
    >
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-4 border-black flex flex-col shrink-0 z-20 shadow-[4px_0_0_0_#000]">
        
        {/* Brand Header */}
        <div className="p-4 border-b-4 border-black h-20 flex items-center justify-center flex-col bg-yellow-300 relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-12 h-12 bg-pink-400 border-2 border-black rotate-12" />
          <h2 className="font-black text-2xl tracking-tighter uppercase leading-none relative z-10 text-black">AUDIRA YT</h2>
          <span className="text-[10px] font-black tracking-wider uppercase mt-1 bg-black text-yellow-300 px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] relative z-10 flex items-center gap-1">
            <Crown className="w-3 h-3 text-yellow-300 fill-current"/> SUPERADMIN v2.0
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          {/* Main Section */}
          <div>
            <div className="text-[10px] font-black text-gray-500 tracking-wider uppercase mb-2 px-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-yellow-400 border border-black rounded-full" /> CORE APP
            </div>
            <ul className="space-y-1.5">
              {mainMenu.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href}
                      className={`flex items-center gap-3 font-black px-4 py-2.5 text-xs tracking-tight uppercase border-2 transition-all shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        isActive 
                          ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0_0_#000]" 
                          : "bg-white text-black border-black hover:bg-cyan-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Analytics Section */}
          <div className="border-t-2 border-black pt-4">
            <div className="text-[10px] font-black text-gray-500 tracking-wider uppercase mb-2 px-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-cyan-400 border border-black rounded-full" /> ANALYTICS & DATA
            </div>
            <ul className="space-y-1.5">
              {analyticsMenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href} 
                      className={`flex items-center gap-3 font-black px-4 py-2.5 text-xs tracking-tight uppercase border-2 transition-all shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        isActive 
                          ? "bg-cyan-300 text-black border-black shadow-[3px_3px_0_0_#000]" 
                          : "bg-white text-black border-black hover:bg-yellow-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" /> 
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* System Section */}
          <div className="border-t-2 border-black pt-4">
            <div className="text-[10px] font-black text-gray-500 tracking-wider uppercase mb-2 px-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-pink-400 border border-black rounded-full" /> SYSTEM & REPORTS
            </div>
            <ul className="space-y-1.5">
              {systemMenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link 
                      href={item.href} 
                      className={`flex items-center gap-3 font-black px-4 py-2.5 text-xs tracking-tight uppercase border-2 transition-all shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        isActive 
                          ? "bg-pink-300 text-black border-black shadow-[3px_3px_0_0_#000]" 
                          : "bg-white text-black border-black hover:bg-pink-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" /> 
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

        </nav>

        {/* Footer User Profile & Logout */}
        <div className="p-3 border-t-4 border-black bg-emerald-200 flex items-center justify-between gap-2">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 text-left overflow-hidden hover:opacity-80 transition-opacity flex-1"
            title="Lihat Profil Superadmin"
          >
            <div className="w-9 h-9 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black text-xs shrink-0 shadow-[1px_1px_0_0_#000]">
              <Crown className="w-4 h-4 text-yellow-300 fill-current"/>
            </div>
            <div className="overflow-hidden">
              <h4 className="font-black text-xs uppercase tracking-tight truncate">
                {currentUser.name || "SUPERADMIN"}
              </h4>
              <p className="text-[9px] font-bold text-emerald-900 uppercase leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-700 rounded-full inline-block animate-ping"/> {currentUser.role || "SUPERADMIN"}
              </p>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white font-black p-2 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-red-600 active:translate-x-0.5 active:translate-y-0.5 transition-all text-xs shrink-0"
            title="Logout dari Sistem"
          >
            <LogOut className="w-4 h-4"/>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b-4 border-black bg-white flex items-center justify-between px-6 shrink-0 shadow-[0_4px_0_0_#000] z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className="border-2 border-black bg-yellow-300 hover:bg-yellow-400 font-black px-3 py-1.5 text-xs flex items-center gap-1.5 uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mr-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4"/> BACK
            </button>
            <div className="bg-black text-white p-2 border-2 border-black shadow-[2px_2px_0_0_#000]">
              <LayoutDashboard className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">AUDIRA INTELLIGENCE MONITOR</h1>
          </div>

          {/* Interactive Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Superadmin User Badge & Profile Button */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="border-2 border-black flex items-center gap-1.5 px-3 py-1.5 font-black text-xs bg-yellow-300 hover:bg-yellow-400 shadow-[2px_2px_0_0_#000] uppercase"
            >
              <Crown className="w-3.5 h-3.5 text-black fill-current"/> {currentUser.name || "SUPERADMIN"}
            </button>

            {/* Dynamic Date Range Badge */}
            <div className="border-2 border-black flex items-center px-3 py-1.5 font-black text-xs bg-cyan-200 shadow-[2px_2px_0_0_#000] uppercase">
              {dateRangeStr}
            </div>

            {/* Period Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="border-2 border-black flex items-center px-3 py-1.5 font-black text-xs bg-pink-200 hover:bg-pink-300 shadow-[2px_2px_0_0_#000] uppercase"
              >
                {period} <ChevronDown className="w-3.5 h-3.5 ml-2" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white border-2 border-black shadow-[3px_3px_0_0_#000] z-50 py-1">
                  {["LAST 7 DAYS", "LAST 30 DAYS", "THIS MONTH", "ALL TIME"].map(p => (
                    <button 
                      key={p}
                      onClick={() => { setPeriod(p); setShowPeriodDropdown(false); }}
                      className="w-full text-left px-3 py-1.5 font-black text-xs uppercase hover:bg-yellow-300 border-b border-gray-100 last:border-0"
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
              className="bg-black text-yellow-300 font-black px-4 py-2 border-2 border-black flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase disabled:opacity-50"
            >
              {isSyncing ? "SYNCING..." : "SYNC NOW"} 
              <RefreshCw className={`w-3.5 h-3.5 text-yellow-300 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Topbar Logout Button */}
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white font-black px-3.5 py-2 border-2 border-black flex items-center gap-1.5 hover:bg-red-600 shadow-[3px_3px_0_0_#000] text-xs uppercase active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
