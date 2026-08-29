"use client"

import { Button } from "@/components/ui/button"
import { PlaySquare } from "lucide-react"

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // In a real implementation, redirect to backend /api/auth/google/login
    // For now, simulate redirect
    window.location.href = "http://localhost:8005/api/v1/auth/google/login"
  }

  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col justify-center items-center p-4">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] max-w-md w-full relative">
        <div className="absolute -top-6 -left-6 bg-red-500 text-white font-bold py-2 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-[-5deg]">
          BETA
        </div>
        
        <div className="flex justify-center mb-6">
          <PlaySquare className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-black mb-2 text-center uppercase tracking-tighter">
          YouTube
          <br/>Intelligence
          <br/>Monitor
        </h1>
        
        <p className="text-center font-medium mb-8 text-black/80">
          Supercharge your YouTube growth with AI-powered analytics and trend detection.
        </p>

        <Button 
          onClick={handleGoogleLogin}
          className="w-full bg-black text-white hover:bg-gray-800 text-lg py-6 border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none font-bold"
        >
          <svg className="w-6 h-6 mr-3 bg-white p-1 rounded-full" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-sm font-bold underline hover:no-underline text-gray-600">
            Preview Dashboard (UI Mockup) &rarr;
          </a>
        </div> 
      </div>
    </div>
  )
}
