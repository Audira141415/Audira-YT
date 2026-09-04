"use client"

import { 
  Calendar, UploadCloud, Clock, Flame, CheckCircle2, PlaySquare, AlertCircle, 
  Trash2, Plus, RefreshCw, FileText, Video, Tag, Eye, Globe, Lock, Sparkles,
  Zap, Folder, HardDrive, Play, ExternalLink, Loader2, Crown, Check, SplitSquareVertical,
  BarChart3, Layers, Trophy, ArrowRightLeft, Sparkle, Copy, CheckCheck
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl, fetchWithAuth } from "@/lib/api"

export default function ContentSchedulerPage() {
  const [activeTab, setActiveTab] = useState<"SINGLE" | "AB_TEST" | "BATCH">("SINGLE");

  const [posts, setPosts] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");

  // Single Upload Form State
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

  // Golden Hour State
  const [goldenSlotBadge, setGoldenSlotBadge] = useState<string | null>(null);
  const [calculatingGolden, setCalculatingGolden] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // A/B Testing State
  const [abTests, setAbTests] = useState<any[]>([]);
  const [loadingAb, setLoadingAb] = useState(false);
  const [showAbModal, setShowAbModal] = useState(false);
  const [abFormTitle, setAbFormTitle] = useState("");
  const [abFormThumbA, setAbFormThumbA] = useState("");
  const [abFormThumbB, setAbFormThumbB] = useState("");
  const [abFormInterval, setAbFormInterval] = useState(24);
  const [submittingAb, setSubmittingAb] = useState(false);
  const [actioningAbId, setActioningAbId] = useState<string | null>(null);

  // AI SEO Generator Modal State
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [seoKeyword, setSeoKeyword] = useState("");
  const [seoGenre, setSeoGenre] = useState("DANGDUT");
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [seoResults, setSeoResults] = useState<{ suggestions: string[]; recommended_tags: string[] } | null>(null);
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);

  // Mass Batch Scheduler State
  const [batchChannelId, setBatchChannelId] = useState("");
  const [batchStaggerDays, setBatchStaggerDays] = useState(1);
  const [batchTargetHour, setBatchTargetHour] = useState(19);
  const [batchItems, setBatchItems] = useState<Array<{ title: string; tags: string; is_short: boolean }>>([
    { title: "Dangdut Horeg Glerr Vol 1", tags: "Dangdut, Koplo, Viral", is_short: false },
    { title: "Dangdut Horeg Glerr Vol 2", tags: "Dangdut, Koplo, Viral", is_short: false },
    { title: "Dangdut Horeg Glerr Vol 3 (Shorts Teaser)", tags: "Dangdut, Shorts, Trending", is_short: true },
  ]);
  const [submittingBatch, setSubmittingBatch] = useState(false);

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
        if (chs.length > 0) {
          if (!formChannelId) setFormChannelId(chs[0].name);
          if (!batchChannelId) setBatchChannelId(chs[0].id || chs[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch scheduler data", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const fetchAbTests = async () => {
    try {
      setLoadingAb(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/ab-tests`);
      if (res.ok) {
        const data = await res.json();
        setAbTests(Array.isArray(data) ? data : (data.tests || []));
      }
    } catch (err) {
      console.error("Failed to fetch A/B tests", err);
    } finally {
      setLoadingAb(false);
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
    fetchAbTests();
    const interval = setInterval(() => {
      fetchSchedulerData(selectedChannel, false);
    }, 20000);
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

  // 🎨 A/B Testing Handlers
  const handleCreateAbTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abFormTitle || !abFormThumbA || !abFormThumbB) {
      alert("Harap isi judul dan tautan URL Thumbnail A & B!");
      return;
    }
    try {
      setSubmittingAb(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/ab-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: formChannelId || (channels[0]?.id || "default"),
          video_title: abFormTitle,
          thumbnail_a_url: abFormThumbA,
          thumbnail_b_url: abFormThumbB,
          rotator_interval_hours: Number(abFormInterval) || 24
        })
      });
      if (res.ok) {
        alert("🎨 Eksperimen Thumbnail A/B berhasil dimulai!");
        setShowAbModal(false);
        setAbFormTitle("");
        setAbFormThumbA("");
        setAbFormThumbB("");
        fetchAbTests();
      } else {
        const data = await res.json();
        alert(`Gagal membuat A/B test: ${data.detail || data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saat membuat A/B test.");
    } finally {
      setSubmittingAb(false);
    }
  };

  const handleRotateAbTest = async (testId: string) => {
    try {
      setActioningAbId(testId);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/ab-tests/${testId}/rotate`, { method: "POST" });
      if (res.ok) {
        fetchAbTests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActioningAbId(null);
    }
  };

  const handleDeclareWinner = async (testId: string, winner: string) => {
    if (!confirm(`Tetapkan Varian ${winner} sebagai Thumbnail Pemenang Utama secara permanen?`)) return;
    try {
      setActioningAbId(testId);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/ab-tests/${testId}/declare-winner?winner_variant=${winner}`, { method: "POST" });
      if (res.ok) {
        fetchAbTests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActioningAbId(null);
    }
  };

  const handleDeleteAbTest = async (testId: string) => {
    if (!confirm("Hapus eksperimen A/B testing ini?")) return;
    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/ab-tests/${testId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAbTests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ✨ AI SEO Generator Handlers
  const handleGenerateSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoKeyword) {
      alert("Masukkan kata kunci lagu atau judul dasar!");
      return;
    }
    try {
      setGeneratingSeo(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/generate-seo-titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed_keyword: seoKeyword,
          genre: seoGenre
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSeoResults({
          suggestions: data.suggestions || [],
          recommended_tags: data.recommended_tags || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSeo(false);
    }
  };

  const applySeoTitle = (selectedTitle: string, index: number) => {
    setTitle(selectedTitle);
    if (seoResults?.recommended_tags) {
      setTags(seoResults.recommended_tags.join(", "));
    }
    setCopiedTitleIndex(index);
    setTimeout(() => {
      setShowSeoModal(false);
      setCopiedTitleIndex(null);
    }, 600);
  };

  // 📦 Mass Batch Scheduler Handlers
  const handleAddBatchRow = () => {
    setBatchItems([...batchItems, { title: `Koleksi Video Musik Vol ${batchItems.length + 1}`, tags: "Music, Dangdut, Viral", is_short: false }]);
  };

  const handleRemoveBatchRow = (idx: number) => {
    if (batchItems.length <= 1) return;
    setBatchItems(batchItems.filter((_, i) => i !== idx));
  };

  const handleUpdateBatchRow = (idx: number, field: string, value: any) => {
    const updated = [...batchItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setBatchItems(updated);
  };

  const handleExecuteBatchSchedule = async () => {
    if (batchItems.some(item => !item.title.trim())) {
      alert("Semua baris video harus memiliki judul!");
      return;
    }
    try {
      setSubmittingBatch(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/scheduler/bulk-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: batchChannelId || (channels[0]?.name || "default"),
          stagger_interval_days: Number(batchStaggerDays) || 1,
          target_hour_wib: Number(batchTargetHour) || 19,
          items: batchItems
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`🎉 BERHASIL MENJADWALKAN BATCH!\n${data.message}\nTotal: ${data.total_scheduled} video di antrean emas.`);
        setActiveTab("SINGLE");
        fetchSchedulerData(selectedChannel, false);
      } else {
        const data = await res.json();
        alert(`Gagal menjadwalkan batch: ${data.detail || data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saat mengirimkan batch schedule.");
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5"/> CONTENT DISTRIBUTION & AUTO-PUBLISHER
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            DISTRIBUSI KONTEN & SCHEDULER EMAS
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Penyimpanan terisolasi, Thumbnail A/B testing live rotator, Batch golden hours queue, dan Gemini AI SEO generator.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSeoModal(true)}
            className="bg-black text-yellow-300 hover:bg-zinc-800 border-2 border-black px-4 py-2.5 font-black text-xs uppercase shadow-[3px_3px_0_0_#000] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse"/>
            <span>AI SEO TITLE GENERATOR</span>
          </button>
          <div className="bg-emerald-300 text-black border-2 border-black px-3.5 py-2.5 font-black text-xs uppercase shadow-[3px_3px_0_0_#000] flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-black"/>
            <span>JAM EMAS: 19:00 WIB</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Switcher */}
      <div className="flex items-center gap-2 border-b-4 border-black pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("SINGLE")}
          className={`px-5 py-3 font-black text-xs md:text-sm uppercase border-3 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2 transition-all shrink-0 ${activeTab === "SINGLE" ? "bg-yellow-300 text-black translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-yellow-100"}`}
        >
          <Calendar className="w-4 h-4"/> 📅 JADWAL POSTINGAN (SINGLE UPLOAD)
        </button>
        <button
          onClick={() => setActiveTab("AB_TEST")}
          className={`px-5 py-3 font-black text-xs md:text-sm uppercase border-3 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2 transition-all shrink-0 ${activeTab === "AB_TEST" ? "bg-pink-300 text-black translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-pink-100"}`}
        >
          <SplitSquareVertical className="w-4 h-4"/> 🎨 THUMBNAIL A/B TESTING ({abTests.length})
        </button>
        <button
          onClick={() => setActiveTab("BATCH")}
          className={`px-5 py-3 font-black text-xs md:text-sm uppercase border-3 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2 transition-all shrink-0 ${activeTab === "BATCH" ? "bg-cyan-300 text-black translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-cyan-100"}`}
        >
          <Layers className="w-4 h-4"/> 📦 MASS BATCH SCHEDULER
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE UPLOAD SCHEDULER */}
      {/* ========================================================================= */}
      {activeTab === "SINGLE" && (
        <div className="flex flex-col gap-6">
          {/* ISOLATED STORAGE PIPELINE EXPLORER CARD */}
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

                {/* Video Title + SEO Button */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-black uppercase text-black">JUDUL VIDEO / SHORTS</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSeoKeyword(title || "Dangdut Horeg Terbaru");
                        setShowSeoModal(true);
                      }}
                      className="text-[10px] font-black uppercase text-black bg-yellow-300 px-2 py-0.5 border border-black hover:bg-yellow-400 flex items-center gap-1 shadow-[1px_1px_0_0_#000]"
                    >
                      <Sparkles className="w-3 h-3 text-black"/> AI Viral Title
                    </button>
                  </div>
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
                      <option value="public">🌐 PUBLIC (Langsung Tayang)</option>
                      <option value="unlisted">🔗 UNLISTED (Hanya Tautan)</option>
                      <option value="private">🔒 PRIVATE (Pribadi)</option>
                    </select>
                  </div>

                  {goldenSlotBadge && (
                    <div className="mt-2 bg-emerald-100 border border-emerald-600 text-emerald-900 px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600"/>
                      <span>Slot Emas Terpilih: <strong>{goldenSlotBadge}</strong> (Potensi CTR Tertinggi)</span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black hover:bg-zinc-800 text-yellow-300 font-black p-3.5 uppercase text-sm border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  <Clock className="w-4 h-4"/>
                  {submitting ? "MENJADWALKAN..." : "JADWALKAN VIDEO INI SEKARANG"}
                </button>
              </form>
            </div>

            {/* RIGHT QUEUE: SCHEDULED POSTS LIST */}
            <div className="lg:col-span-7 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b-4 border-black">
                <div>
                  <h2 className="font-black text-base uppercase flex items-center gap-2 text-black">
                    <Clock className="w-5 h-5 text-black"/> ANTREAN JADWAL TAYANG ({posts.length})
                  </h2>
                  <p className="text-xs font-bold text-gray-600">Video yang siap diunggah otomatis oleh background scheduler engine.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedChannel} 
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="bg-yellow-200 border-2 border-black px-2.5 py-1 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  >
                    <option value="ALL">SEMUA CHANNEL</option>
                    {channels.map((ch) => (
                      <option key={ch.id || ch.name} value={ch.name}>{ch.name}</option>
                    ))}
                  </select>

                  <button 
                    onClick={() => fetchSchedulerData(selectedChannel, false)}
                    className="bg-black text-yellow-300 border-2 border-black p-1.5 shadow-[2px_2px_0_0_#000] hover:bg-zinc-800"
                    title="Refresh Antrean"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
                  </button>
                </div>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: THUMBNAIL A/B TESTING */}
      {/* ========================================================================= */}
      {activeTab === "AB_TEST" && (
        <div className="flex flex-col gap-6">
          {/* A/B Testing Header Bar */}
          <div className="bg-pink-100 border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                <SplitSquareVertical className="w-6 h-6 text-pink-600"/> EKSPERIMEN ROTASI THUMBNAIL A/B TESTING
              </h2>
              <p className="text-xs font-bold text-gray-800 mt-1">
                Sistem merotasi otomatis Thumbnail A dan B setiap 24 Jam untuk mengukur Click-Through-Rate (CTR) riil dan memenangkan thumbnail dengan performa tontonan tertinggi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAbModal(true)}
                className="bg-black hover:bg-zinc-800 text-pink-300 font-black px-4 py-2.5 text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2"
              >
                <Plus className="w-4 h-4"/> BUAT A/B TEST BARU
              </button>
              <button
                onClick={fetchAbTests}
                className="bg-white border-2 border-black p-2.5 shadow-[3px_3px_0_0_#000] hover:bg-yellow-100"
                title="Refresh A/B Tests"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAb ? 'animate-spin' : ''}`}/>
              </button>
            </div>
          </div>

          {/* A/B Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {abTests.map((test) => {
              const ctrA = Number(test.ctr_a || 5.0);
              const ctrB = Number(test.ctr_b || 5.0);
              const isBWinning = ctrB > ctrA;
              const liftPercent = Math.abs(((ctrB - ctrA) / (ctrA || 1)) * 100).toFixed(1);

              return (
                <div key={test.id} className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col justify-between">
                  <div>
                    {/* Header: Title & Status */}
                    <div className="flex justify-between items-start gap-2 mb-3 pb-2 border-b-2 border-black">
                      <div>
                        <span className="bg-black text-yellow-300 font-mono text-[9px] font-bold px-2 py-0.5 border border-black uppercase">
                          {test.channel_name || "Audira Channel"}
                        </span>
                        <h3 className="font-black text-sm text-black mt-1 line-clamp-1">{test.title}</h3>
                      </div>
                      <span className={`font-black text-[10px] uppercase px-2 py-0.5 border-2 border-black ${test.status === 'COMPLETED' ? 'bg-emerald-300 text-black' : 'bg-yellow-300 text-black animate-pulse'}`}>
                        {test.status}
                      </span>
                    </div>

                    {/* Side-by-side Thumbnail Comparison */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Variant A */}
                      <div className={`p-2 border-2 border-black ${test.active_variant === 'A' ? 'bg-yellow-100 ring-2 ring-black' : 'bg-gray-50 opacity-80'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-[10px] uppercase bg-black text-white px-1.5 py-0.2">VARIAN A</span>
                          {test.active_variant === 'A' && (
                            <span className="bg-emerald-400 text-black font-black text-[8px] uppercase px-1 py-0.2 border border-black">
                              AKTIF TAYANG
                            </span>
                          )}
                        </div>
                        <img 
                          src={test.thumbnail_a_url} 
                          alt="Thumbnail A" 
                          className="w-full h-28 object-cover border border-black"
                          onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"; }}
                        />
                        <div className="mt-2 flex justify-between items-center text-[10px] font-bold">
                          <span>CTR: <strong className="text-sm font-black">{ctrA}%</strong></span>
                          <span>👁️ {test.views_a || 0}</span>
                        </div>
                      </div>

                      {/* Variant B */}
                      <div className={`p-2 border-2 border-black ${test.active_variant === 'B' ? 'bg-yellow-100 ring-2 ring-black' : 'bg-gray-50 opacity-80'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-[10px] uppercase bg-black text-white px-1.5 py-0.2">VARIAN B</span>
                          {test.active_variant === 'B' && (
                            <span className="bg-emerald-400 text-black font-black text-[8px] uppercase px-1 py-0.2 border border-black">
                              AKTIF TAYANG
                            </span>
                          )}
                        </div>
                        <img 
                          src={test.thumbnail_b_url} 
                          alt="Thumbnail B" 
                          className="w-full h-28 object-cover border border-black"
                          onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800"; }}
                        />
                        <div className="mt-2 flex justify-between items-center text-[10px] font-bold">
                          <span>CTR: <strong className="text-sm font-black">{ctrB}%</strong></span>
                          <span>👁️ {test.views_b || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lift Performance Alert */}
                    <div className="bg-pink-100 border-2 border-black p-2.5 mb-4 text-xs font-bold text-black flex items-center justify-between shadow-[2px_2px_0_0_#000]">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-yellow-600"/>
                        <span>Pemenang Sementara: <strong>Varian {isBWinning ? 'B' : 'A'}</strong></span>
                      </span>
                      <span className="bg-black text-yellow-300 font-mono font-black text-[10px] px-2 py-0.5 border border-black">
                        +{liftPercent}% CTR Lift
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t-2 border-black">
                    <button
                      onClick={() => handleRotateAbTest(test.id)}
                      disabled={actioningAbId === test.id}
                      className="bg-yellow-300 hover:bg-yellow-400 text-black font-black px-2.5 py-1.5 text-[10px] uppercase border-2 border-black shadow-[1.5px_1.5px_0_0_#000] flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3"/> Rotasi Varian Sekarang
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeclareWinner(test.id, isBWinning ? 'B' : 'A')}
                        disabled={actioningAbId === test.id}
                        className="bg-emerald-400 hover:bg-emerald-500 text-black font-black px-2.5 py-1.5 text-[10px] uppercase border-2 border-black shadow-[1.5px_1.5px_0_0_#000] flex items-center gap-1"
                      >
                        <Check className="w-3 h-3"/> Kunci Pemenang (Varian {isBWinning ? 'B' : 'A'})
                      </button>
                      <button
                        onClick={() => handleDeleteAbTest(test.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 border border-black shadow-[1.5px_1.5px_0_0_#000]"
                        title="Hapus Test"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MASS BATCH SCHEDULER */}
      {/* ========================================================================= */}
      {activeTab === "BATCH" && (
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-6">
          <div className="border-b-4 border-black pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-cyan-300 text-black font-black px-2 py-0.5 text-[10px] uppercase border border-black">
                AUTOMATED STAGGER ENGINE
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase text-black flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-600"/> MASS BATCH VIDEO SCHEDULER & STAGGER QUEUE
            </h2>
            <p className="text-xs font-bold text-gray-700 mt-1">
              Jadwalkan banyak video sekaligus secara bertahap. Sistem akan menyebarkan slot unggah setiap <strong>{batchStaggerDays} hari sekali</strong> tepat pada Jam Emas ({batchTargetHour}:00 WIB) agar channel tidak terkena spam penalty YouTube.
            </p>
          </div>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-yellow-50 border-2 border-black p-4 shadow-[3px_3px_0_0_#000]">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">TARGET CHANNEL</label>
              <select
                value={batchChannelId}
                onChange={(e) => setBatchChannelId(e.target.value)}
                className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                {channels.map((ch) => (
                  <option key={ch.id || ch.name} value={ch.name}>{ch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">INTERVAL JEDA (STAGGER)</label>
              <select
                value={batchStaggerDays}
                onChange={(e) => setBatchStaggerDays(Number(e.target.value))}
                className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                <option value={1}>Setiap 1 Hari Sekali (Rilis Harian)</option>
                <option value={2}>Setiap 2 Hari Sekali (Senin, Rabu, Jumat)</option>
                <option value={3}>Setiap 3 Hari Sekali (2x Seminggu)</option>
                <option value={7}>Setiap 7 Hari Sekali (Mingguan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">JAM EMAS PUBLIKASI (WIB)</label>
              <select
                value={batchTargetHour}
                onChange={(e) => setBatchTargetHour(Number(e.target.value))}
                className="w-full bg-white border-2 border-black p-2 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                <option value={19}>19:00 WIB (Golden Prime Time #1)</option>
                <option value={20}>20:00 WIB (Golden Prime Time #2)</option>
                <option value={21}>21:00 WIB (Golden Prime Time #3)</option>
                <option value={12}>12:00 WIB (Lunch Break Time)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Batch Video Rows */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm uppercase text-black">DAFTAR VIDEO BATCH ({batchItems.length} Video)</h3>
              <button
                type="button"
                onClick={handleAddBatchRow}
                className="bg-yellow-300 hover:bg-yellow-400 text-black font-black px-3 py-1 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5"/> Tambah Baris Video
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {batchItems.map((item, idx) => {
                const targetDay = new Date();
                targetDay.setDate(targetDay.getDate() + (idx + 1) * batchStaggerDays);
                const dateStr = targetDay.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <div key={idx} className="bg-white border-2 border-black p-3.5 shadow-[2px_2px_0_0_#000] flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="bg-black text-yellow-300 font-mono font-black text-xs px-2.5 py-1 border border-black shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="Judul Video..."
                          value={item.title}
                          onChange={(e) => handleUpdateBatchRow(idx, "title", e.target.value)}
                          className="w-full bg-yellow-50 border-2 border-black p-2 font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          placeholder="Tags (pisahkan koma)..."
                          value={item.tags}
                          onChange={(e) => handleUpdateBatchRow(idx, "tags", e.target.value)}
                          className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center">
                        <label className="flex items-center gap-1.5 text-xs font-black cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.is_short}
                            onChange={(e) => handleUpdateBatchRow(idx, "is_short", e.target.checked)}
                            className="w-4 h-4 accent-black"
                          />
                          <span>Shorts</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-cyan-100 border border-black px-2 py-1 text-[10px] font-bold text-black shrink-0">
                      🕒 Rilis: <strong>{dateStr} @ {batchTargetHour}:00 WIB</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBatchRow(idx)}
                      className="bg-red-500 text-white p-1.5 border border-black hover:bg-red-600 shrink-0"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleExecuteBatchSchedule}
            disabled={submittingBatch}
            className="w-full bg-black hover:bg-zinc-800 text-yellow-300 font-black p-4 text-base uppercase border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <Layers className="w-5 h-5"/>
            {submittingBatch ? "MENJADWALKAN SELURUH BATCH..." : `🚀 JADWALKAN ${batchItems.length} VIDEO KE ANTREAN EMAS SEKALIGUS`}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE A/B TEST */}
      {/* ========================================================================= */}
      {showAbModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-xl w-full">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase text-black flex items-center gap-2">
                <SplitSquareVertical className="w-5 h-5 text-pink-600"/> EKSPERIMEN THUMBNAIL A/B BARU
              </h3>
              <button onClick={() => setShowAbModal(false)} className="font-mono font-black text-xl hover:text-red-600">✕</button>
            </div>

            <form onSubmit={handleCreateAbTest} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">JUDUL VIDEO</label>
                <input
                  type="text"
                  placeholder="Contoh: Tiara - Bunga Pantura (Official Music Video)"
                  value={abFormTitle}
                  onChange={(e) => setAbFormTitle(e.target.value)}
                  className="w-full bg-yellow-50 border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">URL THUMBNAIL VARIAN A (Utama)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... atau tautan gambar"
                  value={abFormThumbA}
                  onChange={(e) => setAbFormThumbA(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">URL THUMBNAIL VARIAN B (Eksperimen Pembanding)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... atau tautan gambar"
                  value={abFormThumbB}
                  onChange={(e) => setAbFormThumbB(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">INTERVAL ROTASI OTOMATIS (JAM)</label>
                <select
                  value={abFormInterval}
                  onChange={(e) => setAbFormInterval(Number(e.target.value))}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none"
                >
                  <option value={12}>Setiap 12 Jam (Fast Pace)</option>
                  <option value={24}>Setiap 24 Jam (Rekomendasi Standar)</option>
                  <option value={48}>Setiap 48 Jam (Data Lebih Stabil)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAbModal(false)}
                  className="px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAb}
                  className="bg-black hover:bg-zinc-800 text-yellow-300 font-black px-6 py-2 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {submittingAb ? "MEMPROSES..." : "MULAI EKSPERIMEN A/B"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI SEO TITLE & TAGS GENERATOR */}
      {/* ========================================================================= */}
      {showSeoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500 animate-spin"/>
                <div>
                  <h3 className="font-black text-lg uppercase text-black leading-none">
                    GEMINI AI SEO TITLE & VIRAL TAG GENERATOR
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 mt-0.5">
                    Hasilkan formula judul ber-CTR tinggi yang terbukti memikat algoritma YouTube Indonesia.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSeoModal(false)} className="font-mono font-black text-xl hover:text-red-600">✕</button>
            </div>

            <form onSubmit={handleGenerateSeo} className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase text-black mb-1">KATA KUNCI UTAMA / JUDUL LAGU</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bunga Pantura, Sayang 2, Rungkad"
                    value={seoKeyword}
                    onChange={(e) => setSeoKeyword(e.target.value)}
                    className="w-full bg-yellow-50 border-2 border-black p-2 font-bold text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">GENRE / TEMA</label>
                  <select
                    value={seoGenre}
                    onChange={(e) => setSeoGenre(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none"
                  >
                    <option value="DANGDUT">Dangdut Koplo / Horeg</option>
                    <option value="POP">Pop Indonesia / Akustik</option>
                    <option value="JAVANESE">Campursari / Jawa Syahdu</option>
                    <option value="GENERAL">Umum / Santai</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingSeo}
                className="bg-black hover:bg-zinc-800 text-yellow-300 font-black p-2.5 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4"/>
                {generatingSeo ? "MENGANALISA ALGORITMA YOUTUBE..." : "GENERATE 5 FORMULA JUDUL VIRAL"}
              </button>
            </form>

            {seoResults && (
              <div className="flex flex-col gap-4 mt-2 pt-3 border-t-2 border-black">
                <div>
                  <h4 className="font-black text-xs uppercase text-black mb-2 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500"/> PILIH JUDUL REKOMENDASI (KLIK UNTUK PAKAI):
                  </h4>
                  <div className="flex flex-col gap-2">
                    {seoResults.suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        onClick={() => applySeoTitle(sug, idx)}
                        className="bg-yellow-50 hover:bg-yellow-200 border-2 border-black p-3 cursor-pointer transition-all flex items-center justify-between shadow-[2px_2px_0_0_#000]"
                      >
                        <span className="font-bold text-xs text-black">{sug}</span>
                        <span className="bg-black text-yellow-300 font-black text-[9px] uppercase px-2 py-1 border border-black flex items-center gap-1 shrink-0 ml-2">
                          {copiedTitleIndex === idx ? <CheckCheck className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                          {copiedTitleIndex === idx ? "DITERAPKAN!" : "GUNAKAN"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-xs uppercase text-black mb-1.5">REKOMENDASI TRENDING TAGS:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {seoResults.recommended_tags.map((tg, idx) => (
                      <span key={idx} className="bg-white border border-black px-2 py-0.5 text-[10px] font-bold font-mono shadow-[1px_1px_0_0_#000]">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
