"use client"

import { 
  MessageSquare, Bot, Send, ShieldAlert, CheckCircle2, RefreshCw, Filter, 
  Sparkles, ThumbsUp, AlertTriangle, User, PlaySquare, Plus, Check
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl } from "@/lib/api"

export default function AutoCommentsPage() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [sentimentFilter, setSentimentFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"inbox" | "rules">("inbox");

  // Manual Reply State
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // New Rule Form State
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [replyTemplate, setReplyTemplate] = useState("");

  const fetchCommentsData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const chParam = selectedChannel !== "ALL" ? `?channel_id=${encodeURIComponent(selectedChannel)}` : "";
      const sentParam = sentimentFilter !== "ALL" ? `&sentiment_filter=${sentimentFilter}` : "";

      const [inboxRes, rulesRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/comments/inbox${chParam}${sentParam}`),
        fetch(`${getApiBaseUrl()}/comments/rules`)
      ]);

      if (inboxRes.ok) {
        const data = await inboxRes.json();
        setInbox(data.inbox || []);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments data", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentsData(true);
    const interval = setInterval(() => {
      fetchCommentsData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedChannel, sentimentFilter]);

  const handleSendReply = async (commentId: string) => {
    if (!replyText) return alert("Harap isi balasan komentar!");
    try {
      const res = await fetch(`${getApiBaseUrl()}/comments/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId, reply_text: replyText })
      });

      if (res.ok) {
        alert("🎉 Balasan komentar berhasil dikirim ke YouTube!");
        setReplyingCommentId(null);
        setReplyText("");
        fetchCommentsData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerKeyword || !replyTemplate) return alert("Isi kata kunci dan template balasan!");
    try {
      const res = await fetch(`${getApiBaseUrl()}/comments/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_keyword: triggerKeyword, reply_template: replyTemplate })
      });

      if (res.ok) {
        alert("🎉 Aturan Bot Balasan Otomatis berhasil ditambahkan!");
        setTriggerKeyword("");
        setReplyTemplate("");
        fetchCommentsData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Hero Header */}
      <div className="bg-pink-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-black text-pink-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5"/> UNIFIED INBOX & AUTO-COMMENT BOT
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            MODERASI KOMENTAR & ENGAGEMENT BOT (6 CHANNEL)
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Pantau komentar masuk dari 6 Channel YouTube dalam 1 layar, saring spam otomatis, dan konfigurasikan bot balasan cepat.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] transition-all ${activeTab === 'inbox' ? 'bg-black text-pink-300' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            📥 UNIFIED INBOX ({inbox.length})
          </button>
          <button 
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] transition-all ${activeTab === 'rules' ? 'bg-black text-pink-300' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            🤖 ATURAN AUTO-REPLY ({rules.length})
          </button>
        </div>
      </div>

      {activeTab === "inbox" ? (
        <div className="flex flex-col gap-6">
          
          {/* FILTER BAR */}
          <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_0_#000] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black uppercase text-black flex items-center gap-1.5 border-r-2 border-black pr-3">
                <Filter className="w-4 h-4 text-black"/> FILTER SENTIMEN:
              </span>
              <button 
                onClick={() => setSentimentFilter("ALL")}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] ${sentimentFilter === 'ALL' ? 'bg-black text-yellow-300' : 'bg-white text-black'}`}
              >
                🌐 SEMUA KOMENTAR
              </button>
              <button 
                onClick={() => setSentimentFilter("POSITIVE")}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] ${sentimentFilter === 'POSITIVE' ? 'bg-emerald-300 text-black' : 'bg-white text-black'}`}
              >
                👍 POSITIF / DUKUNGAN
              </button>
              <button 
                onClick={() => setSentimentFilter("SPAM")}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] ${sentimentFilter === 'SPAM' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}
              >
                🚨 TERINDIKASI SPAM
              </button>
            </div>

            <button 
              onClick={() => fetchCommentsData(false)}
              className="bg-black text-pink-300 font-black px-3 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] text-xs uppercase flex items-center gap-1.5 hover:bg-gray-800"
            >
              <RefreshCw className="w-3.5 h-3.5 text-pink-300"/> REFRESH FEED
            </button>
          </div>

          {/* INBOX FEED LIST */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] flex flex-col gap-4 max-h-[650px] overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="bg-pink-100 border-2 border-black p-8 text-center shadow-[3px_3px_0_0_#000]">
                <MessageSquare className="w-10 h-10 text-black mx-auto mb-2 opacity-50" />
                <div className="font-black text-sm uppercase">BELUM ADA KOMENTAR MASUK</div>
              </div>
            ) : (
              inbox.map((c) => (
                <div key={c.id} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] flex flex-col gap-3 hover:bg-pink-50 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-black text-yellow-300 font-mono font-bold text-[10px] px-2 py-0.5 border border-black">
                        {c.channelName}
                      </span>
                      <span className="font-black text-xs text-black">{c.authorName}</span>
                      <span className={`font-black text-[9px] uppercase px-2 py-0.5 border border-black ${c.sentiment === 'SPAM' ? 'bg-red-500 text-white' : 'bg-emerald-300 text-black'}`}>
                        {c.sentiment}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 font-mono">{c.publishedAt}</span>
                    </div>

                    <span className={`font-black text-[10px] uppercase px-2 py-0.5 border border-black ${c.isReplied ? 'bg-emerald-200 text-emerald-900' : 'bg-yellow-200 text-yellow-900'}`}>
                      {c.isReplied ? "✓ TERBALAS" : "⏳ BELUM DIBALAS"}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <div className="text-xs font-bold text-gray-900 bg-gray-50 border border-black p-3 leading-relaxed">
                    "{c.textDisplay}"
                  </div>

                  {/* Existing Reply if any */}
                  {c.isReplied && c.replyText && (
                    <div className="bg-emerald-100 border-l-4 border-black p-2.5 text-xs font-bold text-black ml-4">
                      <strong>💬 Balasan Anda:</strong> {c.replyText}
                    </div>
                  )}

                  {/* Reply Action */}
                  {!c.isReplied && (
                    <div className="mt-1">
                      {replyingCommentId === c.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Tuliskan balasan komentar resmi..." 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                          />
                          <button 
                            onClick={() => handleSendReply(c.id)}
                            className="bg-black text-yellow-300 font-black px-4 py-2 text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1 hover:bg-gray-800"
                          >
                            <Send className="w-3.5 h-3.5 text-yellow-300"/> KIRIM
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setReplyingCommentId(c.id); setReplyText(""); }}
                          className="bg-black text-pink-300 font-black px-3.5 py-1.5 text-xs uppercase border border-black shadow-[1.5px_1.5px_0_0_#000] flex items-center gap-1 hover:bg-gray-800"
                        >
                          <Bot className="w-3.5 h-3.5 text-pink-300"/> BALAS SEKARANG
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* AUTO REPLY RULES TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CREATE RULE FORM */}
          <div className="lg:col-span-5 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
            <h2 className="font-black text-base uppercase flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
              <Plus className="w-5 h-5 text-black"/> BUAT ATURAN BALASAN OTOMATIS
            </h2>

            <form onSubmit={handleCreateRule} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">KATA KUNCI PEMICU (TRIGGER KEYWORDS)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: lagu, mantap, keren, rilis" 
                  value={triggerKeyword} 
                  onChange={(e) => setTriggerKeyword(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">TEMPLATE BALASAN BOT</label>
                <textarea 
                  rows={4}
                  placeholder="Terima kasih dukungannya! Jangan lupa subscribe channel Audira ini ya 🔥" 
                  value={replyTemplate} 
                  onChange={(e) => setReplyTemplate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="bg-black text-pink-300 font-black py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Bot className="w-4 h-4 text-pink-300"/> SIMPAN ATURAN BOT BALASAN
              </button>
            </form>
          </div>

          {/* RULES LIST */}
          <div className="lg:col-span-7 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
            <h2 className="font-black text-base uppercase flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
              <Bot className="w-5 h-5 text-black"/> DAFTAR ATURAN BOT AKTIF ({rules.length})
            </h2>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
              {rules.map((r) => (
                <div key={r.id} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] flex flex-col gap-2 hover:bg-pink-50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="bg-black text-yellow-300 font-mono font-bold text-[10px] px-2 py-0.5 border border-black">
                      {r.channelName}
                    </span>
                    <span className="bg-emerald-300 text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                      BOT AKTIF
                    </span>
                  </div>
                  <div className="text-xs font-black text-black">🔑 Kata Kunci Pemicu: <span className="bg-yellow-200 px-1.5 py-0.5 border border-black">{r.triggerKeyword}</span></div>
                  <div className="text-xs font-bold text-gray-800 bg-gray-50 border border-black p-2.5">
                    🤖 Template: "{r.replyTemplate}"
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
