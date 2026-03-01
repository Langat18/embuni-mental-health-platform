import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def send_email(to_email: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")


def send_new_ticket_notification(counselor_email: str, counselor_name: str, student_name: str, ticket_number: str, category: str, initial_message: str):
    subject = f"New Counseling Request — {ticket_number}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1d4ed8; font-size: 20px; margin: 0;">University of Embu</h1>
                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Mental Health Counselling Platform</p>
            </div>

            <p style="color: #111827; font-size: 16px;">Dear {counselor_name},</p>

            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                A student has initiated a counseling session and has been assigned to you. Please log in to respond at your earliest convenience.
            </p>

            <div style="background-color: #eff6ff; border-left: 4px solid #1d4ed8; border-radius: 4px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Ticket Details</p>
                <p style="margin: 4px 0; font-size: 14px; color: #111827;"><strong>Ticket:</strong> {ticket_number}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #111827;"><strong>Student:</strong> {student_name}</p>
                <p style="margin: 4px 0; font-size: 14px; color: #111827;"><strong>Category:</strong> {category}</p>
            </div>

            <div style="background-color: #f3f4f6; border-radius: 4px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Initial Message</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; font-style: italic;">"{initial_message}"</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
                <a href="{settings.FRONTEND_URL}/counselor/dashboard" 
                   style="background-color: #1d4ed8; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                    View in Dashboard
                </a>
            </div>

            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                University of Embu Mental Health Platform &mdash; This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
    """

    send_email(counselor_email, subject, html_body)