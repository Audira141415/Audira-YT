"use client"

import React, { useState, useEffect } from "react"
import { 
  KeyRound, ShieldCheck, Clock, Crown, Zap, Calendar, 
  Copy, Check, Plus, RefreshCw, Trash2, X, Search, 
  FileSpreadsheet, FileCode, AlertTriangle, Shield, CheckCircle2, Lock, Eye, EyeOff, Sparkles
} from "lucide-react"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

interface LicenseItem {
  id: string
  license_key: string
  duration_type: "7_DAYS" | "1_MONTH" | "PERMANENT"
  duration_label: string
  status: "ACTIVE" | "UNUSED" | "EXPIRED" | "REVOKED"
  client_name: string
  client_email: string
  max_channels: number
  features: string
  is_active: boolean
  activated_at: string
  expires_at: string
  created_at: string
  remaining_days: number
  remaining_text: string
  notes: string
}

export default function LicenseManagementPage() {
  const [licenses, setLicenses] = useState<LicenseItem[]>([])
  const [currentLicense, setCurrentLicense] = useState<LicenseItem | null>(null)
  const [stats, setStats] = useState<any>({
    total: 0,
    permanent_count: 0,
    one_month_count: 0,
    seven_days_count: 0,
    active_count: 0,
    unused_count: 0,
    expired_count: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [durationFilter, setDurationFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<LicenseItem | null>(null)
  
  // Generator Form State
  const [genDuration, setGenDuration] = useState<"7_DAYS" | "1_MONTH" | "PERMANENT">("1_MONTH")
  const [genClientName, setGenClientName] = useState("")
  const [genClientEmail, setGenClientEmail] = useState("")
  const [genMaxChannels, setGenMaxChannels] = useState(12)
  const [genActivateImmediate, setGenActivateImmediate] = useState(true)
  const [genNotes, setGenNotes] = useState("")
  
  // Activation Form State
  const [actKey, setActKey] = useState("")
  const [actEmail, setActEmail] = useState("")
  
  // Extend Form State
  const [extendDaysVal, setExtendDaysVal] = useState(30)
  const [extendDurationType, setExtendDurationType] = useState<"7_DAYS" | "1_MONTH" | "PERMANENT">("1_MONTH")
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchLicenses = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const res = await fetchWithFallback("/licenses")
      if (res && res.ok) {
        const data = await res.json()
        setLicenses(data.licenses || [])
        setStats(data.stats || {})
      }

      const currRes = await fetchWithFallback("/licenses/current")
      if (currRes && currRes.ok) {
        const currData = await currRes.json()
        if (currData.license) {
          setCurrentLicense(currData.license)
        }
      }
    } catch (err) {
      console.error("Failed to fetch licenses", err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchLicenses(true)
  }, [])

  // Filtered list
  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch = 
      lic.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.client_email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDuration = durationFilter === "ALL" || lic.duration_type === durationFilter
    const matchesStatus = statusFilter === "ALL" || lic.status === statusFilter

    return matchesSearch && matchesDuration && matchesStatus
  })

  // Copy Key to Clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // Generate License Handler
  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/licenses/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_type: genDuration,
          client_name: genClientName || "Klien Audira",
          client_email: genClientEmail || "",
          max_channels: genMaxChannels,
          activate_immediately: genActivateImmediate,
          notes: genNotes
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`🎉 SUKSES! Kunci Lisensi Baru Berhasil Dibuat:\n\n${data.license.license_key}\nDurasi: ${data.license.duration_label}`)
        setShowGenerateModal(false)
        setGenClientName("")
        setGenClientEmail("")
        setGenNotes("")
        fetchLicenses(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal membuat lisensi.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Activate License Handler
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actKey.trim()) {
      alert("Masukkan kunci lisensi!")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/licenses/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: actKey.trim(),
          client_email: actEmail.trim() || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`🎉 AKTIVASI SUKSES!\n\nLisensi '${data.license.duration_label}' aktif di sistem.\nBerlaku hingga: ${data.license.expires_at}`)
        setShowActivateModal(false)
        setActKey("")
        setActEmail("")
        fetchLicenses(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal mengaktifkan lisensi.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Extend / Upgrade License Handler
  const handleOpenExtend = (lic: LicenseItem) => {
    setSelectedLicense(lic)
    setExtendDurationType(lic.duration_type)
    setExtendDaysVal(lic.duration_type === "7_DAYS" ? 7 : 30)
    setShowExtendModal(true)
  }

  const handleSaveExtend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLicense) return

    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/licenses/${selectedLicense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_type: extendDurationType,
          extend_days: extendDurationType === "PERMANENT" ? undefined : extendDaysVal,
          status: "ACTIVE"
        })
      })

      if (res.ok) {
        alert("Durasi lisensi berhasil diperpanjang!")
        setShowExtendModal(false)
        fetchLicenses(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal memperpanjang lisensi.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Revoke Status
  const handleToggleRevoke = async (lic: LicenseItem) => {
    const nextStatus = lic.status === "REVOKED" ? "ACTIVE" : "REVOKED"
    if (!confirm(`Apakah Anda yakin ingin mengubah status lisensi '${lic.license_key}' menjadi ${nextStatus}?`)) {
      return
    }

    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/licenses/${lic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      })

      if (res.ok) {
        fetchLicenses(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Delete License Record
  const handleDeleteLicense = async (lic: LicenseItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus catatan lisensi '${lic.license_key}'?`)) {
      return
    }

    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/licenses/${lic.id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchLicenses(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (licenses.length === 0) return alert("Tidak ada data lisensi!")
    const headers = ["License Key", "Duration", "Status", "Client Name", "Client Email", "Remaining Days", "Expires At", "Created At"]
    const rows = licenses.map(l => [
      `"${l.license_key}"`,
      `"${l.duration_label}"`,
      l.status,
      `"${l.client_name}"`,
      l.client_email,
      l.remaining_days,
      `"${l.expires_at}"`,
      `"${l.created_at}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `audira_licenses_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export JSON
  const handleExportJSON = () => {
    if (licenses.length === 0) return alert("Tidak ada data lisensi!")
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(licenses, null, 2))}`
    const link = document.createElement("a")
    link.setAttribute("href", jsonString)
    link.setAttribute("download", `audira_licenses_${new Date().toISOString().slice(0,10)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-yellow-300 fill-current"/> LICENSE MANAGEMENT & ACTIVATION HUB
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              7 HARI &bull; 1 BULAN &bull; PERMANEN
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            PUSAT MANAJEMEN LISENSI APLIKASI
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Generate, perpanjang, dan aktivasi kunci lisensi resmi Audira YT: **Uji Coba 7 Hari**, **Langganan 1 Bulan**, dan **Akses Permanen Selamanya (Lifetime Enterprise)**.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black font-black px-3.5 py-3 border-2 border-black flex items-center gap-1.5 hover:bg-gray-100 shadow-[3px_3px_0_0_#000] text-xs uppercase"
            title="Export ke CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700" /> EXPORT CSV
          </button>
          <button 
            onClick={() => setShowActivateModal(true)}
            className="bg-emerald-400 text-black font-black px-4 py-3 border-2 border-black flex items-center gap-2 hover:bg-emerald-500 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase"
          >
            <Zap className="w-4 h-4 text-black"/> AKTIVASI LISENSI
          </button>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase"
          >
            <Plus className="w-4 h-4 text-yellow-300" /> + GENERATE LISENSI BARU
          </button>
        </div>
      </div>

      {/* Active System License Widget */}
      {currentLicense && (
        <div className="bg-emerald-300 border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-black text-emerald-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">LISENSI SISTEM SAAT INI</span>
              <span className="bg-white text-black font-black text-[9px] px-2 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" /> STATUS: {currentLicense.status}
              </span>
            </div>
            <div className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              <span>{currentLicense.duration_label}</span>
              <code className="text-xs bg-black text-yellow-300 px-2 py-0.5 rounded font-mono">
                {currentLicense.license_key}
              </code>
            </div>
            <p className="text-xs font-bold text-emerald-950 mt-1">
              Didaftarkan atas nama: <strong>{currentLicense.client_name}</strong> ({currentLicense.client_email}) &bull; Quota: {currentLicense.max_channels} Channels
            </p>
          </div>

          <div className="bg-white border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000] text-center shrink-0 w-full md:w-auto">
            <div className="text-[10px] font-black uppercase text-gray-500">MASA BERLAKU</div>
            <div className="text-lg font-black text-emerald-800 font-mono">
              {currentLicense.duration_type === 'PERMANENT' ? 'SELAMANYA (LIFETIME)' : currentLicense.remaining_text}
            </div>
            <div className="text-[9px] font-bold text-gray-600">
              Kedaluwarsa: {currentLicense.expires_at}
            </div>
          </div>
        </div>
      )}

      {/* 3 Duration Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Plan 1: 7 HARI (TRIAL) */}
        <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-yellow-300 text-black border-2 border-black font-black text-xs px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5"/> 7 HARI (TRIAL)
              </span>
              <span className="text-xl font-black">{stats.seven_days_count} KUNCI</span>
            </div>
            <h3 className="font-black text-lg uppercase mt-2">PAKET UJI COBA 7 HARI</h3>
            <p className="text-xs font-bold text-gray-700 leading-relaxed mt-1">
              Durasi masa aktif 7 hari (1 minggu). Cocok untuk uji coba fitur radar kompetitor, bot telegram, dan auto-comments YouTube.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-xs font-black">
            <span className="text-gray-600">Maksimal 6 Channel</span>
            <button
              onClick={() => {
                setGenDuration("7_DAYS")
                setGenMaxChannels(6)
                setShowGenerateModal(true)
              }}
              className="bg-black text-yellow-300 px-3 py-1.5 text-[10px] uppercase border border-black hover:bg-gray-800 shadow-[1px_1px_0_0_#000]"
            >
              GENERATE 7 HARI
            </button>
          </div>
        </div>

        {/* Plan 2: 1 BULAN (PRO) */}
        <div className="bg-cyan-100 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-cyan-300 text-black border-2 border-black font-black text-xs px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5"/> 1 BULAN (PRO)
              </span>
              <span className="text-xl font-black">{stats.one_month_count} KUNCI</span>
            </div>
            <h3 className="font-black text-lg uppercase mt-2">LANGGANAN PRO 30 HARI</h3>
            <p className="text-xs font-bold text-gray-800 leading-relaxed mt-1">
              Durasi masa aktif 30 hari (1 bulan penuh). Dilengkapi fitur analitik pendapatan IDR, isolasi async worker, dan auto-publishing.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-xs font-black">
            <span className="text-gray-700">Maksimal 12 Channel</span>
            <button
              onClick={() => {
                setGenDuration("1_MONTH")
                setGenMaxChannels(12)
                setShowGenerateModal(true)
              }}
              className="bg-black text-cyan-300 px-3 py-1.5 text-[10px] uppercase border border-black hover:bg-gray-800 shadow-[1px_1px_0_0_#000]"
            >
              GENERATE 1 BULAN
            </button>
          </div>
        </div>

        {/* Plan 3: PERMANEN (LIFETIME) */}
        <div className="bg-yellow-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-black text-yellow-300 border-2 border-black font-black text-xs px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-yellow-300 fill-current"/> PERMANEN (LIFETIME)
              </span>
              <span className="text-xl font-black">{stats.permanent_count} KUNCI</span>
            </div>
            <h3 className="font-black text-lg uppercase mt-2">LISENSI PERMANEN (SELAMANYA)</h3>
            <p className="text-xs font-bold text-gray-900 leading-relaxed mt-1">
              Akses tanpa batas waktu kedaluwarsa selamanya (Enterprise Unlimited). Mendukung unlimited channel dan pembaruan sistem berkala.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-xs font-black">
            <span className="text-emerald-800">Unlimited Channels</span>
            <button
              onClick={() => {
                setGenDuration("PERMANENT")
                setGenMaxChannels(99)
                setShowGenerateModal(true)
              }}
              className="bg-black text-yellow-300 px-3 py-1.5 text-[10px] uppercase border border-black hover:bg-gray-800 shadow-[1px_1px_0_0_#000]"
            >
              GENERATE PERMANEN
            </button>
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
        
        {/* Table Filter & Search Controls */}
        <div className="border-b-4 border-black p-4 bg-yellow-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Duration Filter Tabs */}
          <div className="flex gap-2 text-[11px] font-black uppercase overflow-x-auto w-full md:w-auto">
            {[
              { key: "ALL", label: "SEMUA LISENSI" },
              { key: "PERMANENT", label: "👑 PERMANEN" },
              { key: "1_MONTH", label: "📅 1 BULAN" },
              { key: "7_DAYS", label: "⚡ 7 HARI" },
              { key: "ACTIVE", label: "🟢 AKTIF" },
              { key: "UNUSED", label: "⚪ BELUM AKTIF" },
              { key: "EXPIRED", label: "🔴 KADALUARSA" },
            ].map((tab) => {
              const isActive = (durationFilter === tab.key) || (statusFilter === tab.key)
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (["ACTIVE", "UNUSED", "EXPIRED"].includes(tab.key)) {
                      setStatusFilter(tab.key)
                      setDurationFilter("ALL")
                    } else {
                      setDurationFilter(tab.key)
                      setStatusFilter("ALL")
                    }
                  }}
                  className={`px-3 py-1.5 border-2 border-black transition-all ${
                    isActive 
                      ? "bg-black text-yellow-300 shadow-[2px_2px_0_0_#000]" 
                      : "bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0_0_#000]"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kunci atau nama klien..."
                className="w-full pl-9 pr-4 py-2 border-2 border-black font-bold text-xs bg-white focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={() => fetchLicenses(false)}
              className="bg-black text-yellow-300 font-black p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 shrink-0"
              title="Refresh Data Lisensi"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4 py-3.5">KUNCI LISENSI (LICENSE KEY)</th>
                <th className="p-4 py-3.5">DURASI & PAKET</th>
                <th className="p-4 py-3.5">KLIEN / PEMILIK</th>
                <th className="p-4 py-3.5">STATUS & SISA HARI</th>
                <th className="p-4 py-3.5">TANGGAL BERAKHIR</th>
                <th className="p-4 py-3.5 text-center">AKSI & KONTROL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center font-bold text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                    Memuat daftar kunci lisensi...
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center font-bold text-gray-500 bg-gray-50">
                    Tidak ada lisensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const isCopied = copiedKey === lic.license_key

                  return (
                    <tr key={lic.id} className="border-b-2 border-black hover:bg-amber-50/50 transition-colors">
                      
                      {/* License Key */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-900 text-yellow-300 font-mono font-black text-xs px-2.5 py-1 rounded border border-black shadow-[1.5px_1.5px_0_0_#000] tracking-wider">
                            {lic.license_key}
                          </code>
                          <button
                            onClick={() => handleCopyKey(lic.license_key)}
                            className={`p-1.5 border-2 border-black text-xs font-black uppercase transition-all shadow-[1px_1px_0_0_#000] ${
                              isCopied ? "bg-emerald-400 text-black" : "bg-white hover:bg-yellow-200"
                            }`}
                            title="Salin Kunci Lisensi"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {lic.notes && (
                          <div className="text-[10px] font-bold text-gray-500 mt-1 truncate max-w-xs">{lic.notes}</div>
                        )}
                      </td>

                      {/* Duration Type Badge */}
                      <td className="p-4">
                        {lic.duration_type === 'PERMANENT' ? (
                          <span className="bg-yellow-300 text-black border-2 border-black font-black text-[9px] px-2.5 py-1 uppercase shadow-[1.5px_1.5px_0_0_#000] inline-flex items-center gap-1">
                            <Crown className="w-3 h-3 text-black fill-current" /> PERMANEN (LIFETIME)
                          </span>
                        ) : lic.duration_type === '1_MONTH' ? (
                          <span className="bg-cyan-200 text-black border-2 border-black font-black text-[9px] px-2.5 py-1 uppercase shadow-[1.5px_1.5px_0_0_#000] inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-black" /> 1 BULAN (PRO)
                          </span>
                        ) : (
                          <span className="bg-amber-200 text-black border-2 border-black font-black text-[9px] px-2.5 py-1 uppercase shadow-[1.5px_1.5px_0_0_#000] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-black" /> 7 HARI (TRIAL)
                          </span>
                        )}
                        <div className="text-[10px] font-bold text-gray-600 mt-1">Kuota: {lic.max_channels} Channels</div>
                      </td>

                      {/* Client / Owner */}
                      <td className="p-4">
                        <div className="font-black text-xs uppercase text-black">{lic.client_name}</div>
                        <div className="text-[10px] font-mono text-gray-600">{lic.client_email}</div>
                      </td>

                      {/* Status & Sisa Hari */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-[9px] uppercase px-2.5 py-0.5 border-2 border-black shadow-[1px_1px_0_0_#000] ${
                            lic.status === 'ACTIVE' ? 'bg-emerald-300 text-black' :
                            lic.status === 'UNUSED' ? 'bg-gray-200 text-gray-700' :
                            lic.status === 'REVOKED' ? 'bg-black text-white' : 'bg-red-400 text-white'
                          }`}>
                            {lic.status}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-gray-900 mt-1">
                          {lic.remaining_text}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="p-4">
                        <div className="font-bold text-xs text-gray-900">{lic.expires_at}</div>
                        <div className="text-[10px] text-gray-500">Dibuat: {lic.created_at}</div>
                      </td>

                      {/* Action Controls */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Extend / Upgrade Button */}
                          <button
                            onClick={() => handleOpenExtend(lic)}
                            className="bg-yellow-300 text-black font-black px-2.5 py-1 border-2 border-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] hover:bg-yellow-400"
                            title="Perpanjang atau Ubah Durasi Lisensi"
                          >
                            PERPANJANG
                          </button>

                          {/* Revoke/Activate Toggle */}
                          <button
                            onClick={() => handleToggleRevoke(lic)}
                            className={`p-1 border-2 border-black shadow-[1px_1px_0_0_#000] text-[10px] font-black uppercase ${
                              lic.status === 'REVOKED' ? 'bg-emerald-400 text-black' : 'bg-red-200 text-red-900 hover:bg-red-300'
                            }`}
                            title={lic.status === 'REVOKED' ? "Aktifkan Kembali" : "Cabut/Nonaktifkan Lisensi"}
                          >
                            {lic.status === 'REVOKED' ? 'AKTIFKAN' : 'CABUT'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteLicense(lic)}
                            className="bg-red-500 text-white p-1.5 border-2 border-black shadow-[1px_1px_0_0_#000] hover:bg-red-600"
                            title="Hapus Lisensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: GENERATE LISENSI BARU */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-xl uppercase flex items-center gap-2">
                <KeyRound className="w-6 h-6"/> GENERATE KUNCI LISENSI BARU
              </h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleGenerateLicense} className="space-y-4">
              
              {/* Duration Plan Choice */}
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">PILIH DURASI MASA AKTIF LISENSI *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setGenDuration("7_DAYS"); setGenMaxChannels(6); }}
                    className={`p-3 border-3 border-black text-center font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
                      genDuration === "7_DAYS" ? "bg-amber-300 text-black ring-2 ring-black" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1"/>
                    7 HARI
                    <div className="text-[8px] font-bold text-gray-600 lowercase">uji coba</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setGenDuration("1_MONTH"); setGenMaxChannels(12); }}
                    className={`p-3 border-3 border-black text-center font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
                      genDuration === "1_MONTH" ? "bg-cyan-300 text-black ring-2 ring-black" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Calendar className="w-4 h-4 mx-auto mb-1"/>
                    1 BULAN
                    <div className="text-[8px] font-bold text-gray-600 lowercase">pro 30 hari</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setGenDuration("PERMANENT"); setGenMaxChannels(99); }}
                    className={`p-3 border-3 border-black text-center font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
                      genDuration === "PERMANENT" ? "bg-yellow-300 text-black ring-2 ring-black" : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Crown className="w-4 h-4 mx-auto mb-1 fill-current"/>
                    PERMANEN
                    <div className="text-[8px] font-bold text-gray-600 lowercase">lifetime</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">NAMA KLIEN / AGENSI / PENGGUNA *</label>
                <input 
                  type="text" 
                  value={genClientName}
                  onChange={(e) => setGenClientName(e.target.value)}
                  placeholder="Contoh: Media Network Agensi"
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">EMAIL KLIEN</label>
                <input 
                  type="email" 
                  value={genClientEmail}
                  onChange={(e) => setGenClientEmail(e.target.value)}
                  placeholder="Contoh: klien@audira.com"
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">MAKSIMAL CHANNEL</label>
                  <select
                    value={genMaxChannels}
                    onChange={(e) => setGenMaxChannels(Number(e.target.value))}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-cyan-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value={3}>3 Channels</option>
                    <option value={6}>6 Channels</option>
                    <option value={12}>12 Channels</option>
                    <option value={99}>Unlimited (99 Channels)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">STATUS AWAL</label>
                  <select
                    value={genActivateImmediate ? "ACTIVE" : "UNUSED"}
                    onChange={(e) => setGenActivateImmediate(e.target.value === "ACTIVE")}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-emerald-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value="ACTIVE">🟢 LANGSUNG AKTIF</option>
                    <option value="UNUSED">⚪ SIMPAN DULU (UNUSED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">CATATAN LISENSI (OPSIONAL)</label>
                <input 
                  type="text" 
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  placeholder="Contoh: Paket Klien Khusus Jakarta"
                  className="w-full border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300"/> 
                  {submitting ? "MEMPROSES..." : "GENERATE LISENSI SEKARANG"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AKTIVASI KUNCI LISENSI */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600"/> AKTIVASI KUNCI LISENSI
              </h3>
              <button 
                onClick={() => setShowActivateModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleActivateLicense} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">MASUKKAN KUNCI LISENSI (LICENSE KEY) *</label>
                <input 
                  type="text" 
                  value={actKey}
                  onChange={(e) => setActKey(e.target.value)}
                  placeholder="Contoh: AUD-1M-8421-K9X2-P4M1"
                  className="w-full border-2 border-black p-2.5 text-xs font-mono font-black focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">EMAIL PENGGUNA (OPSIONAL)</label>
                <input 
                  type="email" 
                  value={actEmail}
                  onChange={(e) => setActEmail(e.target.value)}
                  placeholder="Contoh: pengguna@audira.com"
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                />
              </div>

              <div className="bg-emerald-50 border-2 border-black p-3 text-xs font-bold text-emerald-950">
                Sistem akan memvalidasi kunci lisensi ke database lokal dan langsung memperpanjang durasi akses sesuai tipe lisensi.
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-400 text-black font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-emerald-500"
                >
                  {submitting ? "MEMVALIDASI..." : "AKTIFKAN SEKARANG 🚀"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivateModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PERPANJANG / UBAH DURASI */}
      {showExtendModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Clock className="w-5 h-5"/> PERPANJANG DURASI LISENSI
              </h3>
              <button 
                onClick={() => setShowExtendModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleSaveExtend} className="space-y-4">
              <div className="bg-yellow-100 border-2 border-black p-3 text-xs font-bold">
                <div>Kunci: <code className="font-mono">{selectedLicense.license_key}</code></div>
                <div>Klien: <strong>{selectedLicense.client_name}</strong></div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">PILIH TIPE DURASI BARU</label>
                <select
                  value={extendDurationType}
                  onChange={(e: any) => setExtendDurationType(e.target.value)}
                  className="w-full border-2 border-black p-2.5 text-xs font-black bg-cyan-100 shadow-[2px_2px_0_0_#000]"
                >
                  <option value="7_DAYS">⚡ 7 HARI (TRIAL ACCESS)</option>
                  <option value="1_MONTH">📅 1 BULAN (PRO ACCESS)</option>
                  <option value="PERMANENT">👑 PERMANEN (LIFETIME ENTERPRISE)</option>
                </select>
              </div>

              {extendDurationType !== "PERMANENT" && (
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">TAMBAHAN HARI PERPANJANGAN</label>
                  <input 
                    type="number"
                    value={extendDaysVal}
                    onChange={(e) => setExtendDaysVal(Number(e.target.value))}
                    min={1}
                    className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800"
                >
                  {submitting ? "MENYIMPAN..." : "SIMPAN PERPANJANGAN"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
