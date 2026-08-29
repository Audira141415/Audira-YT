# Security Policy & Vulnerability Disclosure

## Supported Versions

Only the latest version of **Audira YT Monitor** is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Security is a top priority for **Audira Digital Network**. If you discover a security vulnerability within this repository, please send an email to **Agus Dwi Rianto** at `audirasuksesmandiri@gmail.com`.

Please include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any suggested fixes or mitigation strategies.

All security reports will be acknowledged within 24 hours, and a resolution plan will be communicated promptly.

## Data Encryption & OAuth Token Safety

- All OAuth Client Secrets and Refresh Tokens stored in PostgreSQL are encrypted using **Fernet 32-byte AES Encryption**.
- Environment credential files (`.env`, `.env.local`) are strictly excluded from git tracking via `.gitignore`.
