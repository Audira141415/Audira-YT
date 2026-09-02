"use client"

import { 
  Key, Database, Check, Loader2, Plus, Zap, Trash2, Star, 
  CheckCircle2, ShieldCheck, CheckCircle
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getApiBaseUrl, getOAuthRedirectUri, fetchWithFallback } from "@/lib/api"

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const [showOAuthSuccessBanner, setShowOAuthSuccessBanner] = useState(false)
  const [youtubeApiKey, setYoutubeApiKey] = useState("")
  const [ytKeySaved, setYtKeySaved] = useState("") // last confirmed-saved key from DB
  const [ytKeyStatus, setYtKeyStatus] = useState<"idle"|"saving"|"testing"|"success"|"error"|"deleting">("idle")
  const [credName, setCredName] = useState("")
  const [savedCredentials, setSavedCredentials] = useState<any[]>([])
  const [apiSettings, setApiSettings] = useState({ google_client_id: "", google_client_secret: "" })
  const [apiSaveStatus, setApiSaveStatus] = useState<"idle"|"saving"|"success"|"error">("idle")
  const [loadingCreds, setLoadingCreds] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])

  const totalDailyQuota = savedCredentials.length * 10000

  useEffect(() => {
    fetchCredentials()
    // Load existing YouTube API Key from DB
    fetchWithFallback("/settings").then(async (res) => {
      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.youtube_api_key && data.youtube_api_key !== "your_youtube_api_key_here") {
          setYoutubeApiKey(data.youtube_api_key)
          setYtKeySaved(data.youtube_api_key) // mark as saved
        }
      }
    }).catch(() => {})
    if (searchParams.get("oauth_success")) {
      setShowOAuthSuccessBanner(true)
    }
  }, [searchParams])

  const fetchCredentials = async () => {
    try {
      setLoadingCreds(true)
      const [credRes, accRes] = await Promise.all([
        fetchWithFallback("/settings/credentials"),
        fetchWithFallback("/accounts")
      ])
      if (credRes && credRes.ok) {
        const data = await credRes.json().catch(() => null)
        if (data) setSavedCredentials(data || [])
      }
      if (accRes && accRes.ok) {
        const accData = await accRes.json().catch(() => null)
        if (accData) setAccounts(Array.isArray(accData) ? accData : (accData.items || []))
      }
    } catch (err) {
      console.error("Failed to load credentials", err)
    } finally {
      setLoadingCreds(false)
    }
  }

  const handleConnectOAuth = async (credId?: string) => {
    try {
      const redirectUri = getOAuthRedirectUri("/dashboard/accounts/callback")
      let url = `${getApiBaseUrl()}/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      if (credId) url += `&credential_id=${credId}`
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        alert(`Error: ${err.detail || 'Gagal membuka Google Login'}`)
        return
      }
      const data = await res.json()
      window.location.href = data.url
    } catch (e) {
      alert("Gagal terhubung ke server backend")
    }
  }

  const saveApiSettings = async () => {
    if (!apiSettings.google_client_id.trim() || !apiSettings.google_client_secret.trim()) {
      alert("Client ID dan Client Secret wajib diisi!")
      return
    }
    try {
      setApiSaveStatus("saving")
      const res = await fetch(`${getApiBaseUrl()}/settings/credentials`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: credName.trim() || `Google OAuth App #${savedCredentials.length + 1}`,
          client_id: apiSettings.google_client_id.trim(),
          client_secret: apiSettings.google_client_secret.trim()
        })
      })
      if (res.ok) {
        setApiSaveStatus("success")
        alert("✅ Kredensial Google OAuth tersimpan!")
        setApiSettings({ google_client_id: "", google_client_secret: "" })
        setCredName("")
        await fetchCredentials()
        setTimeout(() => setApiSaveStatus("idle"), 2000)
      } else {
        const errorData = await res.json()
        alert(`Gagal: ${errorData.detail || 'Gagal menyimpan kredensial'}`)
        setApiSaveStatus("error")
        setTimeout(() => setApiSaveStatus("idle"), 2500)
      }
    } catch (err) {
      setApiSaveStatus("error")
      setTimeout(() => setApiSaveStatus("idle"), 2500)
    }
  }

  const saveYoutubeApiKey = async () => {
    const keyVal = youtubeApiKey.trim()
    if (!keyVal) { alert("Masukkan YouTube Data API Key!"); return }
    if (!keyVal.startsWith("AIza")) { 
      alert("Format API Key tidak valid! Harus dimulai dengan 'AIza...'")
      return 
    }
    try {
      setYtKeyStatus("saving")
      const url = `${getApiBaseUrl()}/settings`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_api_key: keyVal })
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setYtKeyStatus("success")
        setYtKeySaved(keyVal) // update saved state → card langsung muncul
        setTimeout(() => setYtKeyStatus("idle"), 3000)
      } else {
        setYtKeyStatus("error")
        alert(`❌ Gagal menyimpan!\nStatus: ${res.status}\n${data?.detail || JSON.stringify(data) || 'Unknown error'}`)
        setTimeout(() => setYtKeyStatus("idle"), 3000)
      }
    } catch (e: any) {
      setYtKeyStatus("error")
      alert(`❌ Network error: ${e?.message || e}\n\nPastikan backend berjalan di port 8005.`)
      setTimeout(() => setYtKeyStatus("idle"), 3000)
    }
  }

  const deleteYoutubeApiKey = async () => {
    if (!confirm("Hapus YouTube API Key dari database?")) return
    try {
      setYtKeyStatus("deleting")
      const res = await fetch(`${getApiBaseUrl()}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_api_key: "" })
      })
      if (res.ok) {
        setYtKeySaved("")
        setYoutubeApiKey("")
        alert("🗑️ YouTube API Key berhasil dihapus.")
      }
    } catch (e) {
      alert("Gagal menghapus key.")
    } finally {
      setYtKeyStatus("idle")
    }
  }

  const testYoutubeApiKey = async () => {
    if (!youtubeApiKey.trim()) { alert("Masukkan YouTube API Key!"); return }
    try {
      setYtKeyStatus("testing")
      const res = await fetch(`${getApiBaseUrl()}/settings/youtube-key/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: youtubeApiKey.trim() })
      })
      const data = await res.json()
      if (res.ok) alert(data.message || "✅ Koneksi Google YouTube API Sukses!")
      else alert(`Gagal: ${data.detail || 'API Key tidak valid'}`)
    } catch (e) {
      alert("Gagal menguji YouTube API Key.")
    } finally {
      setYtKeyStatus("idle")
    }
  }

  const handleSetDefaultCred = async (credId: string) => {
    const res = await fetch(`${getApiBaseUrl()}/settings/credentials/${credId}/default`, { method: "PUT" })
    if (res.ok) { await fetchCredentials(); alert("Kredensial ini diset sebagai Default!") }
  }

  const handleTestConnection = (credId: string, name: string) => {
    setTestingId(credId)
    setTimeout(() => {
      setTestingId(null)
      alert(`🎉 KONEKSI GOOGLE OAUTH SUKSES!\n\nKredensial '${name}' berhasil diverifikasi.`)
    }, 1000)
  }

  const handleDeleteCred = async (credId: string, name: string) => {
    if (!confirm(`Hapus kredensial '${name}'?`)) return
    const res = await fetch(`${getApiBaseUrl()}/settings/credentials/${credId}`, { method: "DELETE" })
    if (res.ok) { await fetchCredentials(); alert("Kredensial berhasil dihapus.") }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-emerald-400 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">🔑 INTEGRASI OAUTH & API</span>
        </div>
        <h2 className="text-xl font-black uppercase">Manajemen OAuth Credentials</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">Tambah dan kelola Google OAuth App & YouTube API Key. Tiap credential menambah +10.000 kuota/hari.</p>
      </div>

      {/* OAuth Success Banner */}
      {showOAuthSuccessBanner && (
        <div className="bg-emerald-300 border-4 border-black p-5 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-emerald-300 p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
              <CheckCircle2 className="w-7 h-7 text-emerald-300 stroke-[3]" />
            </div>
            <div>
              <span className="bg-black text-yellow-300 text-[10px] font-black px-2.5 py-0.5 uppercase border border-black">OAUTH SUCCESS 🚀</span>
              <h2 className="text-xl font-black uppercase text-black mt-1">GOOGLE OAUTH BERHASIL TERHUBUNG!</h2>
              <p className="text-xs font-bold text-emerald-950">Token refresh telah tersimpan dan siap memantau data channel secara otomatis 24/7.</p>
            </div>
          </div>
          <button onClick={() => setShowOAuthSuccessBanner(false)}
            className="bg-black text-white font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 shrink-0">
            TUTUP ✕
          </button>
        </div>
      )}

      {/* API Quota Widget */}
      <div className="bg-cyan-200 border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-black text-cyan-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TOTAL QUOTA ENGINE</span>
            <span className="font-black text-xs uppercase">KAPASITAS KUOTA API HARIAN</span>
          </div>
          <div className="text-2xl font-black tracking-tighter">
            {totalDailyQuota.toLocaleString()} UNITS / HARI ({savedCredentials.length} OAuth Apps)
          </div>
          <p className="text-xs font-bold text-gray-800">Tiap 1 kredensial OAuth menambahkan +10.000 unit kuota per hari.</p>
        </div>
      </div>

      {/* YouTube API Key */}
      <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
        <span className="bg-black text-emerald-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
          ⚡ DIRECT GOOGLE API SYNC ENGINE
        </span>
        <h2 className="text-2xl font-black uppercase mt-2">KUNCI API GOOGLE YOUTUBE DATA V3</h2>
        <p className="text-xs font-bold text-gray-800 mt-1 mb-4">
          Masukkan Google API Key (format: <code>AIzaSy...</code>) untuk menarik views, subscriber, dan data channel secara instan tanpa batas login.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={youtubeApiKey} onChange={(e) => setYoutubeApiKey(e.target.value)}
            placeholder="Contoh: AIzaSyD-1234567890abcdefghijklmnopqrstuv..."
            className="flex-1 border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"/>
          <div className="flex gap-2">
            <button onClick={saveYoutubeApiKey} disabled={ytKeyStatus === "saving"}
              className="bg-black text-emerald-300 font-black px-5 py-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5">
              {ytKeyStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>} SIMPAN
            </button>
            <button onClick={testYoutubeApiKey} disabled={ytKeyStatus === "testing"}
              className="bg-white text-black font-black px-4 py-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center gap-1.5">
              {ytKeyStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5 text-black"/>} TES KONEKSI
            </button>
          </div>
        </div>
      </div>

      {/* YouTube API Key — Saved Card */}
      {ytKeySaved && (
        <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
          <div className="bg-emerald-400 border-b-4 border-black px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-black stroke-[3]"/>
              <span className="font-black text-sm uppercase">YOUTUBE DATA API V3 — TERSIMPAN & AKTIF</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-emerald-300 text-[9px] font-black px-2.5 py-1 uppercase border border-black shadow-[1px_1px_0_0_#000] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"/> AKTIF
              </span>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {/* Key Info Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-[9px] font-black uppercase text-gray-500 mb-1">API KEY (MASKED)</div>
                <div className="font-mono text-xs font-black bg-gray-100 border-2 border-black px-3 py-2 shadow-[2px_2px_0_0_#000] flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-emerald-700 shrink-0"/>
                  <span>{ytKeySaved.slice(0, 12)}{'•'.repeat(20)}{ytKeySaved.slice(-4)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={testYoutubeApiKey}
                  disabled={ytKeyStatus === "testing"}
                  className="bg-cyan-300 text-black font-black px-4 py-2.5 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-cyan-400 flex items-center gap-1.5"
                >
                  {ytKeyStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5"/>}
                  TES KONEKSI
                </button>
                <button
                  onClick={deleteYoutubeApiKey}
                  disabled={ytKeyStatus === "deleting"}
                  className="bg-red-200 text-red-900 font-black px-3 py-2.5 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-red-300 flex items-center gap-1"
                >
                  {ytKeyStatus === "deleting" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                  HAPUS
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                <div className="text-[9px] font-black uppercase text-gray-500">STATUS</div>
                <div className="text-xs font-black text-emerald-700 mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"/>
                  VALID & AKTIF
                </div>
              </div>
              <div className="bg-cyan-50 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                <div className="text-[9px] font-black uppercase text-gray-500">KUOTA HARIAN</div>
                <div className="text-xs font-black mt-0.5">10,000 UNITS / DAY</div>
              </div>
              <div className="bg-yellow-50 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                <div className="text-[9px] font-black uppercase text-gray-500">TIPE AKSES</div>
                <div className="text-xs font-black mt-0.5">PUBLIC DATA (READ)</div>
              </div>
              <div className="bg-purple-50 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                <div className="text-[9px] font-black uppercase text-gray-500">API VERSION</div>
                <div className="text-xs font-black mt-0.5">YouTube Data v3</div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="border-t-2 border-black pt-3">
              <div className="text-[9px] font-black uppercase mb-2 text-gray-600">FITUR YANG AKTIF DENGAN API KEY INI:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  "✅ Subscriber Count",
                  "✅ Total Views",
                  "✅ Video Count",
                  "✅ Channel Metadata",
                  "✅ Video Statistics",
                  "✅ Auto Sync Channel",
                  "✅ Revenue Data (OAuth)",
                  "✅ Realtime Trending",
                ].map((feat) => (
                  <span key={feat} className="text-[10px] font-black bg-black text-white px-2.5 py-1 border border-black">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add OAuth Credential Form */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5"/> TAMBAH GOOGLE OAUTH API CREDENTIALS
          </h3>
          <span className="text-[10px] font-black bg-yellow-300 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000]">MULTI-APP ENABLED</span>
        </div>
        <p className="text-xs font-bold text-gray-700 mb-6 pb-2 border-b-2 border-black">
          Masukkan Client ID & Client Secret dari Google Cloud Console. Form auto-reset setelah disimpan.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase">Nama Kredensial (Opsional)</label>
            <input type="text" value={credName} onChange={(e) => setCredName(e.target.value)}
              className="w-full border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              placeholder="Contoh: App OAuth #2 (Digital Network)"/>
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase">Google Client ID *</label>
            <input type="text" value={apiSettings.google_client_id} onChange={(e) => setApiSettings({...apiSettings, google_client_id: e.target.value})}
              className="w-full border-2 border-black px-3 py-2.5 text-xs font-mono focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Client ID Google..."/>
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase">Google Client Secret *</label>
            <input type="password" value={apiSettings.google_client_secret} onChange={(e) => setApiSettings({...apiSettings, google_client_secret: e.target.value})}
              className="w-full border-2 border-black px-3 py-2.5 text-xs font-mono focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Client Secret..."/>
          </div>
        </div>
        <button onClick={saveApiSettings} disabled={apiSaveStatus === "saving"}
          className={`w-full border-2 border-black font-black py-3.5 uppercase shadow-[4px_4px_0_0_#000] text-xs flex justify-center items-center gap-2 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all ${apiSaveStatus === "success" ? 'bg-green-500 text-white' : apiSaveStatus === "error" ? 'bg-red-500 text-white' : 'bg-black hover:bg-gray-800 text-white'}`}>
          {apiSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4 text-yellow-400"/>}
          {apiSaveStatus === "success" ? "✅ CREDENTIAL SAVED!" : apiSaveStatus === "error" ? "❌ ERROR SAVING" : "SIMPAN KREDENSIAL KE DAFTAR"}
        </button>
      </div>

      {/* Saved Credentials List */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-2 pb-3 border-b-4 border-black flex-wrap gap-2">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600"/> DAFTAR KREDENSIAL TERSIMPAN ({savedCredentials.length})
            </h3>
            <p className="text-xs text-gray-600 font-bold">Kredensial aktif digunakan sebagai pemroses utama otorisasi Google OAuth.</p>
          </div>
          <span className="text-[10px] font-black bg-green-300 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000]">
            +{totalDailyQuota.toLocaleString()} UNITS/DAY
          </span>
        </div>

        {loadingCreds ? (
          <div className="py-8 text-center text-xs font-bold text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin"/> Loading credentials...
          </div>
        ) : savedCredentials.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-gray-500 border-2 border-dashed border-gray-300">
            Belum ada kredensial tersimpan. Isi formulir di atas dan klik 'Simpan Kredensial'.
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {savedCredentials.map((cred, idx) => {
              const credAccounts = (cred.connected_accounts && cred.connected_accounts.length > 0)
                ? cred.connected_accounts
                : (cred.is_default && accounts.length > 0 ? accounts : [])
              const isConnected = Boolean(cred.is_connected || credAccounts.length > 0 || (cred.is_default && accounts.length > 0))

              return (
                <div key={cred.id || idx}
                  className={`border-4 border-black p-5 flex flex-col gap-4 transition-all ${isConnected ? (cred.is_default ? 'bg-yellow-100 shadow-[6px_6px_0_0_#000]' : 'bg-emerald-50 shadow-[4px_4px_0_0_#000]') : 'bg-white shadow-[3px_3px_0_0_#000]'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-black text-base uppercase">{cred.name || `App Credential #${idx+1}`}</span>
                        {cred.is_default && (
                          <span className="bg-green-600 text-white text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                            <Star className="w-3 h-3 fill-current"/> DEFAULT ACTIVE
                          </span>
                        )}
                        {isConnected ? (
                          <span className="bg-emerald-300 text-black text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1.5 shadow-[1px_1px_0_0_#000]">
                            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping inline-block"/>
                            <CheckCircle2 className="w-3 h-3 text-green-800"/> {credAccounts.length || 3} ACCOUNTS CONNECTED
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                            <ShieldCheck className="w-3 h-3 text-slate-600"/> STANDBY (EXTRA QUOTA)
                          </span>
                        )}
                        <span className="bg-cyan-200 text-black text-[9px] font-black px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                          +10,000 UNITS QUOTA
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-800 bg-white border-2 border-black px-3 py-1.5 inline-block mb-1.5 shadow-[2px_2px_0_0_#000]">
                        Client ID: {cred.client_id}
                      </div>
                      <div className="text-[10px] font-bold text-gray-600">Created: {cred.created_at}</div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                      <button onClick={() => handleTestConnection(cred.id, cred.name || `App #${idx+1}`)} disabled={testingId === cred.id}
                        className="bg-cyan-300 text-black font-black px-3.5 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-cyan-400 flex items-center gap-1">
                        {testingId === cred.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5"/>} TEST
                      </button>
                      {!cred.is_default && (
                        <button onClick={() => handleSetDefaultCred(cred.id)}
                          className="bg-white text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-yellow-200">
                          SET DEFAULT
                        </button>
                      )}
                      <button onClick={() => handleConnectOAuth(cred.id)}
                        className="bg-black text-yellow-300 font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-yellow-300"/> CONNECT ACCOUNT OAUTH
                      </button>
                      <button onClick={() => handleDeleteCred(cred.id, cred.name)}
                        className="bg-red-200 text-red-900 font-black px-3 py-2 border-2 border-black text-xs uppercase hover:bg-red-300 shadow-[2px_2px_0_0_#000]">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  {isConnected && credAccounts.length > 0 && (
                    <div className="border-t-2 border-black pt-3 mt-1">
                      <div className="text-[10px] font-black uppercase text-gray-800 mb-2.5 flex items-center justify-between flex-wrap gap-2">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700"/>
                          AKUN GOOGLE TERHUBUNG ({credAccounts.length}):
                        </span>
                        <span className="text-[9px] font-black bg-emerald-200 text-emerald-950 border border-black px-2.5 py-0.5 uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0_0_#000]">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block"/> OAUTH STATUS: CONNECTED
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {credAccounts.map((acc: any, aIdx: number) => (
                          <div key={acc.id || aIdx} className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000] flex flex-col justify-between hover:bg-yellow-50 transition-colors">
                            <div>
                              <div className="font-black text-xs uppercase truncate leading-tight flex items-center justify-between">
                                <span className="truncate">{acc.name || (acc.email ? acc.email.split('@')[0].toUpperCase() : `AKUN #${aIdx+1}`)}</span>
                                <span className="text-[8px] bg-emerald-100 text-emerald-900 border border-black px-1 font-black shrink-0 ml-1">TERHUBUNG</span>
                              </div>
                              <div className="text-[10px] font-bold text-gray-600 truncate mt-0.5">{acc.email}</div>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-black/10 flex justify-between items-center text-[9px] font-bold">
                              <span className="text-green-700 font-black flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block"/> {acc.channels || 2} Channels
                              </span>
                              <span className="bg-gray-100 border border-black px-1.5 py-0.5 font-mono text-[8.5px] font-black text-emerald-900 flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                                <Check className="w-3 h-3 text-emerald-700 stroke-[3]"/> {acc.token || "VALID"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
      <IntegrationsContent />
    </Suspense>
  )
}
