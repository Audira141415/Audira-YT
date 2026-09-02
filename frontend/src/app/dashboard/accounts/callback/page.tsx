"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api"

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [connectedEmail, setConnectedEmail] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    
    if (!code) {
      setStatus("error")
      setErrorMsg("Tidak ada authorization code dari Google OAuth.")
      return
    }

    const processLogin = async () => {
      try {
        const redirectUri = window.location.origin + window.location.pathname;
        const res = await fetch(`${getApiBaseUrl()}/auth/google/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: redirectUri
          })
        });

        const data = await res.json()
        if (typeof window !== "undefined" && data.access_token) {
          localStorage.setItem("audira_token", data.access_token);
          localStorage.setItem("audira_user", JSON.stringify({
            ...(data.user || {}),
            role: "ADMIN",
            name: data.user?.name || data.user?.email || "Google OAuth User"
          }));
          if (data.user?.email) {
            setConnectedEmail(data.user.email);
          }
        }

        setStatus("success")
        setTimeout(() => {
          router.push("/dashboard/settings/integrations?oauth_success=1")
        }, 2200)

      } catch (err: any) {
        setStatus("error")
        setErrorMsg(err.message || "Terjadi kesalahan saat memproses otentikasi Google OAuth.")
      }
    }

    processLogin()
  }, [searchParams, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 p-4">
      <div className="bg-white border-4 border-black shadow-[10px_10px_0_0_#000] p-8 md:p-12 flex flex-col items-center max-w-lg w-full text-center relative overflow-hidden">
        {status === "loading" && (
          <>
            <div className="p-4 bg-yellow-300 border-3 border-black shadow-[4px_4px_0_0_#000] mb-6 animate-pulse">
              <Loader2 className="w-12 h-12 animate-spin text-black stroke-[3]" />
            </div>
            <span className="bg-black text-yellow-300 font-black text-[10px] uppercase px-3 py-1 border border-black shadow-[2px_2px_0_0_#000] mb-2">
              GOOGLE OAUTH IN PROGRESS
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">MENGHUBUNGKAN AKUN OAUTH...</h2>
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              Memverifikasi otorisasi token Google Cloud & menyinkronkan data channel YouTube ke sistem.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="p-4 bg-emerald-400 border-3 border-black shadow-[4px_4px_0_0_#000] mb-4 animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-black stroke-[3]" />
            </div>
            <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
              <span className="bg-black text-emerald-300 font-black text-[10px] uppercase px-3 py-1 border border-black shadow-[2px_2px_0_0_#000]">
                OAUTH CONNECTED 🟢
              </span>
              <span className="bg-yellow-300 text-black font-black text-[10px] uppercase px-3 py-1 border border-black shadow-[2px_2px_0_0_#000]">
                TOKEN AUTO-REFRESH AKTIF
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-black">
              OAUTH BERHASIL TERHUBUNG! 🚀
            </h2>
            {connectedEmail && (
              <div className="bg-yellow-100 border-2 border-black px-4 py-2 font-mono font-black text-xs text-black mb-3 shadow-[2px_2px_0_0_#000]">
                {connectedEmail}
              </div>
            )}
            <p className="text-xs font-bold text-gray-700 leading-relaxed mb-6">
              Akun Google OAuth Anda telah aktif terhubung. Token terenkripsi dengan aman dan siap memantau data channel secara otomatis 24/7. Mengalihkan ke menu Pengaturan Integrasi...
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => router.push("/dashboard/settings/integrations?oauth_success=1")}
                className="flex-1 bg-black text-yellow-300 font-black py-3 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-gray-800 text-xs uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                LIHAT PENGATURAN INTEGRASI
              </button>
              <button
                onClick={() => router.push("/dashboard/accounts?oauth_success=1")}
                className="flex-1 bg-emerald-400 text-black font-black py-3 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-emerald-500 text-xs uppercase transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                LIHAT DAFTAR AKUN PIPELINE
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="p-4 bg-red-400 border-3 border-black shadow-[4px_4px_0_0_#000] mb-4">
              <XCircle className="w-14 h-14 text-white stroke-[3]" />
            </div>
            <span className="bg-black text-red-400 font-black text-[10px] uppercase px-3 py-1 border border-black shadow-[2px_2px_0_0_#000] mb-2">
              AUTHENTICATION ERROR
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black">
              KONEKSI OAUTH GAGAL
            </h2>
            <p className="text-xs font-bold text-red-700 mb-6 bg-red-50 border-2 border-red-400 p-3 shadow-[2px_2px_0_0_#000] font-mono">
              {errorMsg}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => router.push("/dashboard/settings/integrations")}
                className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase hover:bg-gray-800"
              >
                KEMBALI KE PENGATURAN
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
