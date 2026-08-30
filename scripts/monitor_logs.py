import os
import sys
import time
import argparse
from datetime import datetime

# ANSI Color Codes for Terminal Output
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
WHITE = "\033[97m"
BG_RED = "\033[41m\033[97m\033[1m"
BG_YELLOW = "\033[43m\033[30m\033[1m"
BG_GREEN = "\033[42m\033[30m\033[1m"
BG_CYAN = "\033[46m\033[30m\033[1m"

def colorize_line(line: str) -> str:
    upper = line.upper()
    if "ERROR" in upper or "CRITICAL" in upper or "FAIL" in upper or "EXCEPTION" in upper or "TRACEBACK" in upper:
        return f"{BG_RED} 🚨 ERROR {RESET} {RED}{line}{RESET}"
    elif "WARN" in upper or "WARNING" in upper or "DEGRADED" in upper:
        return f"{BG_YELLOW} ⚠️ WARN  {RESET} {YELLOW}{line}{RESET}"
    elif "SUCCESS" in upper or "HEALTHY" in upper or "PASSED" in upper or "200 OK" in upper:
        return f"{BG_GREEN} ✅ OK    {RESET} {GREEN}{line}{RESET}"
    elif "AUTO-SYNC" in upper or "YOUTUBE" in upper or "SYNC" in upper or "TELEGRAM" in upper:
        return f"{BG_CYAN} 🔄 SYNC  {RESET} {CYAN}{line}{RESET}"
    else:
        return f"{BLUE}[LOG]{RESET} {WHITE}{line}{RESET}"

def main():
    parser = argparse.ArgumentParser(description="Audira YT - Real-Time Terminal Log Streamer")
    parser.add_argument("--errors-only", action="store_true", help="Monitor only ERROR and WARNING log lines")
    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_dir = os.path.join(root_dir, "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "audira_backend.log")

    # Enable ANSI terminal colors on Windows CMD/PowerShell
    if os.name == 'nt':
        os.system('color')

    print("\033[2J\033[H", end="") # Clear screen
    print(f"{BG_CYAN} ========================================================================= {RESET}")
    print(f"{BG_CYAN}   AUDIRA YT MONITOR - REAL-TIME TERMINAL LOG ENGINE                       {RESET}")
    print(f"{BG_CYAN} ========================================================================= {RESET}")
    print(f"{BOLD}Log File Target:{RESET} {log_file}")
    print(f"{BOLD}Filter Mode:{RESET} {'🚨 ERRORS & WARNINGS ONLY' if args.errors_only else '🌐 ALL SYSTEM LOGS'}")
    print(f"{BOLD}Press CTRL+C anytime to stop monitoring.{RESET}\n")
    print(f"{CYAN}--- WAITING FOR SYSTEM LOG EVENTS (LIVE TAIL) ---{RESET}\n")

    error_count = 0
    warn_count = 0
    total_lines = 0

    if not os.path.exists(log_file):
        with open(log_file, "w", encoding="utf-8") as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [INFO] [audira]: Log monitoring initialized cleanly.\n")

    try:
        with open(log_file, "r", encoding="utf-8", errors="replace") as f:
            # Move pointer to end of file to tail only new logs
            f.seek(0, os.SEEK_END)
            
            while True:
                line = f.readline()
                if not line:
                    time.sleep(0.3)
                    continue

                line_str = line.strip()
                if not line_str:
                    continue

                upper = line_str.upper()
                is_error = "ERROR" in upper or "CRITICAL" in upper or "FAIL" in upper or "EXCEPTION" in upper or "TRACEBACK" in upper
                is_warn = "WARN" in upper or "WARNING" in upper

                if is_error:
                    error_count += 1
                if is_warn:
                    warn_count += 1
                total_lines += 1

                if args.errors_only and not (is_error or is_warn):
                    continue

                print(colorize_line(line_str))
                sys.stdout.flush()

    except KeyboardInterrupt:
        print(f"\n\n{BG_CYAN} ========================================================================= {RESET}")
        print(f"{BOLD}LOG MONITORING STOPPED.{RESET}")
        print(f"📊 {BOLD}Session Stats:{RESET} Total Lines: {total_lines} | {RED}Errors: {error_count}{RESET} | {YELLOW}Warnings: {warn_count}{RESET}")
        print(f"{BG_CYAN} ========================================================================= {RESET}\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n{RED}[!] Error reading log file: {e}{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
