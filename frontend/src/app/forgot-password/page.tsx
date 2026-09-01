"use client"

import { Button } from "@/components/ui/button"
import { PlaySquare, Lock, Mail, ArrowLeft, Loader2, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !newPassword.trim()) {
      setErrorMsg("Email/Username dan kata sandi baru wajib diisi!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          new_password: newPassword.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || "Kata sandi berhasil diperbarui! Mengalihkan ke Halaman Login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || "Gagal memperbarui kata sandi. Periksa Username/Email terdaftar.");
      }
    } catch (err) {
      console.error("Reset password error", err);
      setErrorMsg("Gagal terhubung ke server auth. Periksa koneksi backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-400 flex flex-col justify-center items-center p-4 selection:bg-black selection:text-rose-300">
      
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
          <div className="w-16 h-16 bg-rose-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <KeyRound className="w-10 h-10 text-black" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center uppercase tracking-tighter">
          LUPA / RESET KATA SANDI
        </h1>
        <p className="text-center font-bold mb-6 text-xs text-gray-700 uppercase tracking-tight">
          Perbarui Kata Sandi Akun Terdaftar Audira-YT
        </p>

        {/* FORGOT PASSWORD FORM */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          
          {/* Email / Username */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5"/> USERNAME ATAU EMAIL TERDAFTAR:
            </label>
            <input 
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-rose-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Username (misal: Audira) atau Email"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5"/> KATA SANDI BARU:
            </label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-rose-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Kata Sandi Baru"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5"/> KONFIRMASI KATA SANDI BARU:
            </label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-rose-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Ulangi Kata Sandi Baru"
            />
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

          {/* RESET PASSWORD SUBMIT BUTTON */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-yellow-300 hover:bg-slate-800 text-sm font-black py-4 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-300"/> : <KeyRound className="w-4 h-4 text-yellow-300"/>}
            {loading ? "MEMPROSES RESET KATA SANDI..." : "PERBARUI KATA SANDI SEKARANG"}
          </Button>

        </form>

        <div className="mt-6 text-center border-t-2 border-black pt-4">
          <span className="text-xs font-bold text-gray-700 uppercase mr-1">Sudah Mengingat Kata Sandi?</span>
          <Link href="/login" className="text-xs font-black underline hover:text-amber-600 uppercase">
            Login Kembali &rarr;
          </Link>
        </div>

      </div>

    </div>
  )
}
