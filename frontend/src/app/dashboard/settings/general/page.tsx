"use client"

import { Globe, Sun, Monitor, RefreshCw, ChevronDown } from "lucide-react"
import { useState } from "react"

const BrutalToggle = ({ isOn, onChange }: { isOn: boolean, onChange: () => void }) => (
  <button 
    onClick={onChange}
    className={`w-11 h-6 border-2 border-black flex items-center p-0.5 shadow-[2px_2px_0_0_#000] transition-colors ${isOn ? 'bg-green-400' : 'bg-gray-200'}`}
  >
    <div className={`w-4 h-4 bg-black border border-black transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

const BrutalToggleRow = ({ icon: Icon, title, desc, isOn, onChange }: any) => (
  <div className="flex items-center justify-between py-3 border-b-2 border-black">
    <div className="flex items-center gap-3">
      <div className="p-2 border-2 border-black bg-white shadow-[2px_2px_0_0_#000]">
        <Icon className="w-4 h-4 text-black" />
      </div>
      <div>
        <div className="text-xs font-black uppercase tracking-tight">{title}</div>
        <div className="text-[9px] font-bold text-gray-600">{desc}</div>
      </div>
    </div>
    <BrutalToggle isOn={isOn} onChange={onChange} />
  </div>
)

const BrutalSelect = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black uppercase tracking-tight">{label}</label>
    <div className="border-2 border-black bg-white p-2 text-xs font-bold flex justify-between items-center shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-gray-50">
      <span>{value}</span>
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
)

export default function GeneralSettingsPage() {
  const [toggles, setToggles] = useState({
    darkDashboard: false,
    compactView: true,
    autoSync: true,
  })

  const handleToggle = (key: keyof typeof toggles) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-black text-white font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">
            GENERAL
          </span>
        </div>
        <h2 className="text-xl font-black uppercase">Preferensi Umum Aplikasi</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">
          Konfigurasi bahasa, zona waktu, tema tampilan, dan perilaku umum aplikasi.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
            <Globe className="w-5 h-5"/> REGIONAL & LANGUAGE
          </h3>
          <p className="text-xs font-bold text-gray-600">Konfigurasi preferensi regional Anda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <BrutalSelect label="Default Language" value="Indonesian (ID)" />
            <BrutalSelect label="Timezone" value="Asia/Jakarta (WIB - UTC+7)" />
            <BrutalSelect label="Currency" value="IDR (Rp)" />
            <BrutalSelect label="Date Format" value="DD/MM/YYYY" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase mb-3 border-b-2 border-black pb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4"/> TAMPILAN DASHBOARD
            </div>
            <BrutalToggleRow icon={Sun} title="Dark Theme" desc="Gunakan tema gelap untuk antarmuka" isOn={toggles.darkDashboard} onChange={() => handleToggle('darkDashboard')} />
            <BrutalToggleRow icon={Monitor} title="Compact Mode" desc="Tampilkan data lebih padat di tabel" isOn={toggles.compactView} onChange={() => handleToggle('compactView')} />
            <BrutalToggleRow icon={RefreshCw} title="Auto Refresh Data" desc="Perbarui data secara otomatis setiap 5 menit" isOn={toggles.autoSync} onChange={() => handleToggle('autoSync')} />
          </div>
        </div>
      </div>

      {/* App Info Card */}
      <div className="bg-gray-50 border-4 border-black p-5 shadow-[4px_4px_0_0_#000]">
        <div className="text-[10px] font-black uppercase mb-3 border-b-2 border-black pb-2">INFORMASI APLIKASI</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Versi App", value: "v2.4.1" },
            { label: "Environment", value: "Development" },
            { label: "Build Date", value: "Sep 01, 2026" },
            { label: "Database", value: "PostgreSQL 15" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
              <div className="text-[9px] font-black uppercase text-gray-500">{label}</div>
              <div className="text-xs font-black mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
