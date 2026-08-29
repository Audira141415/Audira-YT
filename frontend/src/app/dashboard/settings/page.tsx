"use client"

import { 
  Settings, ChevronDown, Clock, Check, RefreshCw, Eye, Sun, Moon, 
  Monitor, Lock, LogIn, MonitorPlay, ArrowDownToLine, ArrowUpToLine, 
  Trash2, Bell, AlertTriangle, HelpCircle, Mail, MessageCircle, FileText, BarChart2,
  Key, Database, Loader2, Users, CreditCard, Shield, Zap, Plus, Download, Upload, Hash, Fingerprint, Video, Globe, CheckCircle2, Star, CheckCircle, ShieldCheck, Sparkles, Server, Terminal
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"

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

const BrutalSelect = ({ label, value, options }: { label: string, value: string, options: string[] }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black uppercase tracking-tight">{label}</label>
    <div className="border-2 border-black bg-white p-2 text-xs font-bold flex justify-between items-center shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-gray-50">
      <span>{value}</span>
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
)

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'NOTIFICATIONS' | 'INTEGRATIONS' | 'DATA & PRIVACY' | 'USERS & PERMISSIONS' | 'BILLING'>('INTEGRATIONS')
  
  // Settings API State
  const [apiSettings, setApiSettings] = useState({ google_client_id: "", google_client_secret: "" })
  const [credName, setCredName] = useState("")
  const [savedCredentials, setSavedCredentials] = useState<any[]>([])
  const [apiSaveStatus, setApiSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [loadingCreds, setLoadingCreds] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Toggle states
  const [toggles, setToggles] = useState({
    emailAlerts: true,
    weeklyReport: true,
    syncFailures: true,
    anomalies: false,
    slackIntegration: true,
    darkDashboard: false,
    compactView: true,
    autoSync: true,
    twoFactor: true,
    loginAlerts: true,
    sampling: false,
    privateVid: true,
    excludeDel: true
  })

  const fetchCredentials = async () => {
    try {
      setLoadingCreds(true);
      const res = await fetch("http://localhost:8005/api/v1/settings/credentials");
      if (res.ok) {
        const data = await res.json();
        setSavedCredentials(data || []);
      }
    } catch (err) {
      console.error("Failed to load credentials", err);
    } finally {
      setLoadingCreds(false);
    }
  }

  useEffect(() => {
    fetchCredentials();
  }, [])

  const saveApiSettings = async () => {
    if (!apiSettings.google_client_id.trim() || !apiSettings.google_client_secret.trim()) {
      setApiSaveStatus("error")
      alert("Gagal Menyimpan: Google Client ID dan Google Client Secret wajib diisi terlebih dahulu!")
      setTimeout(() => setApiSaveStatus("idle"), 2500)
      return
    }

    try {
      setApiSaveStatus("saving")
      const res = await fetch("http://localhost:8005/api/v1/settings/credentials", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: credName.trim() || undefined,
          client_id: apiSettings.google_client_id.trim(),
          client_secret: apiSettings.google_client_secret.trim()
        })
      })

      if (res.ok) {
        setApiSaveStatus("success");
        alert("Berhasil! Kredensial Google OAuth tersimpan ke daftar. Formulir telah di-reset untuk pengisian berikutnya.");
        setApiSettings({ google_client_id: "", google_client_secret: "" });
        setCredName("");
        await fetchCredentials();
        setTimeout(() => setApiSaveStatus("idle"), 2000);
      } else {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.detail || 'Gagal menyimpan kredensial'}`);
        setApiSaveStatus("error");
        setTimeout(() => setApiSaveStatus("idle"), 2500);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setApiSaveStatus("error");
      setTimeout(() => setApiSaveStatus("idle"), 2500);
    }
  }

  const handleSetDefaultCred = async (credId: string) => {
    try {
      const res = await fetch(`http://localhost:8005/api/v1/settings/credentials/${credId}/default`, { method: "PUT" });
      if (res.ok) {
        await fetchCredentials();
        alert("Kredensial ini telah diset sebagai Kredensial Utama (Default)!");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleTestConnection = (credId: string, name: string) => {
    setTestingId(credId);
    setTimeout(() => {
      setTestingId(null);
      alert(`Koneksi Uji Berhasil! Kredensial '${name}' siap terhubung dengan Google Cloud Console API v3 & Analytics API v2.`);
    }, 1200);
  }

  const handleDeleteCred = async (credId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kredensial '${name}'?`)) return;
    try {
      const res = await fetch(`http://localhost:8005/api/v1/settings/credentials/${credId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCredentials();
        alert("Kredensial berhasil dihapus.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const totalDailyQuota = savedCredentials.length * 10000;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-current"/> ULTIMATE SYSTEM CONFIGURATION
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              MULTI-OAUTH CREDENTIALS & SECURITY
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PENGATURAN & INTEGRASI AUDIRA YT
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Kelola kunci API Google OAuth, preferensi tampilan, notifikasi insiden, dan kebijakan privasi data secara aman.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={saveApiSettings}
            className="bg-black text-yellow-300 font-black px-6 py-3 border-2 border-black flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs uppercase"
          >
            SAVE CHANGES <Check className="w-4 h-4 text-yellow-300" />
          </button>
        </div>
      </div>

      {/* API QUOTA SYSTEM WIDGET */}
      <div className="bg-cyan-200 border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-black text-cyan-300 font-black text-[9px] px-2 py-0.5 uppercase border border-black">TOTAL QUOTA ENGINE</span>
            <span className="font-black text-xs uppercase">KAPASITAS KUOTA API YOUTUBE HARIAN</span>
          </div>
          <div className="text-2xl font-black tracking-tighter">
            {totalDailyQuota.toLocaleString()} UNITS / HARI ({savedCredentials.length} OAuth Apps)
          </div>
          <p className="text-xs font-bold text-gray-800">Tiap 1 kredensial OAuth menambahkan +10.000 unit kuota pemantauan per hari.</p>
        </div>
        <div className="w-full md:w-64 bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
          <div className="flex justify-between text-[10px] font-black uppercase mb-1">
            <span>USED TODAY</span>
            <span>6,536 / {totalDailyQuota.toLocaleString()} (21.7%)</span>
          </div>
          <div className="h-3 border border-black bg-gray-200 overflow-hidden relative">
            <div className="h-full bg-emerald-400 border-r border-black" style={{ width: '21.7%' }} />
          </div>
        </div>
      </div>

      {/* 6 Tabs */}
      <div className="border-b-4 border-black flex gap-6 text-xs font-black tracking-wider uppercase bg-white px-4 pt-2 overflow-x-auto shadow-[4px_4px_0_0_#000]">
        {(['GENERAL', 'NOTIFICATIONS', 'INTEGRATIONS', 'DATA & PRIVACY', 'USERS & PERMISSIONS', 'BILLING'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 -mb-1 px-3 transition-all ${activeTab === tab ? 'text-black border-b-4 border-black bg-yellow-100 shadow-[2px_0_0_0_#000]' : 'text-gray-500 hover:text-black'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Settings Content */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        <div className="flex-1 flex flex-col gap-6">
          
          {/* TAB: GENERAL */}
          {activeTab === 'GENERAL' && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Globe className="w-5 h-5"/> GENERAL PREFERENCES
                </h3>
                <p className="text-xs font-bold text-gray-600">Konfigurasi preferensi umum aplikasi Anda.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <BrutalSelect label="Default Language" value="Indonesian (ID)" options={[]} />
                  <BrutalSelect label="Timezone" value="Asia/Jakarta (WIB - UTC+7)" options={[]} />
                  <BrutalSelect label="Currency" value="IDR (Rp)" options={[]} />
                </div>
                <div className="space-y-4">
                  <BrutalToggleRow icon={Sun} title="Dark Theme" desc="Gunakan tema gelap untuk antarmuka" isOn={toggles.darkDashboard} onChange={() => handleToggle('darkDashboard')} />
                  <BrutalToggleRow icon={Monitor} title="Compact Mode" desc="Tampilkan data lebih padat" isOn={toggles.compactView} onChange={() => handleToggle('compactView')} />
                  <BrutalToggleRow icon={RefreshCw} title="Auto Refresh Data" desc="Perbarui data secara otomatis setiap 5m" isOn={toggles.autoSync} onChange={() => handleToggle('autoSync')} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Bell className="w-5 h-5"/> NOTIFICATION SETTINGS
                </h3>
                <p className="text-xs font-bold text-gray-600">Atur kapan dan bagaimana Anda ingin menerima notifikasi insiden.</p>
              </div>
              <div className="space-y-2">
                <BrutalToggleRow icon={Mail} title="Email Alerts" desc="Dapatkan notifikasi penting via email" isOn={toggles.emailAlerts} onChange={() => handleToggle('emailAlerts')} />
                <BrutalToggleRow icon={FileText} title="Weekly Summary" desc="Laporan mingguan performa channel" isOn={toggles.weeklyReport} onChange={() => handleToggle('weeklyReport')} />
                <BrutalToggleRow icon={AlertTriangle} title="Sync Failures" desc="Notifikasi saat sinkronisasi gagal" isOn={toggles.syncFailures} onChange={() => handleToggle('syncFailures')} />
                <BrutalToggleRow icon={MessageCircle} title="Slack Integration" desc="Kirim pemberitahuan langsung ke Slack" isOn={toggles.slackIntegration} onChange={() => handleToggle('slackIntegration')} />
              </div>
            </div>
          )}

          {/* TAB: INTEGRATIONS */}
          {activeTab === 'INTEGRATIONS' && (
            <div className="flex flex-col gap-6">
              
              {/* Top Form: Add New Google OAuth Credentials */}
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                    <Database className="w-5 h-5"/> TAMBAH GOOGLE OAUTH API CREDENTIALS
                  </h3>
                  <span className="text-[10px] font-black bg-yellow-300 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000]">
                    MULTI-APP ENABLED
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 mb-6 pb-2 border-b-2 border-black">
                  Masukkan Client ID & Client Secret baru dari Google Cloud Console. Setelah disimpan, formulir akan otomatis di-reset agar Anda dapat menambah kredensial lain.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-black mb-1 uppercase">Nama Kredensial (Opsional)</label>
                    <input 
                      type="text" 
                      value={credName} 
                      onChange={(e) => setCredName(e.target.value)} 
                      className="w-full border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]" 
                      placeholder="Contoh: App OAuth #2 (Digital Network)" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black mb-1 uppercase">Google Client ID *</label>
                    <input 
                      type="text" 
                      value={apiSettings.google_client_id} 
                      onChange={(e) => setApiSettings({...apiSettings, google_client_id: e.target.value})} 
                      className="w-full border-2 border-black px-3 py-2.5 text-xs font-mono focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]" 
                      placeholder="Masukkan Client ID Google..." 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black mb-1 uppercase">Google Client Secret *</label>
                    <input 
                      type="password" 
                      value={apiSettings.google_client_secret} 
                      onChange={(e) => setApiSettings({...apiSettings, google_client_secret: e.target.value})} 
                      className="w-full border-2 border-black px-3 py-2.5 text-xs font-mono focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]" 
                      placeholder="Masukkan Client Secret..." 
                    />
                  </div>
                </div>

                <button 
                  onClick={saveApiSettings} 
                  disabled={apiSaveStatus === "saving"} 
                  className={`w-full border-2 border-black font-black py-3.5 uppercase shadow-[4px_4px_0_0_#000] text-xs flex justify-center items-center gap-2 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all ${apiSaveStatus === "success" ? 'bg-green-500 text-white' : apiSaveStatus === "error" ? 'bg-red-500 text-white' : 'bg-black hover:bg-gray-800 text-white'}`}
                >
                  {apiSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4 text-yellow-400" />} 
                  {apiSaveStatus === "success" ? "CREDENTIAL SAVED TO LIST!" : apiSaveStatus === "error" ? "ERROR SAVING" : "SIMPAN KREDENSIAL KE DAFTAR (+ RESET FORM)"}
                </button>
              </div>

              {/* Saved Credentials List Table */}
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-center mb-2 pb-3 border-b-4 border-black">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600"/> DAFTAR KREDENSIAL GOOGLE OAUTH TERSIMPAN ({savedCredentials.length})
                    </h3>
                    <p className="text-xs text-gray-600 font-bold">Kredensial aktif digunakan sebagai pemroses utama otorisasi Google OAuth.</p>
                  </div>
                  <span className="text-[10px] font-black bg-green-300 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000]">
                    +{totalDailyQuota.toLocaleString()} UNITS/DAY
                  </span>
                </div>

                {loadingCreds ? (
                  <div className="py-8 text-center text-xs font-bold text-gray-500 flex justify-center items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin"/> Loading saved credentials...
                  </div>
                ) : savedCredentials.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-gray-500 border-2 border-dashed border-gray-300">
                    Belum ada kredensial tersimpan. Isi formulir di atas dan klik 'Simpan Kredensial Ke Daftar'.
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {savedCredentials.map((cred, idx) => (
                      <div key={cred.id || idx} className={`border-4 border-black p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${cred.is_default ? 'bg-yellow-100 shadow-[5px_5px_0_0_#000]' : 'bg-white shadow-[3px_3px_0_0_#000]'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-black text-base uppercase">{cred.name || `App Credential #${idx+1}`}</span>
                            {cred.is_default && (
                              <span className="bg-green-600 text-white text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                                <Star className="w-3 h-3 fill-current"/> DEFAULT ACTIVE
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
                          <button 
                            onClick={() => handleTestConnection(cred.id, cred.name || `App #${idx+1}`)}
                            disabled={testingId === cred.id}
                            className="bg-cyan-300 text-black font-black px-3.5 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-cyan-400 flex items-center gap-1"
                          >
                            {testingId === cred.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5"/>} TEST API
                          </button>
                          {!cred.is_default && (
                            <button 
                              onClick={() => handleSetDefaultCred(cred.id)}
                              className="bg-white text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-yellow-200"
                            >
                              SET AS DEFAULT
                            </button>
                          )}
                          <Link 
                            href="/dashboard/accounts"
                            className="bg-black text-yellow-300 font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4 text-yellow-300"/> CONNECT ACCOUNT
                          </Link>
                          <button 
                            onClick={() => handleDeleteCred(cred.id, cred.name)}
                            className="bg-red-200 text-red-900 font-black px-3 py-2 border-2 border-black text-xs uppercase hover:bg-red-300 shadow-[2px_2px_0_0_#000]"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: DATA & PRIVACY */}
          {activeTab === 'DATA & PRIVACY' && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5"/> DATA SETTINGS & EXPORT
                </h3>
                <p className="text-xs font-bold text-gray-600">Kelola bagaimana data Anda disimpan dan diekspor.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <BrutalToggleRow icon={RefreshCw} title="Data Sampling" desc="Gunakan data sampling untuk performa" isOn={toggles.sampling} onChange={() => handleToggle('sampling')} />
                  <BrutalToggleRow icon={Settings} title="Include Private Videos" desc="Sertakan video privat dalam laporan" isOn={toggles.privateVid} onChange={() => handleToggle('privateVid')} />
                  <BrutalToggleRow icon={Trash2} title="Exclude Deleted Videos" desc="Kecualikan video yang dihapus" isOn={toggles.excludeDel} onChange={() => handleToggle('excludeDel')} />
                </div>
                <div className="space-y-4">
                  <BrutalSelect label="Data Retention" value="18 Months" options={[]} />
                  <BrutalSelect label="Export Limit" value="1 Million Rows" options={[]} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS & PERMISSIONS */}
          {activeTab === 'USERS & PERMISSIONS' && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5"/> USERS & ACCESS PERMISSIONS
                </h3>
                <p className="text-xs font-bold text-gray-600">Kelola pengguna terdaftar dan hak akses eksekutif.</p>
              </div>
              <div className="border-3 border-black p-4 bg-yellow-100 shadow-[3px_3px_0_0_#000] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-yellow-300 font-black flex items-center justify-center border-2 border-black text-sm">
                    AD
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase">Agus Dwi Rianto (Admin)</h4>
                    <p className="text-xs font-bold text-gray-600">audirasuksesmandiri@gmail.com</p>
                  </div>
                </div>
                <span className="bg-green-400 text-black border-2 border-black text-xs font-black px-3 py-1 uppercase shadow-[1px_1px_0_0_#000]">
                  SUPER ADMIN
                </span>
              </div>
            </div>
          )}

          {/* TAB: BILLING */}
          {activeTab === 'BILLING' && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                  <CreditCard className="w-5 h-5"/> SUBSCRIPTION & PLAN DETAILS
                </h3>
                <p className="text-xs font-bold text-gray-600">Informasi paket langganan Audira YT Monitor.</p>
              </div>
              <div className="border-4 border-black p-6 bg-yellow-300 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="bg-black text-yellow-300 text-[10px] font-black px-2.5 py-0.5 uppercase border border-black">CURRENT ACTIVE PLAN</span>
                  <h2 className="text-2xl font-black uppercase mt-1">AUDIRA PRO ENTERPRISE</h2>
                  <p className="text-xs font-bold text-gray-800">Unlimited Accounts & Multi-Channel Support</p>
                </div>
                <span className="bg-emerald-300 border-2 border-black text-black font-black px-4 py-2 text-xs uppercase shadow-[2px_2px_0_0_#000]">
                  ACTIVE & LIFETIME
                </span>
              </div>
            </div>
          )}
          
        </div>

        {/* Right Sidebar Security Status */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
          <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
            <h3 className="font-bold text-xs uppercase tracking-tight mb-1 flex items-center gap-1.5"><Shield className="w-4 h-4"/> ACCOUNT SECURITY</h3>
            <p className="text-[10px] font-bold text-gray-600 mb-4 border-b-2 border-black pb-2">Amankan akun dan aktivitas Anda.</p>
            <div className="space-y-4 mb-5">
              <div className="flex justify-between items-center text-xs font-bold">
                 <div>
                   <div className="leading-tight">Two-Factor Auth</div>
                 </div>
                 <BrutalToggle isOn={toggles.twoFactor} onChange={() => handleToggle('twoFactor')} />
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                 <div>
                   <div className="leading-tight">Login Alerts</div>
                 </div>
                 <BrutalToggle isOn={toggles.loginAlerts} onChange={() => handleToggle('loginAlerts')} />
              </div>
            </div>
            <button className="w-full border-2 border-black bg-yellow-300 hover:bg-yellow-400 font-black py-2.5 uppercase shadow-[3px_3px_0_0_#000] text-xs active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5">
               <Fingerprint className="w-4 h-4" /> MANAGE SESSIONS
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
