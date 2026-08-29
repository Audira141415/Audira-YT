# Workspace Rules & Development Constraints

## Production Deployment Safety Gate (CRITICAL)
- **STRICT ISOLATION:** All code changes and feature developments MUST stay inside the `dev` branch on the local laptop.
- **NO AUTOMATIC SERVER DEPLOYMENT:** Never trigger SSH deployment to Mini PC Server (`192.168.100.178`) automatically.
- **EXPLICIT USER TRIGGER ONLY:** Production deployment to Mini PC Server ONLY occurs when the user manually executes `DEPLOY_TO_PROD.bat` or explicitly requests production release.
