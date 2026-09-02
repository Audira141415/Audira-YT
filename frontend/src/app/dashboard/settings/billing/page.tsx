"use client"

import { CreditCard, Zap, Check, Shield, Clock } from "lucide-react"
import Link from "next/link"

const PLAN_FEATURES = [
  "Unlimited Google Accounts",
  "Multi-Channel YouTube Monitor",
  "Real-time Pipeline Engine",
  "Telegram Bot Notifier",
  "Discord & WhatsApp Webhook",
  "Multi OAuth App (Quota Stacking)",
  "Encrypted Token Storage (AES-256)",
  "Lifetime Updates & Support",
]

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-yellow-400 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">💳 BILLING & LISENSI</span>
        </div>
        <h2 className="text-xl font-black uppercase">Informasi Billing & Langganan</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">
          Lihat detail plan Anda dan kelola lisensi. Untuk manajemen lisensi lengkap, kunjungi <Link href="/dashboard/license" className="underline font-black text-blue-700">halaman Lisensi</Link>.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-black text-yellow-300 text-[10px] font-black px-2.5 py-0.5 uppercase border border-black">CURRENT ACTIVE PLAN</span>
          <h2 className="text-2xl font-black uppercase mt-1">AUDIRA PRO ENTERPRISE</h2>
          <p className="text-xs font-bold text-gray-800">Unlimited Accounts & Multi-Channel Support</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="bg-emerald-300 border-2 border-black text-black font-black px-4 py-2 text-xs uppercase shadow-[2px_2px_0_0_#000]">
            ✅ ACTIVE & LIFETIME
          </span>
          <span className="text-[9px] font-bold text-gray-700">Aktivasi: Sep 01, 2026</span>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <h3 className="font-black text-sm uppercase mb-4 pb-2 border-b-4 border-black flex items-center gap-2">
          <Zap className="w-5 h-5"/> FITUR YANG TERMASUK DALAM PLAN ANDA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLAN_FEATURES.map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 bg-emerald-50 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
              <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-black stroke-[3]"/>
              </div>
              <span className="text-xs font-bold">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* License Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tipe Lisensi", value: "LIFETIME", icon: Shield, color: "bg-yellow-300" },
          { label: "Status", value: "AKTIF", icon: Check, color: "bg-emerald-300" },
          { label: "Masa Berlaku", value: "SELAMANYA", icon: Clock, color: "bg-cyan-200" },
          { label: "Max Akun", value: "UNLIMITED", icon: Zap, color: "bg-purple-200" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`${color} border-4 border-black p-4 shadow-[4px_4px_0_0_#000]`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5"/>
              <span className="text-[9px] font-black uppercase">{label}</span>
            </div>
            <div className="font-black text-sm uppercase">{value}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-black text-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-black text-sm uppercase">Kelola Lisensi Pengguna Lain</div>
          <p className="text-xs font-bold text-gray-400 mt-0.5">Tambah lisensi baru atau atur masa berlaku untuk pengguna yang terdaftar.</p>
        </div>
        <Link href="/dashboard/license"
          className="bg-yellow-300 text-black font-black px-6 py-3 border-2 border-yellow-400 text-xs uppercase shadow-[3px_3px_0_0_#444] hover:bg-yellow-400 flex items-center gap-1.5 shrink-0">
          <CreditCard className="w-4 h-4"/> KELOLA LISENSI →
        </Link>
      </div>
    </div>
  )
}
