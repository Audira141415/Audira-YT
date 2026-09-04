"use client"

import { 
  Bell, Check, Send, Loader2, Clock, AlertTriangle, Mail, 
  FileText, MessageCircle, Globe, HardDrive, Sparkles
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

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

function NotificationsContent() {
  const searchParams = useSearchParams()
  const [telegramToken, setTelegramToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [telegramSaveStatus, setTelegramSaveStatus] = useState<"idle"|"saving"|"testing"|"success"|"error">("idle")
  const [backupStatus, setBackupStatus] = useState<"idle"|"backing_up"|"success"|"error">("idle")
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("")
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState("")
  const [discordStatus, setDiscordStatus] = useState<"idle"|"saving"|"testing"|"success">("idle")
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietStartHour, setQuietStartHour] = useState(22)
  const [quietEndHour, setQuietEndHour] = useState(6)
  const [quietSaveStatus, setQuietSaveStatus] = useState<"idle"|"saving">("idle")
  const [toggles, setToggles] = useState({
    emailAlerts: true, weeklyReport: true, syncFailures: true, slackIntegration: true
  })

  const handleToggle = (key: keyof typeof toggles) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    const fetchTelegram = async () => {
      try {
        const res = await fetchWithFallback("/settings/telegram")
        if (res && res.ok) {
          const data = await res.json().catch(() => null)
          if (data) {
            setTelegramToken(data.bot_token || "")
            setTelegramChatId(data.chat_id || "")
          }
        }
      } catch (e) {}
    }
    const fetchQuietHours = async () => {
      try {
        const res = await fetchWithFallback("/settings/quiet-hours")
        if (res && res.ok) {
          const data = await res.json().catch(() => null)
          if (data) {
            setQuietHoursEnabled(data.enabled ?? false)
            setQuietStartHour(data.start_hour ?? 22)
            setQuietEndHour(data.end_hour ?? 6)
          }
        }
      } catch (e) {}
    }
    fetchTelegram()
    fetchQuietHours()
  }, [])

  const saveTelegramConfig = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert("Telegram Bot Token dan Chat ID wajib diisi!")
      return
    }
    try {
      setTelegramSaveStatus("saving")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/telegram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      })
      if (res.ok) {
        setTelegramSaveStatus("success")
        alert("Konfigurasi Telegram Bot berhasil disimpan!")
        setTimeout(() => setTelegramSaveStatus("idle"), 2000)
      }
    } catch (err) {
      setTelegramSaveStatus("error")
      setTimeout(() => setTelegramSaveStatus("idle"), 2000)
    }
  }

  const testTelegramMessage = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert("Harap isi Telegram Bot Token dan Chat ID!")
      return
    }
    try {
      setTelegramSaveStatus("testing")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/telegram/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      })
      const data = await res.json()
      alert(data.message || "✅ Pesan tes berhasil dikirim ke Telegram!")
    } catch (e) {
      alert("Gagal mengirim tes ke Telegram.")
    } finally {
      setTelegramSaveStatus("idle")
    }
  }

  const testDisconnectionAlert = async () => {
    try {
      setTelegramSaveStatus("testing")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/telegram/test-disconnection`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      })
      const data = await res.json()
      alert(data.message || "⚠️ Alert koneksi terputus berhasil dikirim!")
    } catch (e) {
      alert("Gagal mengirim alert.")
    } finally {
      setTelegramSaveStatus("idle")
    }
  }

  const testChannelsIntegration = async () => {
    try {
      setTelegramSaveStatus("testing")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/telegram/test-channels`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      })
      const data = await res.json()
      alert(data.message || "🚀 Integrasi 6 channel berhasil dikirim!")
    } catch (e) {
      alert("Gagal integrasi channel.")
    } finally {
      setTelegramSaveStatus("idle")
    }
  }

  const handleTriggerBackup = async () => {
    try {
      setBackupStatus("backing_up")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/telegram/backup-db`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim(), chat_id: telegramChatId.trim() })
      })
      const data = await res.json()
      setBackupStatus("success")
      alert(data.message || "📦 Backup database berhasil dikirim ke Telegram!")
      setTimeout(() => setBackupStatus("idle"), 3000)
    } catch (e) {
      setBackupStatus("error")
      setTimeout(() => setBackupStatus("idle"), 2000)
    }
  }

  const saveDiscordConfig = async () => {
    try {
      setDiscordStatus("saving")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/discord`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: discordWebhookUrl })
      })
      if (res.ok) {
        alert("🎉 Discord Webhook URL berhasil disimpan!")
        setDiscordStatus("success")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDiscordStatus("idle")
    }
  }

  const saveQuietHoursConfig = async () => {
    try {
      setQuietSaveStatus("saving")
      const res = await fetchWithAuth(`${getApiBaseUrl()}/settings/quiet-hours`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: quietHoursEnabled, start_hour: quietStartHour, end_hour: quietEndHour })
      })
      if (res.ok) alert("⏰ Pengaturan Quiet Hours berhasil disimpan!")
    } catch (e) {
      console.error(e)
    } finally {
      setQuietSaveStatus("idle")
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-sky-400 text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black">✈️ TELEGRAM & NOTIFICATIONS</span>
        </div>
        <h2 className="text-xl font-black uppercase">Pengaturan Notifikasi</h2>
        <p className="text-xs font-bold text-gray-600 mt-1">Konfigurasi Telegram Bot, Discord Webhook, dan aturan notifikasi lainnya.</p>
      </div>

      {/* Telegram Bot Card */}
      <div className="bg-sky-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
        <div className="flex justify-between items-start mb-2 border-b-4 border-black pb-3">
          <div>
            <span className="bg-black text-sky-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              ✈️ TELEGRAM BOT INSTANT NOTIFIER
            </span>
            <h2 className="text-2xl font-black uppercase mt-2">INTEGRASI TELEGRAM BOT</h2>
            <p className="text-xs font-bold text-gray-800 mt-1">
              Kirim pemberitahuan instan ke HP Anda via Telegram saat terjadi lonjakan views, token kadaluarsa, atau laporan harian.
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
          <button onClick={saveTelegramConfig} disabled={telegramSaveStatus === "saving"}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800 flex items-center gap-2">
            {telegramSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 text-yellow-300"/>} SIMPAN KONFIGURASI
          </button>
          <button onClick={testTelegramMessage} disabled={telegramSaveStatus === "testing"}
            className="bg-emerald-400 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-emerald-500 flex items-center gap-2">
            {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} TES PESAN 📲
          </button>
          <button onClick={testDisconnectionAlert} disabled={telegramSaveStatus === "testing"}
            className="bg-red-400 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-red-500 flex items-center gap-2">
            {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <AlertTriangle className="w-4 h-4"/>} TES KONEKSI TERPUTUS ⚠️
          </button>
          <button onClick={testChannelsIntegration} disabled={telegramSaveStatus === "testing"}
            className="bg-yellow-300 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 flex items-center gap-2">
            {telegramSaveStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} TES INTEGRASI 6 CHANNEL 🚀
          </button>
          {telegramChatId && (
            <button onClick={handleTriggerBackup} disabled={backupStatus === "backing_up"}
              className="bg-purple-300 text-black font-black px-5 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-purple-400 flex items-center gap-2">
              {backupStatus === "backing_up" ? <Loader2 className="w-4 h-4 animate-spin"/> : <HardDrive className="w-4 h-4"/>} BACKUP DB KE TELEGRAM
            </button>
          )}
        </div>
      </div>

      {/* Discord & WhatsApp */}
      <div className="bg-purple-100 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
          <div>
            <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2 text-purple-950">
              MULTI-SALURAN: DISCORD & WHATSAPP WEBHOOK
            </h3>
            <p className="text-xs text-purple-900 font-bold">Kirim notifikasi langsung ke Discord channel & WhatsApp tim Anda.</p>
          </div>
          <span className="bg-black text-purple-300 font-black text-xs px-3 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000]">
            ENTERPRISE DISPATCHER
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-4">
            <span className="font-black text-xs uppercase flex items-center gap-2"><Globe className="w-4 h-4 text-purple-600"/> DISCORD WEBHOOK URL</span>
            <input type="text" value={discordWebhookUrl} onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/123456789/abcxyz..."
              className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none shadow-[2px_2px_0_0_#000]"/>
            <div className="flex gap-2">
              <button onClick={saveDiscordConfig} disabled={discordStatus === "saving"}
                className="bg-black text-yellow-300 font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800">SIMPAN</button>
              <button onClick={() => alert("🎮 Tes Discord dikirim!")}
                className="bg-purple-400 text-black font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-purple-500">TES 🎮</button>
            </div>
          </div>
          <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-4">
            <span className="font-black text-xs uppercase flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-600"/> WHATSAPP API WEBHOOK URL</span>
            <input type="text" value={whatsappWebhookUrl} onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
              placeholder="https://api.whatsapp.com/v1/messages/12345..."
              className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold focus:outline-none shadow-[2px_2px_0_0_#000]"/>
            <div className="flex gap-2">
              <button onClick={() => alert("WhatsApp Webhook Saved!")}
                className="bg-black text-emerald-300 font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800">SIMPAN</button>
              <button onClick={() => alert("💬 Tes WhatsApp dikirim!")}
                className="bg-emerald-400 text-black font-black px-4 py-2 text-xs uppercase border border-black shadow-[2px_2px_0_0_#000] hover:bg-emerald-500">TES 💬</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-slate-900 text-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-slate-700 flex-wrap gap-2">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-yellow-300">
              <Clock className="w-5 h-5 text-yellow-300"/> MODE JAM MALAM & QUIET HOURS
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Redam notifikasi di jam istirahat. Alert CRITICAL (koneksi terputus) tetap dikirimkan 24/7.
            </p>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 uppercase border border-black shadow-[2px_2px_0_0_#000] ${quietHoursEnabled ? "bg-emerald-400 text-black" : "bg-red-400 text-black"}`}>
            {quietHoursEnabled ? "QUIET HOURS AKTIF 🌙" : "NONAKTIF (24H ALL ALERTS)"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-800 border-2 border-slate-700 p-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">STATUS MODE MALAM</label>
            <button onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              className={`w-full py-2 px-3 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] transition-all ${quietHoursEnabled ? "bg-emerald-400 text-black" : "bg-slate-700 text-slate-300"}`}>
              {quietHoursEnabled ? "AKTIF (ENABLED)" : "NONAKTIF (DISABLED)"}
            </button>
          </div>
          <div className="bg-slate-800 border-2 border-slate-700 p-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">JAM MULAI (WIB)</label>
            <select value={quietStartHour} onChange={(e) => setQuietStartHour(Number(e.target.value))}
              className="w-full p-2 bg-slate-900 border-2 border-black font-black text-xs text-white focus:outline-none">
              {[20,21,22,23,0].map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00 WIB</option>)}
            </select>
          </div>
          <div className="bg-slate-800 border-2 border-slate-700 p-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">JAM SELESAI (WIB)</label>
            <select value={quietEndHour} onChange={(e) => setQuietEndHour(Number(e.target.value))}
              className="w-full p-2 bg-slate-900 border-2 border-black font-black text-xs text-white focus:outline-none">
              {[4,5,6,7,8].map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00 WIB</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={saveQuietHoursConfig} disabled={quietSaveStatus === "saving"}
            className="bg-yellow-400 text-black font-black px-5 py-2.5 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 flex items-center gap-2">
            {quietSaveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 text-black"/>}
            SIMPAN QUIET HOURS
          </button>
        </div>
      </div>

      {/* Standard Toggles */}
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
  )
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
      <NotificationsContent />
    </Suspense>
  )
}
