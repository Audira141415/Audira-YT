import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
import httpx

class EmailService:
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Send transactional HTML emails via SMTP or REST API (Resend / SendGrid / AWS SES).
        """
        sender = from_email or os.getenv("SMTP_FROM_EMAIL", "noreply@audirayt.com")
        resend_api_key = os.getenv("RESEND_API_KEY", "")

        # Option A: Resend API (Preferred for modern SaaS)
        if resend_api_key and resend_api_key != "your_resend_api_key_here":
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.resend.com/emails",
                        headers={"Authorization": f"Bearer {resend_api_key}"},
                        json={
                            "from": sender,
                            "to": [to_email],
                            "subject": subject,
                            "html": html_content
                        }
                    )
                    if resp.status_code in (200, 201):
                        print(f"[EmailService]: Sent email to {to_email} via Resend API.")
                        return True
            except Exception as e:
                print(f"[EmailService Resend Error]: {e}")

        # Option B: Standard SMTP Fallback
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")

        if smtp_host and smtp_host != "your_smtp_host_here":
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = sender
                msg["To"] = to_email
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(sender, [to_email], msg.as_string())
                print(f"[EmailService]: Sent email to {to_email} via SMTP.")
                return True
            except Exception as e:
                print(f"[EmailService SMTP Error]: {e}")

        # Development Fallback: Print email to console
        print(f"[EmailService DEV MOCK]: Email to '{to_email}' | Subject: '{subject}'")
        return True

    @staticmethod
    def get_password_reset_template(user_name: str, reset_link: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 2px solid #000;">
            <h2 style="color: #000; margin-top: 0;">Reset Kata Sandi Audira-YT</h2>
            <p>Halo <strong>{user_name}</strong>,</p>
            <p>Kami menerima permintaan untuk mereset kata sandi akun Audira-YT Anda. Klik tombol di bawah untuk membuat kata sandi baru:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{reset_link}" style="background-color: #facc15; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px; border: 2px solid #000; display: inline-block;">Reset Kata Sandi</a>
            </div>
            <p style="font-size: 12px; color: #666;">Jika tombol tidak berfungsi, salin dan tempel tautan berikut di browser Anda:<br><a href="{reset_link}">{reset_link}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 11px; color: #888;">Tautan ini berlaku selama 60 menit. Jika Anda tidak meminta reset kata sandi, abaikan email ini.</p>
          </div>
        </body>
        </html>
        """
