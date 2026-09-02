import psycopg2
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

def clean_database(host, port, dbname, user, password, label):
    print(f"\n[*] Membersihkan Database pada {label} ({host}:{port})...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            connect_timeout=5
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Daftar tabel akun & analytics yang akan dibersihkan
        tables_to_clean = [
            "comments",
            "videos",
            "channel_milestones",
            "youtube_channels",
            "google_accounts"
        ]

        for table in tables_to_clean:
            try:
                cur.execute(f"TRUNCATE TABLE {table} CASCADE;")
                print(f"  [OK] Tabel '{table}' berhasil dibersihkan.")
            except Exception as e:
                print(f"  [SKIP] Tabel '{table}': {e}")

        # Verifikasi data penting tetap utuh
        cur.execute("SELECT count(*) FROM users;")
        user_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM oauth_credentials;")
        cred_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM system_settings;")
        setting_count = cur.fetchone()[0]

        print(f"  [PROTECTED DATA]:")
        print(f"     - Users (Superadmin): {user_count} user")
        print(f"     - OAuth Credentials: {cred_count} app")
        print(f"     - System Settings (Telegram): {setting_count} settings")

        conn.close()
        print(f"[SUCCESS] Database {label} BERSIH (CLEAN STATE) 100%!")
    except Exception as err:
        print(f"[ERROR] {label}: {err}")

if __name__ == "__main__":
    clean_database("192.168.100.178", 5432, "youtube_monitor", "postgres", "postgres", "MINI PC SERVER PRODUKSI")
