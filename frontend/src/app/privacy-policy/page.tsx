import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Audira-YT',
  description: 'Kebijakan Privasi dan Perlindungan Data Pengguna Audira-YT YouTube Intelligence Platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl backdrop-blur-md">
        <div className="border-b border-slate-800 pb-6 mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-red-400 hover:text-red-300 font-medium mb-4 transition-colors">
            &larr; Kembali ke Beranda
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Terakhir Diperbarui: 9 September 2026
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Pendahuluan</h2>
            <p>
              Audira-YT ("Kami", "Platform") berkomitmen penuh untuk melindungi privasi dan keamanan data pribadi pengguna ("Anda"). Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan layanan analitik dan pemantauan otomatis YouTube Intelligence Audira-YT.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Data yang Kami Kumpulkan</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Informasi Akun:</strong> Alamat email, nama, hashed password saat Anda mendaftar akun Audira-YT.</li>
              <li><strong className="text-slate-200">Data YouTube Publik & API:</strong> Metadata channel YouTube, statistik video publik (view count, subscriber count, komentar publik), serta kredensial YouTube Data API OAuth yang Anda otorisasi secara resmi.</li>
              <li><strong className="text-slate-200">Log Aktivitas & Teknis:</strong> Alamat IP, jenis browser, data log performa sinkronisasi channel, dan data cookie autentikasi aman.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Penggunaan Data</h2>
            <p>Data yang dikumpulkan digunakan secara eksklusif untuk:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 mt-2">
              <li>Menyediakan layanan analitik real-time, deteksi tren video, dan AI Radar Kompetitor.</li>
              <li>Mengirimkan notifikasi instant upload dan alert via Telegram Bot resmi atau Email.</li>
              <li>Memproses transaksi berlangganan SaaS dan otentikasi akun secara aman.</li>
              <li>Meningkatkan kualitas algoritma pemantauan dan performa platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Penggunaan Google API Data</h2>
            <p>
              Penggunaan dan pengalihan informasi yang diterima dari Google APIs oleh Audira-YT ke aplikasi lain akan mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-red-400 underline">Google API Services User Data Policy</a>, termasuk persyaratan <em>Limited Use</em>. Kami tidak pernah menjual data API Google Anda kepada pihak ketiga mana pun.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Keamanan Data</h2>
            <p>
              Kami menerapkan standar enkripsi kelas industri (HTTPS/TLS, HSTS, Secure Cookie, JWT Tokens, dan hashing password bcrypt) untuk memastikan data Anda aman dari akses tidak sah, pembocoran, atau enkripsi liar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Hak Pengguna</h2>
            <p>
              Anda berhak mengakses, memperbarui, atau meminta penghapusan permanen akun dan seluruh data channel YouTube yang terhubung di platform Audira-YT kapan saja melalui menu Pengaturan Akun.
            </p>
          </section>

          <section className="border-t border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-white mb-3">7. Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi tim kami di <span className="text-red-400 font-medium">support@audirayt.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
