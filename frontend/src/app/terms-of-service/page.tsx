import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-amber-50 font-sans text-black p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white border-4 border-black p-8 md:p-12 shadow-[8px_8px_0_0_#000]">
        
        <Link href="/" className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] mb-8 hover:bg-yellow-400">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-10 h-10 text-cyan-500" />
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Syarat & Ketentuan Layanan (Terms of Service)</h1>
        </div>
        <p className="text-xs font-bold text-gray-500 mb-8 border-b-4 border-black pb-4">
          Terakhir Diperbarui: 09 September 2026 | Versi 2.0 (SaaS Public Release)
        </p>

        <div className="space-y-6 text-sm font-medium leading-relaxed">
          <section>
            <h2 className="text-xl font-black uppercase mb-2 text-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 1. Penerimaan Ketentuan
            </h2>
            <p className="text-gray-700">
              Dengan mendaftar, mengakses, atau menggunakan platform <strong>Audira-YT</strong>, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-2 text-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 2. Deskripsi Layanan
            </h2>
            <p className="text-gray-700">
              Audira-YT adalah platform pemantauan telemetri YouTube, analisis AI, dan otomatisasi jaringan channel YouTube. Layanan ini memanfaatkan YouTube Data API v3 dan pustaka publik YouTube sesuai dengan kebijakan Google Developer Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-2 text-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 3. Akun Pengguna & Keamanan Kredensial
            </h2>
            <p className="text-gray-700">
              Anda bertanggung jawab penuh atas keamanan kata sandi dan kredensial akun Anda. Audira-YT tidak bertanggung jawab atas kerugian yang disebabkan oleh penggunaan kata sandi yang tidak aman atau akses pihak ketiga tanpa izin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-2 text-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 4. Kebijakan Pembayaran & Langganan (SaaS Billing)
            </h2>
            <p className="text-gray-700">
              Pembayaran langganan (Paket PRO dan ENTERPRISE) diproses secara otomatis via Payment Gateway resmi (Midtrans/Xendit/Stripe). Biaya langganan tidak dapat dikembalikan (non-refundable) kecuali diatur secara khusus oleh hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-2 text-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 5. Kepatuhan terhadap Ketentuan Layanan YouTube
            </h2>
            <p className="text-gray-700">
              Pengguna wajib mematuhi <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="underline font-bold text-cyan-600">YouTube Terms of Service</a> dan <a href="http://www.google.com/policies/privacy" target="_blank" rel="noreferrer" className="underline font-bold text-cyan-600">Google Privacy Policy</a> saat menghubungkan akun YouTube mereka ke Audira-YT.
            </p>
          </section>

          <section className="pt-6 border-t-4 border-black text-xs text-gray-500 font-bold">
            <p>Jika ada pertanyaan mengenai Syarat & Ketentuan Layanan ini, silakan hubungi tim tim kami via email: <strong>legal@audirayt.com</strong></p>
          </section>
        </div>

      </div>
    </div>
  );
}
