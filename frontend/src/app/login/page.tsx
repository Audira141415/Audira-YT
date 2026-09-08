"use client"

import { Button } from "@/components/ui/button"
import { PlaySquare, Lock, Mail, ArrowRight, ShieldCheck, Loader2, UserPlus, Home, ArrowLeft } from "lucide-react"
import { getApiBaseUrl, getOAuthRedirectUri, fetchWithFallback } from "@/lib/api"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSuperadminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Username/Email dan kata sandi wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const payload = { email: email.trim(), password: password.trim() };
      let res = await fetchWithFallback("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res) {
        const urlsToTry = [
          `${getApiBaseUrl()}/auth/login`,
          typeof window !== "undefined" ? `${window.location.origin}/api/v1/auth/login` : "",
          typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8005/api/v1/auth/login` : "",
          "http://192.168.100.178:8005/api/v1/auth/login"
        ].filter(Boolean);

        for (const u of urlsToTry) {
          try {
            const r = await fetch(u, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (r && r.headers.get("content-type")?.includes("application/json")) {
              res = r;
              break;
            }
          } catch (err) {
            // try next URL
          }
        }
      }

      let data: any = null;
      if (res) {
        try {
          const rawText = await res.text();
          data = JSON.parse(rawText);
        } catch (e) {
          data = null;
        }
      }

      if (res && res.ok && data && data.access_token) {
        if (typeof window !== "undefined") {
          const nowStr = Date.now().toString();
          localStorage.setItem("audira_token", data.access_token || "audira_active_session");
          localStorage.setItem("audira_login_time", nowStr);
          localStorage.setItem("audira_last_activity", nowStr);
          localStorage.setItem("audira_user", JSON.stringify({
            ...(data.user || {}),
            role: data.user?.role || "SUPERADMIN",
            name: data.user?.name || "Audira",
            email: data.user?.email || email.trim()
          }));
        }
        router.push("/dashboard");
      } else if (data && data.detail) {
        setErrorMsg(data.detail);
      } else {
        setErrorMsg("Otentikasi gagal. Periksa Username/Email dan kata sandi Anda.");
      }
    } catch (err) {
      console.error("Login failed", err);
      setErrorMsg("Gagal terhubung ke server auth. Periksa koneksi backend API.");
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
    <div className="min-h-screen bg-yellow-400 flex flex-col justify-center items-center p-4 selection:bg-black selection:text-yellow-300 relative">
      
      {/* Top Floating Back to Home Button */}
      <Link 
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-black text-yellow-300 font-black px-4 py-2.5 border-3 border-black shadow-[4px_4px_0_0_#000] text-xs uppercase flex items-center gap-2 hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all z-20"
      >
        <ArrowLeft className="w-4 h-4 text-yellow-300"/> KEMBALI KE BERANDA (LANDING PAGE)
      </Link>

      <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_#000] max-w-lg w-full relative mt-12 sm:mt-0">
        
        {/* Top Floating Badge */}
        <div className="absolute -top-6 -left-6 bg-yellow-300 text-black font-black py-2 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-[-5deg] text-xs uppercase flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-black fill-current"/> AUDIRA STUDIO LOG-IN
        </div>

        {/* Brand Logo Header */}
        <div className="flex justify-center mb-4">
          <Link href="/" title="Ke Beranda Utama">
            <div className="w-16 h-16 bg-yellow-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] hover:scale-105 transition-transform cursor-pointer">
              <PlaySquare className="w-10 h-10 text-black fill-current" />
            </div>
          </Link>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center uppercase tracking-tighter">
          AUDIRA INTELLIGENCE MONITOR
        </h1>
        <p className="text-center font-bold mb-6 text-xs text-gray-700 uppercase tracking-tight">
          Pusat Kontrol Mengelola Seluruh Akun & Channel
        </p>

        {/* CREDENTIALS LOGIN FORM */}
        <form onSubmit={handleSuperadminLogin} className="space-y-4 mb-5">
          
          {/* Email / Username Field */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5"/> USERNAME / EMAIL:
            </label>
            <input 
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Username atau Email"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black uppercase flex items-center gap-1">
                <Lock className="w-3.5 h-3.5"/> KATA SANDI:
              </label>
              <Link href="/forgot-password" className="text-[10px] font-black uppercase underline hover:text-amber-600">
                LUPA KATA SANDI?
              </Link>
            </div>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-3 border-black p-2.5 font-black text-xs bg-yellow-50 focus:bg-white shadow-[2px_2px_0_0_#000]"
              placeholder="Masukkan Kata Sandi"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-200 border-2 border-black p-2.5 text-xs font-black text-red-900 uppercase shadow-[2px_2px_0_0_#000]">
              🚨 {errorMsg}
            </div>
          )}

          {/* LOGIN BUTTON */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-yellow-300 hover:bg-gray-800 text-sm font-black py-4 border-3 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-300"/> : <ArrowRight className="w-4 h-4 text-yellow-300"/>}
            {loading ? "AUTHENTICATING..." : "MASUK KE DASHBOARD"}
          </Button>

        </form>

        {/* REGISTER, GOOGLE OAUTH & LANDING PAGE LINKS */}
        <div className="flex flex-col gap-3 pt-2 border-t-2 border-black">
          <Link 
            href="/register"
            className="w-full bg-cyan-300 hover:bg-cyan-400 text-slate-950 text-xs font-black py-3 border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center uppercase flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4"/> REGISTRASI AKUN BARU
          </Link>

          <Button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black hover:bg-gray-100 text-xs font-black py-3 border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all rounded-none uppercase flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            TAMBAH OTORISASI GOOGLE OAUTH
          </Button>

          <Link 
            href="/"
            className="w-full bg-yellow-200 hover:bg-yellow-300 text-black text-xs font-black py-2.5 border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center uppercase flex items-center justify-center gap-2 mt-1"
          >
            <Home className="w-4 h-4"/> KEMBALI KE BERANDA (LANDING PAGE)
          </Link>
        </div>

      </div>

    </div>
  )
}
