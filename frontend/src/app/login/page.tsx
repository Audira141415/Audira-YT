"use client"

import { Button } from "@/components/ui/button"
import { PlaySquare, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, Zap, KeyRound, Loader2, Sparkles, Crown, ShieldAlert } from "lucide-react"
import { getApiBaseUrl, getOAuthRedirectUri } from "@/lib/api"
import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@audira.com");
  const [password, setPassword] = useState("superadmin123456");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSuperadminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("audira_token", data.access_token);
          localStorage.setItem("audira_user", JSON.stringify({
            ...data.user,
            role: "SUPERADMIN",
            name: "SUPERADMIN SYSTEM"
          }));
        }
        router.push("/dashboard");
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Login Superadmin gagal");
      }
    } catch (err) {
      console.error("Login failed", err);
      // Fallback redirect directly to dashboard
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = getOAuthRedirectUri("/dashboard/accounts/callback");
      const res = await fetch(`${getApiBaseUrl()}/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Google Client ID belum dikonfigurasi di Settings.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghubungi server auth Google OAuth.");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col justify-center items-center p-4 selection:bg-black selection:text-yellow-300">
      
      <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_#000] max-w-lg w-full relative">
        
        {/* Top Floating Superadmin Badge */}
        <div className="absolute -top-6 -left-6 bg-red-500 text-white font-black py-2 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-[-5deg] text-xs uppercase flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-yellow-300 fill-current"/> SUPERADMIN AUTHENTICATION
        </div>

        {/* Brand Logo Header */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
            <PlaySquare className="w-10 h-10 text-black fill-current" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center uppercase tracking-tighter">
          AUDIRA INTELLIGENCE MONITOR
        </h1>
        <p className="text-center font-bold mb-6 text-xs text-gray-700 uppercase tracking-tight">
          Pusat Kontrol Superadmin Mengelola Seluruh Akun & Channel
        </p>

        {/* SUPERADMIN SCOPE CARD BADGE */}
        <div className="mb-5 bg-black text-yellow-300 border-3 border-black p-4 shadow-[3px_3px_0_0_#000]">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-yellow-300 fill-current" />
            <span className="text-xs font-black uppercase tracking-wider">HAK AKSES SUPERADMIN SYSTEM</span>
          </div>
          <p className="text-[11px] font-bold text-gray-300 leading-relaxed">
            Akun ini memegang lisensi penuh untuk mengontrol seluruh <strong>3 Akun Google OAuth</strong> dan <strong>6 Channel YouTube</strong> terhubung.
          </p>
        </div>

        {/* CREDENTIALS LOGIN FORM */}
        <form onSubmit={handleSuperadminLogin} className="space-y-4 mb-5">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5"/> USERNAME SUPERADMIN (PREFILLED):
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="superadmin@audira.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5"/> KATA SANDI SUPERADMIN (PREFILLED):
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="••••••••••••"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-200 border-2 border-black p-2 text-xs font-black text-red-900 uppercase">
              {errorMsg}
            </div>
          )}

          {/* 1-CLICK SUPERADMIN LOGIN BUTTON */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-yellow-300 hover:bg-gray-800 text-sm font-black py-4 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-300"/> : <Zap className="w-4 h-4 text-yellow-300 fill-current"/>}
            {loading ? "AUTHENTICATING..." : "⚡ 1-CLICK MASUK SEBAGAI SUPERADMIN"}
          </Button>

        </form>

        <div className="relative my-6 text-center">
          <hr className="border-t-2 border-black" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 font-black text-[10px] uppercase text-gray-500">
            ATAU OTORISASI AKUN GOOGLE
          </span>
        </div>

        {/* GOOGLE OAUTH BUTTON */}
        <Button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black hover:bg-gray-100 text-xs font-black py-3.5 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          TAMBAH OTORISASI GOOGLE OAUTH
        </Button>

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-xs font-black underline hover:no-underline text-gray-700 uppercase">
            Jelajahi Pratinjau Dashboard &rarr;
          </a>
        </div>

      </div>

    </div>
  )
}
