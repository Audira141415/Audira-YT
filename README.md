# 🚀 Audira YT Monitor - Ultimate Multi-Channel YouTube Intelligence Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016-black)](https://nextjs.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)](https://www.postgresql.org/)
[![Queue: Redis %26 Celery](https://img.shields.io/badge/Background-Redis%20%26%20Celery-red)](https://docs.celeryq.dev/)

**Audira YT Monitor** adalah platform pemantauan dan analitik intelijen multi-channel YouTube berarsitektur *Enterprise* dengan desain **Vibrant Neo-Brutalisme**. Dikembangkan secara profesional oleh **Agus Dwi Rianto (Audira Digital Network)**.

---

## 🌟 Fitur Unggulan (Key Features)

- 👥 **Multi-Google OAuth Credentials & Accounts Manager**: Kelola banyak akun Google OAuth dan Kredensial Client ID secara bersamaan dengan auto-reset form & quota meter harian (hingga 30.000 units/hari).
- 🔑 **YouTube Analytics API v2 Integration**: Membaca estimasi pendapatan (*Estimated Revenue USD & IDR*), CPM, RPM, total jam tayang (*Watch Time Hours*), demografi penonton (*Top Countries & Gender*), dan sumber trafik.
- 🎯 **Per-Channel Precision Analytics**: Filter presisi per-channel pada seluruh halaman utama (Overview, Trends, Realtime, Videos) untuk memantau performa tiap channel secara mandiri.
- ⏱️ **Deteksi Waktu Upload Presisi (WIB)**: Ekstraksi jam upload presisi dari timestamp `published_at` Google (konversi UTC to WIB) dan proyeksi jendela waktu lonjakan tayangan.
- ⚡ **Realtime View Pulse (15s Auto-Refresh)**: Pemantauan denyut tayangan 60 menit secara langsung dengan auto-refresh peramban setiap 15 detik.
- 📄 **Multi-Format Executive Report Generator**: Ekspor laporan eksekutif dan data mentah database ke format PDF, CSV, dan Excel (XLSX).
- 💾 **PostgreSQL Database Export & Backup Engine**: Backup basis data 1-klik untuk seluruh tabel (`GoogleAccount`, `YouTubeChannel`, `Video`, `OAuthCredential`, `SystemSetting`).

---

## 🛠️ Teknologi & Arsitektur (Tech Stack)

- **Frontend**: Next.js 16 (Turbopack), React 19, TailwindCSS (Vibrant Neo-Brutalisme), Recharts, Lucide Icons.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2, Google OAuthlib, Fernet Encryption.
- **Background Tasks**: Celery Worker, Celery Beat Scheduler, Redis Message Broker.
- **Database**: PostgreSQL 16 Relational Database.
- **Desktop Packaging**: Tauri v2 Framework.

---

## 🚀 Panduan Memulai (Quickstart)

### 1. Prasyarat System
- Windows 10/11 atau Linux Server
- Node.js (v18+) & Python (v3.10+)
- PostgreSQL & Redis Server

### 2. Menjalankan Aplikasi (1-Klik Batch File)
Cukup jalankan berkas batch otomatis yang disediakan di folder root:
```cmd
.\startYT.bat
```
- **Frontend Dashboard**: `http://localhost:3005`
- **Backend FastAPI Docs**: `http://localhost:8005/docs`

### 3. Otomatisasi Git Push ke GitHub
Untuk menyimpan dan memperbarui kode ke GitHub repository 1-klik:
```cmd
.\SAVE_TO_GITHUB.bat
```

---

## 🔐 Keamanan & Lisensi (Security & License)

- **Lisensi**: Hak cipta dilindungi di bawah [Lisensi MIT](LICENSE) oleh **Agus Dwi Rianto (Audira Digital Network)**.
- **Enkripsi Kredensial**: Seluruh token OAuth dan Client Secret disimpan dengan enkripsi Fernet 32-byte AES.

---

## 👤 Pengembang & Hak Cipta (Author)

**Agus Dwi Rianto**  
*Audira Digital Network & Audira Sukses Mandiri*  
- Email: `audirasuksesmandiri@gmail.com`  
- GitHub: [@Audira141415](https://github.com/Audira141415)
