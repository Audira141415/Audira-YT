"use client"

import { 
  Calendar, UploadCloud, Clock, Flame, CheckCircle2, PlaySquare, AlertCircle, 
  Trash2, Plus, RefreshCw, FileText, Video, Tag, Eye, Globe, Lock
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl } from "@/lib/api"

export default function ContentSchedulerPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");

  // Form State
  const [formChannelId, setFormChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [isShort, setIsShort] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedulerData = async (chFilter = selectedChannel, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const queryParam = chFilter !== "ALL" ? `?channel_id=${encodeURIComponent(chFilter)}` : "";

      const [postsRes, accRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/scheduler/posts${queryParam}`),
        fetch(`${getApiBaseUrl()}/accounts`)
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }

      if (accRes.ok) {
        const rawAcc = await accRes.json();
        const accs = Array.isArray(rawAcc) ? rawAcc : (rawAcc.items || []);
        const chs: any[] = [];
        accs.forEach((a: any) => {
          if (a.channel_items) chs.push(...a.channel_items);
        });
        setChannels(chs);
        if (chs.length > 0 && !formChannelId) {
          setFormChannelId(chs[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch scheduler data", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData(selectedChannel, true);
    const interval = setInterval(() => {
      fetchSchedulerData(selectedChannel, false);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledAt) {
      alert("Harap isi Judul Video dan Waktu Jadwal Upload!");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("channel_id", formChannelId || (channels[0]?.name || "ALL"));
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tags", tags);
      formData.append("privacy_status", privacyStatus);
      formData.append("is_short", isShort ? "true" : "false");
      formData.append("scheduled_at", scheduledAt);

      const res = await fetch(`${getApiBaseUrl()}/scheduler/schedule`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        alert("🎉 Video berhasil dijadwalkan untuk publikasi otomatis!");
        setTitle("");
        setDescription("");
        setTags("");
        setScheduledAt("");
        fetchSchedulerData(selectedChannel, false);
      } else {
        alert("Gagal menjadwalkan video.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saat membuat jadwal video.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan jadwal video ini?")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/scheduler/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSchedulerData(selectedChannel, false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5"/> CONTENT SCHEDULER & AUTO-PUBLISHER
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            JADWALKAN & PUBLIKASI VIDEO OTOMATIS
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Unggah draft konten dan atur jadwal tayang otomatis ke YouTube Channel Anda pada Jam Upload Emas (*Golden Hours*).
          </p>
        </div>

        <div className="bg-black text-yellow-300 border-2 border-black px-4 py-3 font-black text-xs uppercase shadow-[3px_3px_0_0_#000] shrink-0">
          👑 JAM EMAS: <span className="bg-yellow-300 text-black px-2 py-1 font-mono font-bold text-xs ml-1">19:00 - 22:00 WIB</span>
        </div>
      </div>

      {/* Grid Layout: Create Schedule Form (Left) & Scheduled Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT FORM: CREATE SCHEDULE */}
        <div className="lg:col-span-5 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <h2 className="font-black text-base uppercase flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
            <Plus className="w-5 h-5 text-black"/> BUAT JADWAL UNGGAH KONTEN BARU
          </h2>

          <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
            
            {/* Target Channel */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">TARGET CHANNEL YOUTUBE</label>
              <select 
                value={formChannelId} 
                onChange={(e) => setFormChannelId(e.target.value)}
                className="w-full bg-yellow-100 border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                {channels.map((ch) => (
                  <option key={ch.id || ch.name} value={ch.name}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Title */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">JUDUL VIDEO / SHORTS</label>
              <input 
                type="text" 
                placeholder="Contoh: Audira Pop Hits Terbaru 2026 🎵" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">DESKRIPSI KONTEN</label>
              <textarea 
                rows={3}
                placeholder="Tuliskan deskripsi video dan kata kunci SEO..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              />
            </div>

            {/* Tags & Shorts Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">TAGS (PISAH DENGAN KOMA)</label>
                <input 
                  type="text" 
                  placeholder="music, pop, viral" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">FORMAT KONTEN</label>
                <button 
                  type="button"
                  onClick={() => setIsShort(!isShort)}
                  className={`w-full py-2.5 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all ${isShort ? 'bg-pink-300 text-black' : 'bg-gray-100 text-black'}`}
                >
                  {isShort ? "⚡ YOUTUBE SHORTS" : "📹 VIDEO REGULER"}
                </button>
              </div>
            </div>

            {/* Scheduled Time & Privacy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">WAKTU PUBLIKASI</label>
                <input 
                  type="datetime-local" 
                  value={scheduledAt} 
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">PRIVASI YOUTUBE</label>
                <select 
                  value={privacyStatus} 
                  onChange={(e) => setPrivacyStatus(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                >
                  <option value="public">🌐 PUBLIC (UMUM)</option>
                  <option value="unlisted">🔗 UNLISTED (TERBATAS)</option>
                  <option value="private">🔒 PRIVATE (PRIBADI)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="bg-black text-yellow-300 font-black py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all mt-2"
            >
              <UploadCloud className="w-4 h-4 text-yellow-300"/> 
              {submitting ? "MENYIMPANKAN JADWAL..." : "SIMPAN & OTO-PUBLIKASI JADWAL"}
            </button>
          </form>
        </div>

        {/* RIGHT QUEUE LIST */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-black"/> ANTREAN KONTEN TERJADWAL ({posts.length})
            </h2>
            <button 
              onClick={() => fetchSchedulerData(selectedChannel, false)}
              className="bg-black text-yellow-300 font-black px-3 py-1.5 border border-black shadow-[1.5px_1.5px_0_0_#000] text-[10px] uppercase flex items-center gap-1 hover:bg-gray-800"
            >
              <RefreshCw className="w-3 h-3 text-yellow-300"/> REFRESH QUEUE
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="bg-yellow-100 border-2 border-black p-8 text-center shadow-[3px_3px_0_0_#000]">
              <Calendar className="w-10 h-10 text-black mx-auto mb-2 opacity-50" />
              <div className="font-black text-sm uppercase">BELUM ADA ANTREAN JADWAL VIDEO</div>
              <p className="text-xs font-bold text-gray-700 mt-1">Gunakan formulir di sebelah kiri untuk menjadwalkan publikasi otomatis pertama Anda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
              {posts.map((p) => (
                <div key={p.id} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-yellow-50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-black text-yellow-300 font-mono font-bold text-[10px] px-2 py-0.5 border border-black">
                        {p.channelName}
                      </span>
                      {p.isShort && (
                        <span className="bg-pink-300 text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                          SHORTS
                        </span>
                      )}
                      <span className={`font-black text-[9px] uppercase px-2 py-0.5 border border-black ${p.status === 'PUBLISHED' ? 'bg-emerald-300 text-black' : p.status === 'PENDING' ? 'bg-yellow-300 text-black' : 'bg-red-300 text-black'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="font-black text-sm text-black leading-snug">{p.title}</div>
                    <div className="text-[10px] font-bold text-gray-600 flex items-center gap-2 mt-1">
                      <span>🕒 Jadwal: <strong>{p.scheduledAt}</strong></span>
                      <span>• Privasi: <strong>{p.privacyStatus?.toUpperCase()}</strong></span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeletePost(p.id)}
                    className="bg-red-500 text-white font-black p-2 border border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-red-600 shrink-0"
                    title="Batalkan Jadwal"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
