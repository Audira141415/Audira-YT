"use client"

import { Users, Shield, Fingerprint, UserPlus, Trash2, RefreshCw, Crown, Eye, Cog } from "lucide-react"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl } from "@/lib/api"

const ROLE_CONFIG: Record<string, { color: string; badge: string }> = {
  SUPERADMIN: { color: "bg-yellow-300 text-black", badge: "👑 SUPERADMIN" },
  ADMIN:      { color: "bg-emerald-300 text-black", badge: "🛡️ ADMIN" },
  MANAGER:    { color: "bg-cyan-200 text-black",    badge: "🎬 MANAGER" },
  VIEWER:     { color: "bg-purple-200 text-black",  badge: "👁️ VIEWER" },
}

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : (data.users || data.items || []))
      }
    } catch (err) {
      console.error("Failed to fetch users", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const getInitials = (name: string) =>
    name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-500 text-white font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">
            👥 USERS &amp; PERMISSIONS
          </span>
        </div>
        <h2 className="text-xl font-black uppercase">Manajemen Pengguna &amp; Akses</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">
          Kelola pengguna terdaftar, role mereka, dan hak akses. Untuk manajemen pengguna lebih lengkap, gunakan halaman{" "}
          <Link href="/dashboard/users" className="underline font-black text-blue-700">
            Users Management
          </Link>.
        </p>
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black flex-wrap gap-3">
          <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5" />
            DAFTAR PENGGUNA AKTIF ({loading ? "..." : users.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gray-100 border-2 border-black p-2 hover:bg-gray-200 shadow-[2px_2px_0_0_#000] disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/dashboard/users"
              className="bg-black text-yellow-300 font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> KELOLA PENGGUNA LENGKAP →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs font-black text-gray-400 animate-pulse">
            MEMUAT DATA PENGGUNA...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-xs font-black text-gray-400">
            Tidak ada pengguna terdaftar.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user: any) => {
              const role = (user.role || "VIEWER").toUpperCase()
              const cfg = ROLE_CONFIG[role] || ROLE_CONFIG["VIEWER"]
              return (
                <div
                  key={user.id || user.email}
                  className="border-4 border-black p-4 bg-yellow-50 shadow-[3px_3px_0_0_#000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black text-sm shrink-0">
                      {getInitials(user.name || user.email)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase">{user.name || "Unknown"}</h4>
                      <p className="text-xs font-bold text-gray-600">{user.email}</p>
                      {user.status && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 border border-black ${
                          user.status === "ACTIVE" ? "bg-green-200" : "bg-red-200"
                        }`}>
                          {user.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${cfg.color} border-2 border-black text-xs font-black px-3 py-1 uppercase shadow-[1px_1px_0_0_#000]`}>
                      {cfg.badge}
                    </span>
                    <Link
                      href="/dashboard/users"
                      className="bg-gray-100 border-2 border-black p-1.5 hover:bg-blue-100 transition-colors shadow-[1px_1px_0_0_#000]"
                      title="Kelola pengguna"
                    >
                      <Cog className="w-3.5 h-3.5 text-blue-600" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
        <h3 className="font-black text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5" /> KEAMANAN AKUN
        </h3>
        <p className="text-[10px] font-bold text-gray-600 mb-4 border-b-2 border-black pb-2">Amankan akun dan aktivitas Anda.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/users"
            className="border-2 border-black bg-yellow-300 hover:bg-yellow-400 font-black py-2.5 px-5 uppercase shadow-[3px_3px_0_0_#000] text-xs active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <Fingerprint className="w-4 h-4" /> MANAGE SESSIONS
          </Link>
          <button className="border-2 border-black bg-white hover:bg-gray-50 font-black py-2.5 px-5 uppercase shadow-[3px_3px_0_0_#000] text-xs flex items-center gap-1.5 opacity-50 cursor-not-allowed" disabled>
            <Shield className="w-4 h-4" /> AKTIFKAN TWO-FACTOR AUTH (SOON)
          </button>
        </div>
      </div>
    </div>
  )
}
