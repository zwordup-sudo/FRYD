import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(email_to: str, token: str) -> bool:
    """Send a real HTML password reset email using SMTP credentials from env."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_username
    
    # Check if credentials are set
    if not (smtp_host and smtp_port and smtp_username and smtp_password):
        print("SMTP credentials not configured. Skipping email sending.")
        return False
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Restablece tu contraseña en FRYD"
        msg["From"] = smtp_from
        msg["To"] = email_to
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #080D18; color: #ffffff; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0d1527; padding: 30px; border-radius: 12px; border: 1px solid #1e2d4a;">
              <h2 style="color: #6366f1; margin-top: 0; font-size: 22px; text-align: center;">Restablece tu contraseña en FRYD</h2>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación temporal de un solo uso para continuar:
              </p>
              <div style="text-align: center; margin: 25px 0;">
                <div style="display: inline-block; padding: 12px 28px; background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; font-size: 26px; font-family: monospace; font-weight: bold; color: #a5b4fc; letter-spacing: 4px;">
                  {token}
                </div>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Este código expirará en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </p>
              <hr style="border: 0; border-top: 1px solid #1e2d4a; margin: 20px 0;">
              <p style="color: #64748b; font-size: 11px; text-align: center; margin-bottom: 0;">
                FRYD — Convierte intención en progreso.
              </p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))
        
        port = int(smtp_port)
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.starttls()
            
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_from, [email_to], msg.as_string())
        server.quit()
        print(f"Password reset email sent successfully to {email_to}")
        return True
    except Exception as e:
        print(f"Error sending reset email to {email_to}: {str(e)}")
        return False
