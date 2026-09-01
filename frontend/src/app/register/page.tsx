"use client"

import { Button } from "@/components/ui/button"
import { PlaySquare, Lock, Mail, UserCheck, ArrowRight, ShieldCheck, Zap, KeyRound, Loader2, Crown, UserPlus, ArrowLeft } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("SUPERADMIN");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Seluruh kolom formulir pendaftaran wajib diisi!");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role: role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Registrasi akun baru berhasil! Mengalihkan ke Dashboard...");
        if (typeof window !== "undefined") {
          localStorage.setItem("audira_token", data.access_token || "audira_superadmin_active_session");
          localStorage.setItem("audira_user", JSON.stringify({
            ...(data.user || {}),
            role: role,
            name: name,
            email: email
          }));
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || "Gagal melakukan registrasi akun baru.");
      }
    } catch (err) {
      console.error("Register error", err);
      setErrorMsg("Gagal terhubung ke server auth. Periksa koneksi backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyan-300 flex flex-col justify-center items-center p-4 selection:bg-black selection:text-cyan-300">
      
      <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_#000] max-w-lg w-full relative">
        
        {/* Back to Login Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 font-black text-xs uppercase bg-yellow-300 text-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-yellow-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4"/> KEMBALI KE LOGIN
        </Link>

        {/* Brand Logo Header */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-cyan-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <UserPlus className="w-10 h-10 text-black" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center uppercase tracking-tighter">
          REGISTRASI AKUN BARU
        </h1>
        <p className="text-center font-bold mb-6 text-xs text-gray-700 uppercase tracking-tight">
          Buat Akun Lisensi Pengelola System Monitoring Audira-YT
        </p>

        {/* REGISTER FORM */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5"/> NAMA LENGKAP / USERNAME:
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-cyan-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Contoh: Audira Sukses"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5"/> EMAIL TERDAFTAR:
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-cyan-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="nama@domain.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5"/> KATA SANDI:
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-cyan-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Minimal 6 Karakter"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5"/> KONFIRMASI KATA SANDI:
            </label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-cyan-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Ulangi Kata Sandi"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500"/> PERAN / HAK AKSES (ROLE):
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-300 shadow-[2px_2px_0_0_#000]"
            >
              <option value="SUPERADMIN">SUPERADMIN (AKSES PENUH SELURUH CHANNEL)</option>
              <option value="OWNER">OWNER CHANNEL NETWORK</option>
              <option value="EDITOR">EDITOR & ANALYST</option>
            </select>
          </div>

          {errorMsg && (
            <div className="bg-red-200 border-2 border-black p-2.5 text-xs font-black text-red-900 uppercase shadow-[2px_2px_0_0_#000]">
              🚨 {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-200 border-2 border-black p-2.5 text-xs font-black text-emerald-900 uppercase shadow-[2px_2px_0_0_#000]">
              ✅ {successMsg}
            </div>
          )}

          {/* REGISTER SUBMIT BUTTON */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-cyan-300 hover:bg-slate-800 text-sm font-black py-4 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-cyan-300"/> : <UserPlus className="w-4 h-4 text-cyan-300"/>}
            {loading ? "MEMPROSES REGISTRASI..." : "PROSES REGISTRASI AKUN BARU"}
          </Button>

        </form>

        <div className="mt-6 text-center border-t-2 border-black pt-4">
          <span className="text-xs font-bold text-gray-700 uppercase mr-1">Sudah Memiliki Akun?</span>
          <Link href="/login" className="text-xs font-black underline hover:text-amber-600 uppercase">
            Login di Sini &rarr;
          </Link>
        </div>

      </div>

    </div>
  )
}
