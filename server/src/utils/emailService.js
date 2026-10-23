const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

let transporter = null;

// Initialize mail transporter
const initTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[EmailService] SMTP transporter initialized for host:', process.env.SMTP_HOST);
  } else {
    // Development fallback: ethereal / simulated logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[EmailService] Development Ethereal SMTP test account initialized:', testAccount.user);
    } catch (e) {
      console.log('[EmailService] Running in simulated log-only email mode.');
      transporter = null;
    }
  }
};

initTransporter();

/**
 * Send Booking Confirmation Email with QR tickets
 * @param {Object} param0 
 * @returns {Promise<{ success: boolean, messageId?: string, previewUrl?: string }>}
 */
const sendBookingConfirmationEmail = async ({ booking, user, tickets, event }) => {
  try {
    if (!booking || !user?.email) {
      return { success: false, reason: 'Missing booking or recipient email' };
    }

    const eventTitle = event?.title || 'Your Booked Event';
    const eventDate = event?.startDateTime
      ? new Date(event.startDateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'TBA';
    const eventVenue = `${event?.venue || 'Venue'}, ${event?.city || 'City'}`;

    // Prepare QR attachments and inline HTML
    const attachments = [];
    const ticketHtmlCards = [];

    const ticketList = Array.isArray(tickets) && tickets.length > 0 ? tickets : [];

    for (let i = 0; i < ticketList.length; i++) {
      const t = ticketList[i];
      const qrDataUrl = await QRCode.toDataURL(t.qrData || t.ticketCode || 'TBS-TICKET', {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      // Convert data URL to base64 buffer for inline CID attachment
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const cid = `ticket_qr_${i}`;

      attachments.push({
        filename: `ticket-${t.ticketCode}.png`,
        content: Buffer.from(base64Data, 'base64'),
        cid
      });

      ticketHtmlCards.push(`
        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px; background-color: #f8fafc; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; letter-spacing: 1px;">
            ${t.ticketTypeName || 'General Admission'}
          </div>
          <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #1e1b4b; margin: 6px 0 12px;">
            ${t.ticketCode}
          </div>
          <img src="cid:${cid}" alt="QR Ticket Code" style="width: 150px; height: 150px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;" />
          <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
            Present this QR code at the venue gate for instant admission
          </div>
        </div>
      `);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #312e81 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
          .body { padding: 32px 24px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Booking Confirmed & Paid</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Your Event Pass is Ready!</h1>
            <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 14px;">Reference ID: #${(booking._id || '').slice(-8).toUpperCase()}</p>
          </div>
          <div class="body">
            <h2 style="font-size: 18px; margin: 0 0 8px; color: #0f172a;">${eventTitle}</h2>
            <div style="font-size: 13px; color: #475569; margin-bottom: 24px; line-height: 1.6;">
              📅 <strong>When:</strong> ${eventDate}<br />
              📍 <strong>Where:</strong> ${eventVenue}<br />
              👤 <strong>Attendee:</strong> ${user.name} (${user.email})<br />
              💳 <strong>Total Paid:</strong> $${booking.totalAmount}
            </div>

            <div style="border-top: 1px dashed #cbd5e1; margin: 24px 0;"></div>

            <h3 style="font-size: 14px; text-transform: uppercase; font-weight: bold; color: #334155; margin-bottom: 16px; letter-spacing: 0.5px;">
              Your Admission Ticket(s) (${ticketList.length})
            </h3>

            ${ticketHtmlCards.join('')}

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px; font-size: 12px; color: #1e40af; text-align: center; margin-top: 24px;">
              🛡️ <strong>Tamper-Proof Gate Validation:</strong> Each ticket QR code is cryptographically signed and valid for single gate entry.
            </div>
          </div>
          <div class="footer">
            Ticket Booking System (TBS) • Thank you for booking with us!<br />
            Need help? Contact the organizer or reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    if (!transporter) {
      console.log(`[EmailService Simulated] Confirmation email would be sent to: ${user.email} with ${ticketList.length} tickets.`);
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"TBS Events" <noreply@tbs-events.com>',
      to: user.email,
      subject: `🎟️ Your Tickets for ${eventTitle} (Ref: #${(booking._id || '').slice(-8).toUpperCase()})`,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`[EmailService] Booking confirmation email dispatched to ${user.email} (Message ID: ${info.messageId})`);
    if (previewUrl) {
      console.log(`[EmailService] Ethereal Email Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('[EmailService Error]:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail
};
