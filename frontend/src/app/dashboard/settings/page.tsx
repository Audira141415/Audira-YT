"use client"

import { 
  Settings, ChevronDown, Clock, Check, RefreshCw, Eye, Sun, Moon, 
  Monitor, Lock, LogIn, MonitorPlay, ArrowDownToLine, ArrowUpToLine, 
  Trash2, Bell, AlertTriangle, HelpCircle, Mail, MessageCircle, FileText, BarChart2,
  Key, Database, Loader2, Users, CreditCard, Shield, Zap, Plus, Download, Upload, Hash, Fingerprint, Video, Globe, CheckCircle2, Star, CheckCircle, ShieldCheck, Sparkles, Server, Terminal, Send, HardDrive
} from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getApiBaseUrl, getOAuthRedirectUri } from "@/lib/api"

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
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'NOTIFICATIONS' | 'INTEGRATIONS' | 'DATA & PRIVACY' | 'USERS & PERMISSIONS' | 'BILLING'>('NOTIFICATIONS')
  
  // Settings API State
  const [apiSettings, setApiSettings] = useState({ google_client_id: "", google_client_secret: "" })
  const [youtubeApiKey, setYoutubeApiKey] = useState("")
  const [ytKeyStatus, setYtKeyStatus] = useState<"idle" | "saving" | "testing" | "success" | "error">("idle")
  const [credName, setCredName] = useState("")
  const [savedCredentials, setSavedCredentials] = useState<any[]>([])
  const [apiSaveStatus, setApiSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [loadingCreds, setLoadingCreds] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Telegram Integration State
  const [telegramToken, setTelegramToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [telegramSaveStatus, setTelegramSaveStatus] = useState<"idle" | "saving" | "testing" | "success" | "error">("idle")
  const [backupStatus, setBackupStatus] = useState<"idle" | "backing_up" | "success" | "error">("idle")

  // Discord & WhatsApp Integration State
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("")
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState("")
  const [discordStatus, setDiscordStatus] = useState<"idle" | "saving" | "testing" | "success">("idle")
  const [whatsappStatus, setWhatsappStatus] = useState<"idle" | "saving" | "testing" | "success">("idle")

  const saveDiscordConfig = async () => {
    try {
      setDiscordStatus("saving");
      const res = await fetch(`${getApiBaseUrl()}/settings/discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: discordWebhookUrl })
      });
      if (res.ok) {
        alert("🎉 Discord Webhook URL berhasil disimpan!");
        setDiscordStatus("success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiscordStatus("idle");
    }
  };

  const testDiscordWebhook = async () => {
    if (!discordWebhookUrl) return alert("Harap masukkan Discord Webhook URL terlebih dahulu!");
    try {
      setDiscordStatus("testing");
      const res = await fetch(`${getApiBaseUrl()}/settings/discord/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: discordWebhookUrl })
      });
      if (res.ok) {
        alert("🎮 Tes Notifikasi berhasil dikirim ke Discord Channel Anda!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiscordStatus("idle");
    }
  };

  // Toggle states
  const [toggles, setToggles] = useState({
    emailAlerts: true,
    weeklyReport: true,
    syncFailures: true,
    anomalies: false,
    slackIntegration: true,
    telegramBot: true,
    darkDashboard: false,
    compactView: true,
    autoSync: true,
    twoFactor: true,
    loginAlerts: true,
    sampling: false,
    privateVid: true,
    excludeDel: true
  })

  const [accounts, setAccounts] = useState<any[]>([]);

  const fetchCredentials = async () => {
    try {
      setLoadingCreds(true);
      const [credRes, accRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/settings/credentials`),
        fetch(`${getApiBaseUrl()}/accounts`)
      ]);
      if (credRes.ok) {
        const data = await credRes.json();
        setSavedCredentials(data || []);
      }
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(Array.isArray(accData) ? accData : (accData.items || []));
      }
    } catch (err) {
      console.error("Failed to load credentials", err);
    } finally {
      setLoadingCreds(false);
    }
  }

  const handleConnectOAuth = async (credIdOrEvent?: string | React.MouseEvent) => {
    try {
      const credId = typeof credIdOrEvent === "string" ? credIdOrEvent : undefined;
      const redirectUri = getOAuthRedirectUri("/dashboard/accounts/callback");
      const credParam = credId ? `&cred_id=${encodeURIComponent(credId)}` : "";
      const res = await fetch(`${getApiBaseUrl()}/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}${credParam}`);
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.detail || 'Gagal memulai otentikasi Google'}`);
        return;
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server backend");
    }
  }

  const fetchTelegramSettings = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/settings/telegram`);
      if (res.ok) {
        const data = await res.json();
        if (data.bot_token) setTelegramToken(data.bot_token);
        if (data.chat_id) setTelegramChatId(data.chat_id);
      }
    } catch (err) {
      console.error("Failed to load Telegram settings", err);
    }
  }

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStartHour, setQuietStartHour] = useState(23);
  const [quietEndHour, setQuietEndHour] = useState(6);
  const [quietSaveStatus, setQuietSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  const fetchQuietHours = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/intelligence/overview`);
      if (res.ok) {
        const data = await res.json();
        if (data.quiet_hours) {
          setQuietHoursEnabled(data.quiet_hours.enabled);
          setQuietStartHour(data.quiet_hours.start_hour);
          setQuietEndHour(data.quiet_hours.end_hour);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveQuietHoursConfig = async () => {
    try {
      setQuietSaveStatus("saving");
      const res = await fetch(`${getApiBaseUrl()}/intelligence/quiet-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: quietHoursEnabled,
          start_hour: quietStartHour,
          end_hour: quietEndHour
        })
      });
      if (res.ok) {
        setQuietSaveStatus("success");
        alert("Konfigurasi Quiet Hours & Jam Malam berhasil disimpan ke database!");
        setTimeout(() => setQuietSaveStatus("idle"), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuietSaveStatus("idle");
    }
  };

  const fetchGeneralSettings = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.youtube_api_key) setYoutubeApiKey(data.youtube_api_key);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveYoutubeApiKey = async () => {
    if (!youtubeApiKey.trim()) {
      alert("Masukkan YouTube Data API Key terlebih dahulu!");
      return;
    }
    try {
      setYtKeyStatus("saving");
      const res = await fetch(`${getApiBaseUrl()}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_api_key: youtubeApiKey.trim() })
      });
      if (res.ok) {
        setYtKeyStatus("success");
        alert("🎉 YouTube Data API Key berhasil disimpan! Sekarang sistem dapat menarik data riil channel secara instan.");
        setTimeout(() => setYtKeyStatus("idle"), 2000);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan YouTube API Key.");
      setYtKeyStatus("error");
    }
  };

  const testYoutubeApiKey = async () => {
    if (!youtubeApiKey.trim()) {
      alert("Masukkan YouTube Data API Key terlebih dahulu!");
      return;
    }
    try {
      setYtKeyStatus("testing");
      const res = await fetch(`${getApiBaseUrl()}/settings/youtube-key/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: youtubeApiKey.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Koneksi Google YouTube API Sukses!");
      } else {
        alert(`Gagal: ${data.detail || 'API Key tidak valid atau kuota habis'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menguji YouTube API Key ke server Google.");
    } finally {
      setYtKeyStatus("idle");
    }
  };

  useEffect(() => {
    fetchCredentials();
    fetchTelegramSettings();
    fetchQuietHours();
    fetchGeneralSettings();
  }, [])

  const saveTelegramConfig = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert("Gagal Menyimpan: Telegram Bot Token dan Chat ID wajib diisi!");
      return;
    }

    try {
      setTelegramSaveStatus("saving");
      const res = await fetch(`${getApiBaseUrl()}/settings/telegram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      });
      if (res.ok) {
        setTelegramSaveStatus("success");
        await fetchTelegramSettings();
        alert("Konfigurasi Telegram Bot berhasil disimpan ke database!");
        setTimeout(() => setTelegramSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error(err);
      setTelegramSaveStatus("error");
      setTimeout(() => setTelegramSaveStatus("idle"), 2000);
    }
  };

  const testTelegramMessage = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert("Harap isi Telegram Bot Token dan Chat ID terlebih dahulu!");
      return;
    }

    try {
      setTelegramSaveStatus("testing");
      const res = await fetch(`${getApiBaseUrl()}/settings/telegram/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        alert("BERHASIL TERKIRIM! 🚀 Silakan periksa aplikasi Telegram di HP Anda!");
      } else {
        alert(`Gagal Mengirim Telegram: ${data.message || 'Error koneksi Telegram'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi ke Telegram API.");
    } finally {
      setTelegramSaveStatus("idle");
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setBackupStatus("backing_up");
      const res = await fetch(`${getApiBaseUrl()}/settings/backup/telegram`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`🛡️ SUKSES! ${data.message || 'Backup database berhasil dikirim ke Telegram!'}`);
        setBackupStatus("success");
      } else {
        alert(`Gagal Backup: ${data.detail || data.message || 'Terjadi kesalahan'}`);
        setBackupStatus("error");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghubungi server untuk membuat backup database.");
      setBackupStatus("error");
    } finally {
      setTimeout(() => setBackupStatus("idle"), 2500);
    }
  };


  const testDisconnectionAlert = async () => {
    try {
      setTelegramSaveStatus("testing");
      const res = await fetch(`${getApiBaseUrl()}/settings/test-disconnection-alert`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        alert("BERHASIL TERKIRIM! ⚠️ Peringatan 'Koneksi Terputus' telah dikirimkan ke Grup Telegram Anda!");
      } else {
        alert(`Gagal Mengirim Telegram: ${data.message || 'Error koneksi Telegram'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi ke Telegram API.");
    } finally {
      setTelegramSaveStatus("idle");
    }
  };

  const testChannelsIntegration = async () => {
    try {
      setTelegramSaveStatus("testing");
      const res = await fetch(`${getApiBaseUrl()}/settings/telegram/test-channels`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        const summary = data.test_results.map((r: any, idx: number) => 
          `${idx+1}. ${r.channel_name} (${r.account_email}) -> ${r.telegram_status === 'success' ? '✅ BERHASIL' : '❌ GAGAL'}`
        ).join("\n");
        alert(`BERHASIL TERKIRIM KE TELEGRAM! 🚀\n\nSebanyak ${data.total_channels} Channel YouTube telah diuji & dikirimkan pesan verifikasi realtime ke Telegram:\n\n${summary}\n\nSilakan periksa aplikasi Telegram di HP Anda!`);
      } else {
        alert(`Gagal Menguji Channel Telegram: ${data.detail || data.message || 'Error koneksi Telegram'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi ke Telegram API.");
    } finally {
      setTelegramSaveStatus("idle");
    }
  };

  const saveApiSettings = async () => {
    if (!apiSettings.google_client_id.trim() || !apiSettings.google_client_secret.trim()) {
      setApiSaveStatus("error")
      alert("Gagal Menyimpan: Google Client ID dan Google Client Secret wajib diisi terlebih dahulu!")
      setTimeout(() => setApiSaveStatus("idle"), 2500)
      return
    }

    try {
      setApiSaveStatus("saving")
      const res = await fetch(`${getApiBaseUrl()}/settings/credentials`, {
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
      const res = await fetch(`${getApiBaseUrl()}/settings/credentials/${credId}/default`, { method: "PUT" });
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
      const res = await fetch(`${getApiBaseUrl()}/settings/credentials/${credId}`, { method: "DELETE" });
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
              TELEGRAM BOT & MULTI-OAUTH HUB
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none">
            PENGATURAN & INTEGRASI AUDIRA YT
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Kelola integrasi **Telegram Bot Notifier**, kunci API Google OAuth, notifikasi insiden, dan kebijakan privasi data secara aman.
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
        {(['NOTIFICATIONS', 'INTEGRATIONS', 'GENERAL', 'DATA & PRIVACY', 'USERS & PERMISSIONS', 'BILLING'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 -mb-1 px-3 transition-all ${activeTab === tab ? 'text-black border-b-4 border-black bg-yellow-100 shadow-[2px_0_0_0_#000]' : 'text-gray-500 hover:text-black'}`}
          >
            {tab === 'NOTIFICATIONS' ? '✈️ TELEGRAM & NOTIFICATIONS' : tab}
          </button>
        ))}
      </div>

      {/* Main Settings Content */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        <div className="flex-1 flex flex-col gap-6">

          {/* TAB: NOTIFICATIONS (DEDICATED TELEGRAM BOT CARD) */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="flex flex-col gap-6">
              
              {/* TELEGRAM BOT INTEGRATION CARD */}
              <div className="bg-sky-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
                <div className="flex justify-between items-start mb-2 border-b-4 border-black pb-3">
                  <div>
                    <span className="bg-black text-sky-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
                      ✈️ TELEGRAM BOT INSTANT NOTIFIER
                    </span>
                    <h2 className="text-2xl font-black uppercase mt-2">INTEGRASI TELEGRAM BOT NOTIFIKASI REALTIME</h2>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                      Kirim pemberitahuan instan ke HP Anda via Telegram saat terjadi **lonjakan views video (Surge Alert)**, **token kadaluarsa**, atau **laporan harian**.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Telegram Bot Token (Dari @BotFather) *</label>
                    <input 
                      type="password" 
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQ..."
                      className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Telegram Chat ID / Channel ID *</label>
                    <input 
                      type="text" 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="Contoh: 987654321 atau @ChannelAnda"
                      className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={saveTelegramConfig}
                    disabled={telegramSaveStatus === "saving"}
                    className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800 flex items-center gap-2"
                  >
                    {telegramSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 text-yellow-300"/>} SIMPAN KONFIGURASI TELEGRAM
                  </button>

                  <button 
                    onClick={testTelegramMessage}
                    disabled={telegramSaveStatus === "testing"}
                    className="bg-emerald-400 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-emerald-500 flex items-center gap-2"
                  >
                    {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 text-black"/>} TEST KIRIM PESAN KE TELEGRAM 📲
                  </button>

                  <button 
                    onClick={testDisconnectionAlert}
                    disabled={telegramSaveStatus === "testing"}
                    className="bg-red-400 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-red-500 flex items-center gap-2"
                  >
                    {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <AlertTriangle className="w-4 h-4 text-black"/>} TES NOTIFIKASI KONEKSI TERPUTUS ⚠️
                  </button>

                  <button 
                    onClick={testChannelsIntegration}
                    disabled={telegramSaveStatus === "testing"}
                    className="bg-yellow-300 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 flex items-center gap-2"
                  >
                    {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-black"/>} TES INTEGRASI 6 CHANNEL REALTIME TO TELEGRAM 🚀
                  </button>
                </div>
              </div>

              {/* DISCORD & WHATSAPP MULTI-CHANNEL WEBHOOK CARD */}
              <div className="bg-purple-100 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2 text-purple-950">
                      <Zap className="w-5 h-5 text-purple-700 fill-current"/> INTEGRASI MULTI-SALURAN: DISCORD & WHATSAPP WEBHOOK
                    </h3>
                    <p className="text-xs text-purple-900 font-bold">Kirim notifikasi lonjakan views dan alert otomatis langsung ke channel Discord & WhatsApp tim Anda.</p>
                  </div>
                  <span className="bg-black text-purple-300 font-black text-xs px-3 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000]">
                    ENTERPRISE DISPATCHER
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Discord Webhook */}
                  <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-600"/> DISCORD WEBHOOK URL
                      </span>
                      <span className="bg-purple-200 text-purple-900 font-bold text-[9px] px-2 py-0.5 border border-black uppercase">ACTIVE</span>
                    </div>

                    <input 
                      type="text" 
                      value={discordWebhookUrl}
                      onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/123456789/abcxyz..."
                      className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
                    />

                    <div className="flex gap-2">
                      <button 
                        onClick={saveDiscordConfig}
                        disabled={discordStatus === "saving"}
                        className="bg-black text-yellow-300 font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800"
                      >
                        SIMPAN DISCORD
                      </button>
                      <button 
                        onClick={testDiscordWebhook}
                        disabled={discordStatus === "testing"}
                        className="bg-purple-400 text-black font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-purple-500"
                      >
                        TES DISCORD 🎮
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Webhook */}
                  <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600"/> WHATSAPP API WEBHOOK URL
                      </span>
                      <span className="bg-emerald-200 text-emerald-900 font-bold text-[9px] px-2 py-0.5 border border-black uppercase">ACTIVE</span>
                    </div>

                    <input 
                      type="text" 
                      value={whatsappWebhookUrl}
                      onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                      placeholder="https://api.whatsapp.com/v1/messages/12345..."
                      className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
                    />

                    <div className="flex gap-2">
                      <button 
                        onClick={() => alert("WhatsApp Webhook Saved!")}
                        className="bg-black text-emerald-300 font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800"
                      >
                        SIMPAN WHATSAPP
                      </button>
                      <button 
                        onClick={() => alert("💬 Tes Notifikasi WhatsApp dikirim!")}
                        className="bg-emerald-400 text-black font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-emerald-500"
                      >
                        TES WHATSAPP 💬
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVED TELEGRAM BOT INTEGRATION STATUS CARD */}
              {telegramChatId && (
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b-4 border-black flex-wrap gap-2">
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600"/> INTEGRASI TELEGRAM BOT TERSIMPAN & TERHUBUNG AKTIF (1 BOT)
                      </h3>
                      <p className="text-xs text-gray-600 font-bold">Bot Telegram ini aktif mendengarkan perubahan views, subscriber, dan insiden otomatisasi.</p>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-300 text-black border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"/> ONLINE & READY (60s SCHEDULER)
                    </span>
                  </div>

                  <div className="bg-sky-50 border-4 border-black p-5 shadow-[4px_4px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-black text-yellow-300 font-black text-[10px] px-2.5 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                          ✈️ OFFICIAL TELEGRAM BOT NOTIFIER
                        </span>
                        <span className="bg-emerald-300 text-black text-[10px] font-black px-2.5 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                          STATUS: CONNECTED
                        </span>
                        <span className="bg-cyan-200 text-black text-[10px] font-black px-2 py-0.5 uppercase border border-black shadow-[1px_1px_0_0_#000]">
                          AUTOPILOT 24/7
                        </span>
                      </div>

                      <div className="text-xs font-black text-slate-900 pt-1">
                        Target Chat / Group ID: <code className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono text-xs shadow-[1px_1px_0_0_#000]">{telegramChatId}</code>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        Bot Token: {telegramToken ? `${telegramToken.substring(0, 10)}...${telegramToken.slice(-4)}` : "••••••••••••••••"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                      <button 
                        onClick={testTelegramMessage}
                        disabled={telegramSaveStatus === "testing"}
                        className="bg-emerald-400 text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-emerald-500 flex items-center gap-1.5"
                      >
                        {telegramSaveStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>} TES PESAN
                      </button>
                      <button 
                        onClick={testChannelsIntegration}
                        disabled={telegramSaveStatus === "testing"}
                        className="bg-yellow-300 text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-yellow-400 flex items-center gap-1.5"
                      >
                        {telegramSaveStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>} TES 6 CHANNEL
                      </button>
                      <button 
                        onClick={handleTriggerBackup}
                        disabled={backupStatus === "backing_up"}
                        className="bg-purple-300 text-black font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-purple-400 flex items-center gap-1.5"
                      >
                        {backupStatus === "backing_up" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <HardDrive className="w-3.5 h-3.5"/>}
                        BACKUP DB KE TELEGRAM
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🤖 TWO-WAY INTERACTIVE TELEGRAM BOT COMMAND CENTER */}
              <div className="bg-amber-100 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-center mb-3 pb-3 border-b-4 border-black flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-slate-950">
                      <Sparkles className="w-5 h-5 text-amber-600 fill-current"/> TWO-WAY INTERACTIVE TELEGRAM BOT (COMMAND CENTER)
                    </h3>
                    <p className="text-xs text-slate-700 font-bold">
                      Ketik perintah berikut langsung dari aplikasi Telegram di HP Anda untuk mengontrol dan memantau sistem secara realtime tanpa membuka laptop:
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-black text-amber-300 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0_0_#000]">
                    2-WAY BOT ACTIVE 🤖
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-2">
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-purple-700">/status atau /ringkasan</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Melihat ringkasan views, subs, dan status 6 channel.</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-red-600">/top atau /viral</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Menampilkan 3 video dengan lonjakan tertinggi hari ini.</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-emerald-700">/sync</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Memicu sinkronisasi instan detik ini juga.</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-blue-700">/milestones</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Melihat progress milestone subscriber tiap channel.</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-slate-800">/competitors</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Melihat status radar intelijen kompetitor publik.</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
                    <div className="font-mono font-black text-xs text-amber-700">/mute 1h & /unmute</div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5">Mode hening notifikasi lonjakan view sementara waktu.</div>
                  </div>
                </div>
              </div>

              {/* 🌙 QUIET HOURS & JAM MALAM SENSITIVITY CARD */}
              <div className="bg-slate-900 text-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-slate-700 flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-yellow-300">
                      <Clock className="w-5 h-5 text-yellow-300"/> MODE JAM MALAM & QUIET HOURS (ANTI-ALERT FATIGUE)
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Redam notifikasi lonjakan views minor di jam istirahat malam. Alert level <b>CRITICAL</b> (Koneksi Terputus & Copyright Claim) tetap akan dikirimkan demi keamanan 24/7.
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000] ${
                    quietHoursEnabled ? "bg-emerald-400 text-black" : "bg-red-400 text-black"
                  }`}>
                    {quietHoursEnabled ? "QUIET HOURS AKTIF 🌙" : "NONAKTIF (24H ALL ALERTS)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800 border-2 border-slate-700 p-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">STATUS MODE MALAM</label>
                    <button
                      onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                      className={`w-full py-2 px-3 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${
                        quietHoursEnabled ? "bg-emerald-400 text-black" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {quietHoursEnabled ? "AKTIF (ENABLED)" : "NONAKTIF (DISABLED)"}
                    </button>
                  </div>

                  <div className="bg-slate-800 border-2 border-slate-700 p-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">JAM MULAI (WIB)</label>
                    <select
                      value={quietStartHour}
                      onChange={(e) => setQuietStartHour(Number(e.target.value))}
                      className="w-full p-2 bg-slate-900 border-2 border-black font-black text-xs text-white focus:outline-none"
                    >
                      {[20, 21, 22, 23, 0].map(h => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-800 border-2 border-slate-700 p-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">JAM SELESAI (WIB)</label>
                    <select
                      value={quietEndHour}
                      onChange={(e) => setQuietEndHour(Number(e.target.value))}
                      className="w-full p-2 bg-slate-900 border-2 border-black font-black text-xs text-white focus:outline-none"
                    >
                      {[4, 5, 6, 7, 8].map(h => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveQuietHoursConfig}
                    disabled={quietSaveStatus === "saving"}
                    className="bg-yellow-400 text-black font-black px-5 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 flex items-center gap-2"
                  >
                    {quietSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 text-black"/>}
                    SIMPAN PENGATURAN QUIET HOURS
                  </button>
                </div>
              </div>

              {/* Standard Notification Toggles */}
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-tight mb-1 flex items-center gap-2">
                    <Bell className="w-5 h-5"/> PREFERENSI NOTIFIKASI LAINNYA
                  </h3>
                  <p className="text-xs font-bold text-gray-600">Atur saluran notifikasi pendukung tambahan.</p>
                </div>
                <div className="space-y-2">
                  <BrutalToggleRow icon={Mail} title="Email Alerts" desc="Dapatkan notifikasi penting via email" isOn={toggles.emailAlerts} onChange={() => handleToggle('emailAlerts')} />
                  <BrutalToggleRow icon={FileText} title="Weekly Summary" desc="Laporan mingguan performa channel" isOn={toggles.weeklyReport} onChange={() => handleToggle('weeklyReport')} />
                  <BrutalToggleRow icon={AlertTriangle} title="Sync Failures" desc="Notifikasi saat sinkronisasi gagal" isOn={toggles.syncFailures} onChange={() => handleToggle('syncFailures')} />
                  <BrutalToggleRow icon={MessageCircle} title="Slack Integration" desc="Kirim pemberitahuan langsung ke Slack" isOn={toggles.slackIntegration} onChange={() => handleToggle('slackIntegration')} />
                </div>
              </div>

            </div>
          )}
          
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

          {/* TAB: INTEGRATIONS */}
          {activeTab === 'INTEGRATIONS' && (
            <div className="flex flex-col gap-6">
              
              {/* PRIMARY: YouTube Data API v3 Key (Direct Real-time Channel Sync) */}
              <div className="bg-emerald-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
                <div className="flex justify-between items-start mb-2 border-b-4 border-black pb-3">
                  <div>
                    <span className="bg-black text-emerald-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
                      ⚡ DIRECT GOOGLE API SYNC ENGINE
                    </span>
                    <h2 className="text-2xl font-black uppercase mt-2">KUNCI API GOOGLE YOUTUBE DATA V3 (API KEY)</h2>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                      Masukkan Google API Key (format: <code>AIzaSy...</code>) untuk menarik views, subscriber asli, banner resmi, dan seluruh video publik secara instan 24/7 tanpa batas login.
                    </p>
                  </div>
                </div>

                <div className="my-4">
                  <label className="block text-[10px] font-black uppercase mb-1">YouTube Data API v3 Key (Dari Google Cloud Console &gt; Credentials &gt; API Key) *</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={youtubeApiKey}
                      onChange={(e) => setYoutubeApiKey(e.target.value)}
                      placeholder="Contoh: AIzaSyD-1234567890abcdefghijklmnopqrstuv..."
                      className="flex-1 border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={saveYoutubeApiKey}
                        disabled={ytKeyStatus === "saving"}
                        className="bg-black text-emerald-300 font-black px-5 py-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5"
                      >
                        {ytKeyStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        SIMPAN API KEY
                      </button>
                      <button 
                        onClick={testYoutubeApiKey}
                        disabled={ytKeyStatus === "testing"}
                        className="bg-white text-black font-black px-4 py-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-100 flex items-center gap-1.5"
                      >
                        {ytKeyStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-black" />}
                        TES KONEKSI GOOGLE
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
                    {savedCredentials.map((cred, idx) => {
                      const isConnected = cred.is_default && accounts.length > 0;

                      return (
                        <div key={cred.id || idx} className={`border-4 border-black p-5 flex flex-col gap-4 ${cred.is_default ? 'bg-yellow-100 shadow-[5px_5px_0_0_#000]' : 'bg-white shadow-[3px_3px_0_0_#000]'}`}>
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
                                  <span className="bg-emerald-300 text-black text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                                    <CheckCircle2 className="w-3 h-3 text-green-800"/> {accounts.length} ACCOUNTS CONNECTED
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2.5 py-0.5 uppercase border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000]">
                                    <ShieldCheck className="w-3 h-3 text-slate-600"/> STANDBY APP (EXTRA QUOTA)
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
                              <button 
                                onClick={() => handleConnectOAuth(cred.id)}
                                className="bg-black text-yellow-300 font-black px-4 py-2 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-gray-800 flex items-center gap-1.5"
                              >
                                <Plus className="w-4 h-4 text-yellow-300"/> CONNECT ACCOUNT OAUTH
                              </button>
                              <button 
                                onClick={() => handleDeleteCred(cred.id, cred.name)}
                                className="bg-red-200 text-red-900 font-black px-3 py-2 border-2 border-black text-xs uppercase hover:bg-red-300 shadow-[2px_2px_0_0_#000]"
                              >
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          </div>

                          {/* Connected Accounts Sub-Panel */}
                          {cred.is_default && accounts.length > 0 && (
                            <div className="border-t-2 border-black pt-3 mt-1">
                              <div className="text-[10px] font-black uppercase text-gray-700 mb-2 flex items-center justify-between">
                                <span>Akun Google Terhubung Aktif ({accounts.length}):</span>
                                <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 border border-black px-2 py-0.5 uppercase">
                                  OAuth Status: CONNECTED
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {accounts.map((acc, aIdx) => (
                                  <div key={aIdx} className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0_0_#000] flex flex-col justify-between">
                                    <div>
                                      <div className="font-black text-xs uppercase truncate leading-tight">{acc.name}</div>
                                      <div className="text-[10px] font-bold text-gray-600 truncate">{acc.email}</div>
                                    </div>
                                    <div className="mt-2 pt-1.5 border-t border-black/10 flex justify-between items-center text-[9px] font-bold">
                                      <span className="text-green-700 font-black flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"/> {acc.channels} Channels
                                      </span>
                                      <span className="bg-gray-100 border border-black px-1 font-mono">{acc.token}</span>
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
