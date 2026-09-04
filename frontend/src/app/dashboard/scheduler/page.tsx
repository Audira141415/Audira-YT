"use client"

import { 
  Calendar, UploadCloud, Clock, Flame, CheckCircle2, PlaySquare, AlertCircle, 
  Trash2, Plus, RefreshCw, FileText, Video, Tag, Eye, Globe, Lock, Sparkles,
  Zap, Folder, HardDrive, Play, ExternalLink, Loader2, Crown, Check
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl, fetchWithAuth } from "@/lib/api"

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

  // Storage Pipeline State
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const [uploadedDraftPath, setUploadedDraftPath] = useState<string>("");

  // Golden Hour Calculation State
  const [goldenSlotBadge, setGoldenSlotBadge] = useState<string | null>(null);
  const [calculatingGolden, setCalculatingGolden] = useState(false);

  // Publishing Action State
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchSchedulerData = async (chFilter = selectedChannel, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const queryParam = chFilter !== "ALL" ? `?channel_id=${encodeURIComponent(chFilter)}` : "";

      const [postsRes, accRes] = await Promise.all([
        fetchWithAuth(`${getApiBaseUrl()}/scheduler/posts${queryParam}`),
        fetchWithAuth(`${getApiBaseUrl()}/accounts`)
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

  const fetchStoragePipeline = async (channelName: string) => {
    if (!channelName || channelName === "ALL") {
      setStorageInfo(null);
      return;
    }
    try {
      setLoadingStorage(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/storage/${encodeURIComponent(channelName)}`);
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch (e) {
      console.warn("Storage pipeline info waiting for active channel selection", e);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData(selectedChannel, true);
    const interval = setInterval(() => {
      fetchSchedulerData(selectedChannel, false);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  useEffect(() => {
    if (formChannelId) {
      fetchStoragePipeline(formChannelId);
    }
  }, [formChannelId]);

  // 👑 AUTO-CALCULATE NEXT GOLDEN HOURS SLOT (19:00 - 22:00 WIB)
  const handleAutoGoldenHour = async () => {
    try {
      setCalculatingGolden(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/auto-golden-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: formChannelId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.goldenSlot) {
          setScheduledAt(data.goldenSlot.iso_wib);
          setGoldenSlotBadge(data.goldenSlot.hour_slot);
        }
      }
    } catch (err) {
      console.error("Failed to calculate golden slot", err);
    } finally {
      setCalculatingGolden(false);
    }
  };

  // 📁 UPLOAD DRAFT FILE DIRECTLY INTO ISOLATED STORAGE PIPE
  const handleDraftFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDraft(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("channel_id", formChannelId);
      formData.append("is_short", isShort ? "true" : "false");

      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/upload-draft`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedDraftPath(data.savedPath);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        }
        await fetchStoragePipeline(formChannelId);
        alert(`📁 Berkas '${file.name}' berhasil disimpan ke pipa storage ${data.targetFolder}!`);
      } else {
        alert("Gagal mengunggah draft berkas.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saat mengunggah berkas draft.");
    } finally {
      setUploadingDraft(false);
    }
  };

  // ⚡ PUBLISH POST NOW (INSTANT OVERRIDE)
  const handlePublishNow = async (postId: string, postTitle: string) => {
    if (!confirm(`Terbitkan video '${postTitle}' ke YouTube sekarang juga?`)) return;
    try {
      setPublishingId(postId);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/posts/${postId}/publish-now`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        alert(`🎉 BERHASIL DITERBITKAN!\nVideo ID: ${data.youtube_video_id}\nDurasi: ${data.duration_ms}ms`);
        await fetchSchedulerData(selectedChannel, false);
      } else {
        alert(`Gagal menerbitkan: ${data.detail || data.message || 'Error publikasi YouTube'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error menghubungkan ke YouTube Uploader API.");
    } finally {
      setPublishingId(null);
    }
  };

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
      if (uploadedDraftPath) {
        formData.append("file_path", uploadedDraftPath);
      }

      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/schedule`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        alert("🎉 Video berhasil dijadwalkan untuk publikasi otomatis!");
        setTitle("");
        setDescription("");
        setTags("");
        setScheduledAt("");
        setGoldenSlotBadge(null);
        setUploadedDraftPath("");
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
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/posts/${id}`, { method: "DELETE" });
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
              <Calendar className="w-3.5 h-3.5"/> ISOLATED STORAGE & AUTO-UPLOADER ENGINE
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            PIPA STORAGE & AUTO-PUBLISHER YOUTUBE
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Penyimpanan berkas mandiri per akun dengan kecerdasan jadwal tayang otomatis pada Jam Upload Emas (*Golden Hours: 19:00 - 22:00 WIB*).
          </p>
        </div>

        <div className="bg-black text-yellow-300 border-2 border-black px-4 py-3 font-black text-xs uppercase shadow-[3px_3px_0_0_#000] shrink-0 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-300 animate-bounce"/>
          <span>JAM EMAS WIB:</span>
          <span className="bg-yellow-300 text-black px-2 py-1 font-mono font-bold text-xs ml-1">19:00 - 22:00 WIB</span>
        </div>
      </div>

      {/* 📁 ISOLATED STORAGE PIPELINE EXPLORER CARD */}
      <div className="bg-cyan-200 border-4 border-black p-5 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 pb-3 border-b-4 border-black">
          <div>
            <h2 className="font-black text-base uppercase flex items-center gap-2 text-black">
              <Folder className="w-5 h-5 text-black"/> PIPA STORAGE TERISOLASI PER AKUN
            </h2>
            <p className="text-xs font-bold text-gray-800">
              Folder penyimpanan berkas terpisah untuk Channel: <strong>{formChannelId || "Semua Channel"}</strong>
            </p>
          </div>
          <div className="bg-black text-yellow-300 font-mono text-[10px] font-bold px-3 py-1 border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-yellow-300"/>
            <span>storage/accounts/{storageInfo?.account_id ? storageInfo.account_id.substring(0, 8) : 'account'}/...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
            <div className="text-[10px] font-black uppercase text-gray-500">FOLDER LONG-FORM VIDEO</div>
            <div className="text-xs font-bold font-mono truncate text-black mt-0.5">
              📁 {storageInfo?.directories?.uploads ? storageInfo.directories.uploads.split('storage')[1] || '/uploads' : '/uploads'}
            </div>
          </div>
          <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
            <div className="text-[10px] font-black uppercase text-gray-500">FOLDER YOUTUBE SHORTS</div>
            <div className="text-xs font-bold font-mono truncate text-black mt-0.5">
              ⚡ {storageInfo?.directories?.shorts ? storageInfo.directories.shorts.split('storage')[1] || '/shorts' : '/shorts'}
            </div>
          </div>
          <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0_0_#000] flex justify-between items-center">
            <div>
              <div className="text-[10px] font-black uppercase text-gray-500">TOTAL BERKAS DRAFT</div>
              <div className="text-sm font-black text-black">{storageInfo?.files_count || 0} Video Siap Unggah</div>
            </div>
            <button 
              onClick={() => fetchStoragePipeline(formChannelId)}
              className="bg-yellow-300 border border-black p-1.5 hover:bg-yellow-400"
              title="Refresh Storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStorage ? 'animate-spin' : ''}`}/>
            </button>
          </div>
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

            {/* Draft File Uploader into Isolated Pipe */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1 flex items-center justify-between">
                <span>UNGGAH BERKAS VIDEO (OPSIONAL)</span>
                <span className="text-[10px] text-gray-500 font-bold">Auto-save ke Pipa Storage</span>
              </label>
              <div className="border-2 border-dashed border-black p-3 bg-amber-50 text-center relative">
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={handleDraftFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={uploadingDraft}
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  {uploadingDraft ? (
                    <div className="flex items-center gap-2 text-xs font-black">
                      <Loader2 className="w-4 h-4 animate-spin"/> MENGUNGGAH KE PIPA STORAGE...
                    </div>
                  ) : uploadedDraftPath ? (
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <Check className="w-4 h-4 text-emerald-600"/> Berkas Tersimpan di Pipa: {uploadedDraftPath.split('\\').pop() || uploadedDraftPath.split('/').pop()}
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 text-gray-700"/>
                      <span className="text-xs font-black uppercase">PILIH VIDEO / SERET KE SINI</span>
                      <span className="text-[9px] font-bold text-gray-500">MP4, MOV, MKV (Disimpan otomatis ke folder akun)</span>
                    </>
                  )}
                </div>
              </div>
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

            {/* Scheduled Time & Golden Hours Auto-Fill */}
            <div className="border-2 border-black p-3 bg-yellow-50 shadow-[2px_2px_0_0_#000]">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black uppercase text-black">WAKTU PUBLIKASI</label>
                
                {/* 👑 1-Click Golden Slot Button */}
                <button 
                  type="button"
                  onClick={handleAutoGoldenHour}
                  disabled={calculatingGolden}
                  className="bg-yellow-300 hover:bg-yellow-400 text-black font-black text-[10px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] flex items-center gap-1"
                  title="Pilih otomatis slot terbaik pada Jam Emas (19:00 - 22:00 WIB)"
                >
                  <Crown className="w-3 h-3 text-black"/>
                  {calculatingGolden ? "MENGHITUNG..." : "👑 1-KLIK JAM EMAS (19-22 WIB)"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="datetime-local" 
                  value={scheduledAt} 
                  onChange={(e) => {
                    setScheduledAt(e.target.value);
                    setGoldenSlotBadge(null);
                  }}
                  className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  required
                />

                <select 
                  value={privacyStatus} 
                  onChange={(e) => setPrivacyStatus(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                >
                  <option value="public">🌐 PUBLIC (UMUM)</option>
                  <option value="unlisted">🔗 UNLISTED (TERBATAS)</option>
                  <option value="private">🔒 PRIVATE (PRIBADI)</option>
                </select>
              </div>

              {goldenSlotBadge && (
                <div className="mt-2 bg-black text-yellow-300 text-[10px] font-black uppercase px-2 py-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-300"/>
                  Slot Jam Emas Terpilih: <strong>{goldenSlotBadge}</strong> (Optimal untuk audiens YouTube Indonesia)
                </div>
              )}
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
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-black text-yellow-300 font-mono font-bold text-[10px] px-2 py-0.5 border border-black">
                        {p.channelName}
                      </span>
                      {p.isShort && (
                        <span className="bg-pink-300 text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                          SHORTS
                        </span>
                      )}
                      <span className={`font-black text-[9px] uppercase px-2 py-0.5 border border-black 
                        ${p.status === 'PUBLISHED' ? 'bg-emerald-300 text-black' : p.status === 'UPLOADING' ? 'bg-cyan-300 text-black animate-pulse' : p.status === 'PENDING' ? 'bg-yellow-300 text-black' : 'bg-red-300 text-black'}`}>
                        {p.status}
                      </span>
                      {p.youtubeVideoId && (
                        <a 
                          href={`https://youtube.com/watch?v=${p.youtubeVideoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-red-600 text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black flex items-center gap-1 hover:bg-red-700"
                        >
                          <Play className="w-2.5 h-2.5 fill-current"/> LIHAT DI YOUTUBE <ExternalLink className="w-2.5 h-2.5"/>
                        </a>
                      )}
                    </div>
                    <div className="font-black text-sm text-black leading-snug truncate">{p.title}</div>
                    <div className="text-[10px] font-bold text-gray-600 flex items-center gap-2 mt-1">
                      <span>🕒 Jadwal: <strong>{p.scheduledAt || 'Segera'}</strong></span>
                      <span>• Privasi: <strong>{p.privacyStatus?.toUpperCase()}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* ⚡ Instant Publish Now Button */}
                    {p.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublishNow(p.id, p.title)}
                        disabled={publishingId === p.id}
                        className="bg-emerald-400 hover:bg-emerald-500 text-black font-black px-2.5 py-1.5 border-2 border-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] flex items-center gap-1 disabled:opacity-50"
                        title="Terbitkan ke YouTube sekarang juga"
                      >
                        <Zap className={`w-3 h-3 ${publishingId === p.id ? 'animate-bounce' : ''}`}/>
                        {publishingId === p.id ? 'UPLOADING...' : 'PUBLISH NOW'}
                      </button>
                    )}

                    <button 
                      onClick={() => handleDeletePost(p.id)}
                      className="bg-red-500 text-white font-black p-2 border border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-red-600"
                      title="Batalkan Jadwal"
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
    </div>
  );
}
