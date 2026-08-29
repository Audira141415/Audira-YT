"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function CallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    
    if (!code) {
      setStatus("error")
      setErrorMsg("No authorization code received from Google.")
      return
    }

    const processLogin = async () => {
      try {
        const redirectUri = window.location.origin + window.location.pathname; // Should be http://localhost:3005/dashboard/accounts/callback
        const res = await fetch("http://localhost:8005/api/v1/auth/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: redirectUri
          })
        });

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || "Failed to authenticate with backend")
        }

        setStatus("success")
        
        // Wait 2 seconds so user sees success, then redirect back to accounts
        setTimeout(() => {
          router.push("/dashboard/accounts")
        }, 2000)

      } catch (err: any) {
        setStatus("error")
        setErrorMsg(err.message || "An unexpected error occurred.")
      }
    }

    processLogin()
  }, [searchParams, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-12 flex flex-col items-center max-w-md w-full">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
            <h2 className="font-black text-2xl tracking-tighter uppercase mb-2">Verifying...</h2>
            <p className="text-sm font-bold text-gray-600 text-center">Menghubungkan akun Google Anda dengan sistem kami. Mohon tunggu sebentar.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-6" />
            <h2 className="font-black text-2xl tracking-tighter uppercase mb-2 text-green-600">Berhasil!</h2>
            <p className="text-sm font-bold text-gray-600 text-center mb-6">Akun Google berhasil dihubungkan. Mengalihkan Anda kembali...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mb-6" />
            <h2 className="font-black text-2xl tracking-tighter uppercase mb-2 text-red-600">Gagal</h2>
            <p className="text-sm font-bold text-gray-600 text-center mb-8">{errorMsg}</p>
            <button 
              onClick={() => router.push("/dashboard/accounts")}
              className="w-full bg-black text-white font-bold px-4 py-3 border-2 border-black hover:bg-gray-800 transition-colors shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none text-sm uppercase"
            >
              Kembali ke Accounts
            </button>
          </>
        )}
      </div>
    </div>
  )
}
