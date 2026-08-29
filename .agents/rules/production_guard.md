# Strict Rule: Isolated Production Deployment Gate

## Rule Summary
The AI Assistant and automated scripts are **STRICTLY PROHIBITED** from automatically pushing code to the production Mini PC Server (`192.168.100.178`) or executing remote SSH container reloads during normal development sessions.

## Mandatory Constraints
1. **Local Development Only:**
   - All code modifications, UI enhancements, feature additions, and debugging MUST remain strictly within the local environment / `dev` branch on the user's laptop.
   - Local testing must be performed via `startYT.bat` / `http://localhost:3005`.

2. **Isolated Production Server Gate:**
   - The Production Mini PC Server (`192.168.100.178`) runs 24/7 on the isolated `main` branch.
   - **NO AUTOMATIC DEPLOYMENT:** The AI Assistant MUST NEVER trigger SSH deployment to `192.168.100.178` automatically after making code edits.

3. **Explicit User Trigger:**
   - Deployment to the Mini PC Server ONLY occurs when the user explicitly double-clicks **`DEPLOY_TO_PROD.bat`** or explicitly requests *"deploy to production"*.
