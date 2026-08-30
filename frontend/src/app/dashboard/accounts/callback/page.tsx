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

  useEffect(() => {
    const code = searchParams.get("code")
    
    if (!code) {
      setStatus("error")
      setErrorMsg("No authorization code received from Google.")
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
        }

        setStatus("success")
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
            <Loader2 className="w-16 h-16 animate-spin text-yellow-500 mb-6 stroke-[3]" />
            <h2 className="text-2xl font-black uppercase text-center tracking-tight mb-2">Connecting Account...</h2>
            <p className="text-xs font-bold text-center text-gray-600">Completing Google OAuth authentication with backend</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6 stroke-[3]" />
            <h2 className="text-2xl font-black uppercase text-center tracking-tight mb-2">Success!</h2>
            <p className="text-xs font-bold text-center text-gray-600">Google Account connected successfully. Redirecting to Accounts...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-6 stroke-[3]" />
            <h2 className="text-2xl font-black uppercase text-center tracking-tight mb-2">Authentication Failed</h2>
            <p className="text-xs font-bold text-center text-red-600 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="bg-black text-yellow-300 font-black px-6 py-3 border-2 border-black shadow-[3px_3px_0_0_#000] text-xs uppercase"
            >
              Back to Accounts
            </button>
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
