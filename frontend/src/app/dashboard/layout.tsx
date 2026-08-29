"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Users, Video, TrendingUp, Settings, Bell, 
  LineChart, Activity, ArrowRightLeft, Network, Target, Sparkles, 
  FileText, Download, Server, ChevronDown, RefreshCw, ArrowLeft, ShieldAlert, SlidersHorizontal
} from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }

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
          <span className="text-[10px] font-black tracking-wider uppercase mt-1 bg-black text-yellow-300 px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] relative z-10">
            NEO MONITOR v2.0
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

        {/* Footer User Profile */}
        <div className="p-3 border-t-4 border-black bg-emerald-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black text-xs shrink-0 shadow-[1px_1px_0_0_#000]">
            YT
          </div>
          <div className="overflow-hidden">
            <h4 className="font-black text-xs uppercase tracking-tight truncate">USER ACCOUNT</h4>
            <p className="text-[9px] font-bold text-gray-700 uppercase leading-none">PRO SYSTEM ACTIVE</p>
          </div>
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

          <div className="flex items-center gap-3">
            <div className="border-2 border-black flex items-center px-3 py-1.5 font-black text-xs bg-cyan-200 shadow-[2px_2px_0_0_#000] uppercase">
              MAY 21 - MAY 27, 2024 <ChevronDown className="w-3.5 h-3.5 ml-2" />
            </div>
            <div className="border-2 border-black flex items-center px-3 py-1.5 font-black text-xs bg-pink-200 shadow-[2px_2px_0_0_#000] uppercase">
              LAST 7 DAYS <ChevronDown className="w-3.5 h-3.5 ml-2" />
            </div>
            <button className="bg-black text-yellow-300 font-black px-5 py-2 border-2 border-black flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase">
              SYNC NOW <RefreshCw className="w-3.5 h-3.5 text-yellow-300" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  )
}
