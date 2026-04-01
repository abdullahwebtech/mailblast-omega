import smtplib
from email.message import EmailMessage

def test_smtp_send(host, port, user, pwd, to_email, subject, body):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = user
        msg['To'] = to_email
        msg.set_content(body)

        print(f"Connecting to {host}:{port}...")
        server = smtplib.SMTP(host, port, timeout=10)
        server.starttls()
        server.login(user, pwd)
        print("Sending email...")
        server.send_message(msg)
        server.quit()
        print("\n✅ SUCCESS: Email sent to", to_email)
    except Exception as e:
        print("\n❌ FAILED to send email:")
        print(str(e))

if __name__ == "__main__":
    print("="*40)
    print("  OMEGA TEST SENDER (Standalone)")
    print("="*40)
    smtp_host = input("SMTP Host (e.g. smtp.gmail.com): ").strip()
    smtp_port = int(input("SMTP Port (e.g. 587): ").strip() or "587")
    smtp_user = input("Email / Username: ").strip()
    smtp_pass = input("Password / App Password: ").strip()
    to_email  = input("Recipient Email to test sending to: ").strip()
    
    test_smtp_send(smtp_host, smtp_port, smtp_user, smtp_pass, to_email, "Test from OMEGA", "If you receive this, the SMTP configuration is working perfectly.")
