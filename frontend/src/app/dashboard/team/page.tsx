"use client"

import { 
  Users, ShieldCheck, UserPlus, Lock, Key, CheckCircle2, AlertCircle, 
  Trash2, RefreshCw, Eye, Shield, Award, UserCheck, Crown
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

export default function TeamManagementPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleMatrix, setRoleMatrix] = useState<any>({});
  const [userRole, setUserRole] = useState<string>("SUPERADMIN");

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("audira_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUserRole((u.role || "SUPERADMIN").toUpperCase());
        } catch (e) {}
      }
    }
  }, []);

  const fetchTeamData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetchWithFallback("/team/members");
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          setMembers(data.members || []);
          setRoleMatrix(data.roleMatrix || {});
        }
      }
    } catch (err) {
      console.error("Failed to fetch team members", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
      fetchTeamData(true);
    }
  }, [userRole]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Harap masukkan email anggota tim!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchWithAuth(`${getApiBaseUrl()}/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role })
      });

      if (res.ok) {
        alert(`🎉 Undangan dikirim! ${email} telah ditambahkan sebagai ${role}!`);
        setEmail("");
        setName("");
        fetchTeamData(false);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Gagal mengundang anggota tim.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saat mengundang anggota tim.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus anggota tim ini?")) return;
    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/team/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeamData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
    return (
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center max-w-2xl mx-auto my-8">
        <div className="bg-cyan-300 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#000]">
          <ShieldCheck className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-black uppercase">BATASAN HAK AKSES TIM AGENSI</h2>
        <p className="text-xs font-bold text-gray-700 mt-2 mb-6">
          Halaman Manajemen Hak Akses Tim & Struktur RBAC hanya dapat dikelola oleh <strong>SUPERADMIN / ADMIN</strong>.
        </p>
        <a href="/dashboard" className="bg-black text-cyan-300 font-black px-6 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] inline-block hover:bg-gray-800">
          &larr; KEMBALI KE DASHBOARD OVERVIEW
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Hero Header Banner */}
      <div className="bg-cyan-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-black text-cyan-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5"/> ROLE-BASED ACCESS CONTROL (RBAC) & TEAM MANAGEMENT
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            MANAJEMEN HAK AKSES TIM AGENSI
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Atur hak akses berjenjang (*Owner vs Editor vs Viewer*) untuk melindungi kredensial Google OAuth dan data keuangan IDR.
          </p>
        </div>

        <div className="bg-black text-cyan-300 border-2 border-black px-4 py-3 font-black text-xs uppercase shadow-[3px_3px_0_0_#000] shrink-0 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-300"/>
          <span>RBAC ENGINE: <strong className="text-white">ACTIVE (3 ROLES)</strong></span>
        </div>
      </div>

      {/* 3 Role Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: OWNER */}
        <div className="bg-yellow-300 border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-black"/> OWNER / SUPER ADMIN
            </span>
            <span className="bg-black text-yellow-300 font-black text-[9px] px-2 py-0.5 border border-black">FULL ACCESS</span>
          </div>
          <p className="text-xs font-bold text-gray-900 leading-relaxed mt-2">
            Akses total tanpa batas: Pendapatan IDR/USD, Token OAuth, Setting Server, Kredensial Telegram Bot, & Hapus Anggota.
          </p>
        </div>

        {/* Card 2: EDITOR */}
        <div className="bg-cyan-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-black"/> EDITOR / MANAGER
            </span>
            <span className="bg-black text-cyan-300 font-black text-[9px] px-2 py-0.5 border border-black">OPERATIONAL</span>
          </div>
          <p className="text-xs font-bold text-gray-900 leading-relaxed mt-2">
            Akses operasional harian: Upload video, jadwalkan konten, membalas komentar. <strong>Proteksi data pendapatan IDR & Token OAuth.</strong>
          </p>
        </div>

        {/* Card 3: VIEWER */}
        <div className="bg-purple-200 border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-black"/> CLIENT / VIEWER
            </span>
            <span className="bg-black text-purple-300 font-black text-[9px] px-2 py-0.5 border border-black">READ ONLY</span>
          </div>
          <p className="text-xs font-bold text-gray-900 leading-relaxed mt-2">
            Akses baca saja (*Read-Only*): Pemantauan grafik performa & ekspor laporan tanpa izin mengubah konfigurasi sistem.
          </p>
        </div>

      </div>

      {/* Grid: Invite Member Form (Left) & Member List Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT FORM: INVITE MEMBER */}
        <div className="lg:col-span-5 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <h2 className="font-black text-base uppercase flex items-center gap-2 mb-4 pb-3 border-b-4 border-black">
            <UserPlus className="w-5 h-5 text-black"/> UNDANG ANGGOTA TIM BARU
          </h2>

          <form onSubmit={handleInviteMember} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">NAMA LENGKAP ANGGOTA</label>
              <input 
                type="text" 
                placeholder="Contoh: Andi Pratama" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">EMAIL ANGGOTA TIM</label>
              <input 
                type="email" 
                placeholder="editor@audira.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">HAK AKSES / PERAN (ROLE)</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-cyan-100 border-2 border-black p-2.5 font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              >
                <option value="OWNER">👑 OWNER (AKSES TOTAL SENSITIF)</option>
                <option value="EDITOR">🎬 EDITOR / MANAGER (OPERASIONAL KONTEN)</option>
                <option value="VIEWER">👁️ VIEWER (READ-ONLY ANALITIK)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="bg-black text-cyan-300 font-black py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all mt-2"
            >
              <UserPlus className="w-4 h-4 text-cyan-300"/> 
              {submitting ? "MENGIRIM UNDANGAN..." : "KIRIM UNDANGAN HAK AKSES"}
            </button>
          </form>
        </div>

        {/* RIGHT MEMBER LIST */}
        <div className="lg:col-span-7 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
          <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
            <h2 className="font-black text-base uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-black"/> DAFTAR ANGGOTA TIM TERDAFTAR ({members.length})
            </h2>
            <button 
              onClick={() => fetchTeamData(false)}
              className="bg-black text-cyan-300 font-black px-3 py-1.5 border border-black shadow-[1.5px_1.5px_0_0_#000] text-[10px] uppercase flex items-center gap-1 hover:bg-gray-800"
            >
              <RefreshCw className="w-3 h-3 text-cyan-300"/> REFRESH MEMBERS
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
            {members.map((m) => (
              <div key={m.id} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0_0_#000] flex justify-between items-center gap-3 hover:bg-cyan-50 transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-black">{m.name}</span>
                    <span className={`font-black text-[9px] uppercase px-2.5 py-0.5 border border-black ${m.role === 'OWNER' ? 'bg-yellow-300 text-black' : m.role === 'EDITOR' ? 'bg-cyan-300 text-black' : 'bg-purple-300 text-black'}`}>
                      {m.role}
                    </span>
                    <span className="bg-emerald-300 text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black">
                      {m.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-700 font-mono">{m.email}</div>
                  <div className="text-[10px] font-bold text-gray-500 mt-1">Bergabung: {m.createdAt}</div>
                </div>

                {m.role !== 'OWNER' && (
                  <button 
                    onClick={() => handleRemoveMember(m.id)}
                    className="bg-red-500 text-white font-black p-2 border border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-red-600 shrink-0"
                    title="Hapus Anggota Tim"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
