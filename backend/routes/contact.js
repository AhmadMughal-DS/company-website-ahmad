// ============================================================
// AHMAD & CO. — Contact Route
// POST /api/contact
// ============================================================

const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const LEADS_FILE = path.join(__dirname, '../data/leads.json');

// ── Helper: save lead to JSON file ───────────────────────────
function saveLead(data) {
  let leads = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    }
  } catch (e) { leads = []; }

  leads.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...data
  });

  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// ── Helper: send email notification ──────────────────────────
async function sendNotification(data) {
  // If no email config, skip silently
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📝 Email not configured. Lead saved to file only.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Gmail App Password
    }
  });

  const mailOptions = {
    from: `"AHMAD & CO. Website" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'hello@ahmadco.tech',
    subject: `🔔 New Lead: ${data.name} — ${data.service || 'General Inquiry'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; background: #0d1628; color: #f0ece0; padding: 32px; border-radius: 12px; border: 1px solid #C9A84C33;">
        <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">AHMAD &amp; CO.</h1>
          <p style="color: #a8a090; margin: 4px 0 0;">New consultation request received</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #a8a090; width: 140px;">Name:</td>
              <td style="padding: 8px 0; font-weight: bold;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #a8a090;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #C9A84C;">${data.email}</a></td></tr>
          ${data.phone ? `<tr><td style="padding: 8px 0; color: #a8a090;">Phone:</td>
              <td style="padding: 8px 0;">${data.phone}</td></tr>` : ''}
          ${data.company ? `<tr><td style="padding: 8px 0; color: #a8a090;">Company:</td>
              <td style="padding: 8px 0;">${data.company}</td></tr>` : ''}
          ${data.country ? `<tr><td style="padding: 8px 0; color: #a8a090;">Country:</td>
              <td style="padding: 8px 0;">${data.country}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #a8a090;">Service:</td>
              <td style="padding: 8px 0; color: #C9A84C; font-weight: bold;">${data.service || 'Not specified'}</td></tr>
        </table>

        ${data.message ? `
        <div style="margin-top: 24px; padding: 16px; background: rgba(201,168,76,0.06); border-left: 3px solid #C9A84C; border-radius: 4px;">
          <p style="color: #a8a090; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; line-height: 1.7;">${data.message.replace(/\n/g, '<br>')}</p>
        </div>` : ''}

        <p style="margin-top: 32px; color: #5a5448; font-size: 12px;">
          Received: ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} GST
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Email notification sent for lead: ${data.name}`);
}

// ── POST /api/contact ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, country, service, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || '',
      phone: phone?.trim() || '',
      country: country?.trim() || '',
      service: service?.trim() || '',
      message: message.trim()
    };

    // Save lead & send notification (non-blocking for email)
    saveLead(leadData);
    sendNotification(leadData).catch(err => {
      console.error('Email notification failed:', err.message);
    });

    console.log(`✅ New lead: ${leadData.name} <${leadData.email}> [${leadData.service}]`);

    return res.json({
      success: true,
      message: 'Thank you! We\'ll be in touch within 24 hours.'
    });

  } catch (error) {
    console.error('Contact route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again or email us directly.'
    });
  }
});

// ── GET /api/contact (admin: list leads) ─────────────────────
router.get('/leads', (req, res) => {
  // Simple token protection
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    if (!fs.existsSync(LEADS_FILE)) {
      return res.json({ success: true, leads: [], total: 0 });
    }
    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    res.json({ success: true, leads: leads.reverse(), total: leads.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error reading leads' });
  }
});

module.exports = router;
