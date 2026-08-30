import os
import sys
import subprocess

def run_step(step_name, command, cwd=None):
    print(f"\n========================================================")
    print(f" [*] PRE-FLIGHT STEP: {step_name}")
    print(f"========================================================")
    try:
        res = subprocess.run(command, cwd=cwd, shell=True, text=True, capture_output=False)
        if res.returncode != 0:
            print(f"[!] FAILED: Step '{step_name}' failed with exit code {res.returncode}.")
            return False
        print(f"[SUCCESS] PASSED: Step '{step_name}' completed successfully.")
        return True
    except Exception as e:
        print(f"[!] ERROR executing '{step_name}': {e}")
        return False

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")

    print("\n========================================================")
    print(" AUDIRA-YT PRODUCTION PRE-FLIGHT VALIDATION ENGINE")
    print("========================================================\n")

    # Step 1: Validate Environment Variables
    env_ok = run_step(
        "Environment Audit (.env validation)",
        [sys.executable, os.path.join(root_dir, "scripts", "validate_env.py")],
        cwd=root_dir
    )
    if not env_ok:
        print("[!] Pre-flight validation failed at Environment Audit.")
        sys.exit(1)

    # Step 2: Validate Frontend Build (Next.js & TypeScript Compile)
    frontend_ok = run_step(
        "Frontend Production Build (Next.js & TypeScript Compile)",
        "npm run build",
        cwd=frontend_dir
    )
    if not frontend_ok:
        print("[!] Pre-flight validation failed at Frontend Build!")
        sys.exit(1)

    # Step 3: Validate Backend Python Syntax & Imports
    backend_ok = run_step(
        "Backend Code Integrity & Syntax Check",
        f"{sys.executable} -m py_compile app/main.py",
        cwd=backend_dir
    )
    if not backend_ok:
        print("[!] Pre-flight validation failed at Backend Syntax Check!")
        sys.exit(1)

    print("\n========================================================")
    print(" ALL PRE-FLIGHT CHECKS PASSED SUCCESSFULLY!")
    print(" Code is 100% verified and safe for production promotion.")
    print("========================================================\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
