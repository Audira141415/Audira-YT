"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Settings, Bell, Key, ShieldCheck, Users, CreditCard, Globe, Sparkles
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard/settings/general",       label: "General",               icon: Globe,       badge: null },
  { href: "/dashboard/settings/notifications", label: "Telegram & Notifikasi", icon: Bell,        badge: "🔔" },
  { href: "/dashboard/settings/integrations",  label: "Integrasi OAuth & API", icon: Key,         badge: "🔑" },
  { href: "/dashboard/settings/data-privacy",  label: "Data & Privacy",        icon: ShieldCheck, badge: null },
  { href: "/dashboard/settings/users",         label: "Users & Permissions",   icon: Users,       badge: null },
  { href: "/dashboard/settings/billing",       label: "Billing & Lisensi",     icon: CreditCard,  badge: "💳" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-0 max-w-[1600px] mx-auto pb-8">

      {/* Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-5 shadow-[8px_8px_0_0_#000] flex items-center gap-4 mb-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current"/> SYSTEM CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl xl:text-3xl font-black tracking-tighter uppercase leading-none">
            PENGATURAN AUDIRA YT
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-1">
            Kelola integrasi, OAuth credentials, notifikasi, lisensi, dan kebijakan privasi data.
          </p>
        </div>
        {/* Decorative */}
        <Settings className="w-16 h-16 text-black/10 absolute right-6 top-1/2 -translate-y-1/2" />
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* Left Sidebar Nav */}
        <aside className="w-full xl:w-[260px] shrink-0">
          <nav className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
            <div className="bg-black text-yellow-300 px-4 py-2.5 flex items-center gap-2">
              <Settings className="w-4 h-4"/>
              <span className="font-black text-xs uppercase tracking-wider">Menu Pengaturan</span>
            </div>
            <ul className="divide-y-2 divide-black">
              {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/")
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase transition-all group
                        ${isActive 
                          ? "bg-yellow-300 text-black border-l-4 border-black shadow-[inset_-2px_0_0_0_#000]" 
                          : "text-gray-700 hover:bg-yellow-50 hover:text-black hover:border-l-4 hover:border-yellow-400"
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-black" : "text-gray-500 group-hover:text-black"}`} />
                      <span className="flex-1 leading-tight">{label}</span>
                      {badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000] 
                          ${isActive ? "bg-black text-yellow-300" : "bg-gray-100 text-black"}`}>
                          {badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-black shrink-0"/>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Quick Info Box */}
          <div className="bg-cyan-200 border-4 border-black p-4 shadow-[4px_4px_0_0_#000] mt-4">
            <div className="text-[10px] font-black uppercase mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5"/> PATH AKTIF
            </div>
            <div className="font-mono text-xs font-bold text-gray-800 break-all">
              {pathname}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  )
}
