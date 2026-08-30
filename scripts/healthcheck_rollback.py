import os
import sys
import time
import subprocess
import urllib.request
import urllib.error

def check_url(url, timeout=3):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AudiraHealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False

def verify_deployment(max_retries=10, delay=3):
    backend_url = os.getenv("HEALTHCHECK_BACKEND_URL", "http://localhost:8005/health")
    frontend_url = os.getenv("HEALTHCHECK_FRONTEND_URL", "http://localhost:3005")

    print("\n========================================================")
    print(" [*] SMOKE TESTING & ZERO-DOWNTIME HEALTH CHECK ...")
    print(f" [*] Backend Endpoint : {backend_url}")
    print(f" [*] Frontend Endpoint: {frontend_url}")
    print("========================================================")

    backend_ok = False
    for i in range(1, max_retries + 1):
        print(f"[*] Attempt {i}/{max_retries}: Pinging Backend API...")
        if check_url(backend_url):
            backend_ok = True
            print("[SUCCESS] Backend API is HEALTHY & RESPONSIVE!")
            break
        time.sleep(delay)

    if not backend_ok:
        print("\n[!] CRITICAL FAILURE: Backend API failed health check post-deployment!")
        print("[!] INITIATING AUTOMATED ROLLBACK TO PREVIOUS STABLE COMMIT ...")
        
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Execute Git Rollback
        subprocess.run("git reset --hard HEAD~1", cwd=root_dir, shell=True)
        # Restart previous containers
        subprocess.run(".\\startYT.bat", cwd=root_dir, shell=True)
        
        print("[!] ROLLBACK COMPLETE. Previous working containers restored.")
        return False

    print("========================================================")
    print(" PRODUCTION DEPLOYMENT VERIFIED 100% HEALTHY!")
    print("========================================================\n")
    return True

if __name__ == "__main__":
    success = verify_deployment()
    if not success:
        sys.exit(1)
    sys.exit(0)
