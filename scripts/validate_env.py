import os
import sys

def validate_environment(env_file=".env", example_file=".env.example", strict=False):
    print("========================================================")
    print(" [*] AUDITING ENVIRONMENT CONFIGURATION (.env) ...")
    print("========================================================")
    
    if not os.path.exists(env_file):
        print(f"[!] ERROR: Environment file '{env_file}' does not exist!")
        if strict:
            return False
        print("[!] Creating template '.env' from '.env.example'...")
        if os.path.exists(example_file):
            with open(example_file, "r") as f_in, open(env_file, "w") as f_out:
                f_out.write(f_in.read())
            print("[+] Created '.env' successfully.")
        else:
            print(f"[!] ERROR: Template file '{example_file}' not found.")
            return False

    required_keys = []
    if os.path.exists(example_file):
        with open(example_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key = line.split("=")[0].strip()
                    if key:
                        required_keys.append(key)

    env_vars = {}
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                parts = line.split("=", 1)
                env_vars[parts[0].strip()] = parts[1].strip()

    missing_keys = []
    placeholder_keys = []
    placeholders = ["your_google_client_id_here", "your_youtube_api_key_here", "generate_a_very_secure_secret_key_here", "your_ai_api_key_here"]

    for key in required_keys:
        if key not in env_vars or not env_vars[key]:
            missing_keys.append(key)
        elif any(p in env_vars[key] for p in placeholders):
            placeholder_keys.append((key, env_vars[key]))

    if missing_keys:
        print(f"[!] WARNING: The following required keys are missing in '{env_file}':")
        for k in missing_keys:
            print(f"    - {k}")

    if placeholder_keys:
        print(f"[!] WARNING: The following keys are using placeholder defaults:")
        for k, val in placeholder_keys:
            print(f"    - {k}: {val}")

    if missing_keys and strict:
        print("[!] AUDIT FAILED: Missing critical environment keys.")
        return False

    print("[SUCCESS] ENVIRONMENT AUDIT PASSED CLEANLY!")
    print("========================================================\n")
    return True

if __name__ == "__main__":
    is_strict = "--strict" in sys.argv
    success = validate_environment(strict=is_strict)
    if not success:
        sys.exit(1)
    sys.exit(0)
