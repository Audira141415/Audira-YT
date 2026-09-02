"use client"

import { ShieldCheck, RefreshCw, Settings, Trash2, ChevronDown } from "lucide-react"
import { useState } from "react"

const BrutalToggle = ({ isOn, onChange }: { isOn: boolean, onChange: () => void }) => (
  <button onClick={onChange}
    className={`w-11 h-6 border-2 border-black flex items-center p-0.5 shadow-[2px_2px_0_0_#000] transition-colors ${isOn ? 'bg-green-400' : 'bg-gray-200'}`}>
    <div className={`w-4 h-4 bg-black border border-black transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`}/>
  </button>
)

const BrutalToggleRow = ({ icon: Icon, title, desc, isOn, onChange }: any) => (
  <div className="flex items-center justify-between py-3 border-b-2 border-black">
    <div className="flex items-center gap-3">
      <div className="p-2 border-2 border-black bg-white shadow-[2px_2px_0_0_#000]"><Icon className="w-4 h-4 text-black"/></div>
      <div>
        <div className="text-xs font-black uppercase tracking-tight">{title}</div>
        <div className="text-[9px] font-bold text-gray-600">{desc}</div>
      </div>
    </div>
    <BrutalToggle isOn={isOn} onChange={onChange}/>
  </div>
)

export default function DataPrivacyPage() {
  const [toggles, setToggles] = useState({ sampling: false, privateVid: true, excludeDel: true })
  const handleToggle = (key: keyof typeof toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-slate-800 text-white font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">🔒 DATA & PRIVACY</span>
        </div>
        <h2 className="text-xl font-black uppercase">Pengaturan Data & Privasi</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">Kelola bagaimana data channel Anda disimpan, diekspor, dan dilindungi.</p>
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5"/> DATA SETTINGS & EXPORT
          </h3>
          <p className="text-xs font-bold text-gray-600">Kelola bagaimana data Anda disimpan dan diekspor.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <BrutalToggleRow icon={RefreshCw} title="Data Sampling" desc="Gunakan data sampling untuk performa" isOn={toggles.sampling} onChange={() => handleToggle('sampling')}/>
            <BrutalToggleRow icon={Settings} title="Include Private Videos" desc="Sertakan video privat dalam laporan" isOn={toggles.privateVid} onChange={() => handleToggle('privateVid')}/>
            <BrutalToggleRow icon={Trash2} title="Exclude Deleted Videos" desc="Kecualikan video yang dihapus" isOn={toggles.excludeDel} onChange={() => handleToggle('excludeDel')}/>
          </div>
          <div className="space-y-4">
            {[
              { label: "Data Retention", value: "18 Months" },
              { label: "Export Limit", value: "1 Million Rows" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-tight">{label}</label>
                <div className="border-2 border-black bg-white p-2 text-xs font-bold flex justify-between items-center shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-gray-50">
                  <span>{value}</span><ChevronDown className="w-4 h-4"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
        <h3 className="font-black text-sm uppercase text-red-800 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5"/> DANGER ZONE</h3>
        <p className="text-xs font-bold text-red-700 mb-4">Tindakan ini tidak dapat dibatalkan. Harap berhati-hati.</p>
        <div className="flex flex-wrap gap-3">
          <button className="bg-red-200 text-red-900 font-black px-5 py-2.5 border-2 border-red-800 text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-red-300">
            HAPUS SEMUA DATA CACHE
          </button>
          <button className="bg-red-600 text-white font-black px-5 py-2.5 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-red-700">
            RESET SELURUH PENGATURAN
          </button>
        </div>
      </div>
    </div>
  )
}
