// ============================================================
// AHMAD & CO. — Contact Route
// POST /api/contact  — Submit lead & send email notification
// GET  /api/contact/leads — Admin: list all leads (token-protected)
// Security: input validation, length limits, HTML sanitization
// ============================================================

const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');

const LEADS_FILE = path.join(__dirname, '../data/leads.json');

// ── Field length constraints ──────────────────────────────────
const LIMITS = {
  name:    { min: 2,  max: 100 },
  email:   { min: 5,  max: 254 },
  company: { min: 0,  max: 200 },
  phone:   { min: 0,  max: 30  },
  country: { min: 0,  max: 100 },
  service: { min: 0,  max: 100 },
  message: { min: 10, max: 2000 }
};

// ── Sanitize: strip HTML tags to prevent injection in emails ──
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ── Helper: validate and sanitize all fields ─────────────────
function validateInput(body) {
  const errors = [];
  const { name, email, company, phone, country, service, message } = body;

  // Required fields
  if (!name || typeof name !== 'string')    errors.push('Name is required.');
  if (!email || typeof email !== 'string')  errors.push('Email is required.');
  if (!message || typeof message !== 'string') errors.push('Message is required.');

  // Length checks
  for (const [field, limits] of Object.entries(LIMITS)) {
    const value = body[field];
    if (!value && limits.min === 0) continue; // optional empty is fine
    if (value) {
      if (value.length < limits.min) errors.push(`${field} must be at least ${limits.min} characters.`);
      if (value.length > limits.max) errors.push(`${field} must be at most ${limits.max} characters.`);
    }
  }

  // Email format
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (email && !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  // Phone: only digits, spaces, +, -, () allowed
  if (phone && !/^[\d\s\+\-\(\)]+$/.test(phone.trim())) {
    errors.push('Phone number contains invalid characters.');
  }

  return errors;
}

// ── Helper: save lead to JSON file ───────────────────────────
function saveLead(data) {
  let leads = [];
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      leads = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading leads file:', e.message);
    leads = [];
  }

  leads.push({
    id: crypto.randomUUID(),         // Secure UUID instead of Date.now()
    timestamp: new Date().toISOString(),
    ip: data._ip || 'unknown',       // For audit log
    ...data,
    _ip: undefined                   // Strip internal field from stored data
  });

  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), { mode: 0o600 }); // Restrict file permissions
}

// ── Helper: send email notification ──────────────────────────
async function sendNotification(data) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📝 Email not configured. Lead saved to file only.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // All user data is already HTML-escaped at this point
  const mailOptions = {
    from: `"AHMAD & CO. Website" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'ahmad.dstech@gmail.com',
    replyTo: data.email,  // Allow direct reply to client
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
          <p style="margin: 0; line-height: 1.7; white-space: pre-wrap;">${data.message}</p>
        </div>` : ''}

        <p style="margin-top: 32px; color: #5a5448; font-size: 12px;">
          Received: ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} GST
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Notification sent → ${data.name} <${data.email}>`);
}

// ── POST /api/contact ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, country, service, message } = req.body;

    // Validate all inputs
    const errors = validateInput({ name, email, company, phone, country, service, message });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    // Sanitize all string fields (HTML-escape to prevent injection in emails)
    const leadData = {
      name:    stripHtml(name.trim()),
      email:   email.trim().toLowerCase(),          // Email kept as-is for mailto links
      company: stripHtml(company?.trim() || ''),
      phone:   phone?.trim().replace(/[^\d\s\+\-\(\)]/g, '') || '',  // Strip non-phone chars
      country: stripHtml(country?.trim() || ''),
      service: stripHtml(service?.trim() || ''),
      message: stripHtml(message.trim()),
      _ip:     req.ip                               // For internal audit only
    };

    // Save lead & send notification (non-blocking)
    saveLead(leadData);
    sendNotification(leadData).catch(err => {
      console.error('Email notification failed:', err.message);
    });

    console.log(`✅ New lead: ${leadData.name} <${leadData.email}> [${leadData.service || 'General'}]`);

    return res.status(201).json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours."
    });

  } catch (error) {
    console.error('Contact route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again or email us directly.'
    });
  }
});

// ── GET /api/contact/leads — Admin: list all leads ────────────
router.get('/leads', (req, res) => {
  // Token must be sent in header (not query param — avoids URL logging)
  const token = req.headers['x-admin-token'];

  if (!token || !process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Constant-time comparison to prevent timing attacks
  const provided = Buffer.from(token);
  const expected = Buffer.from(process.env.ADMIN_TOKEN);

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    if (!fs.existsSync(LEADS_FILE)) {
      return res.json({ success: true, leads: [], total: 0 });
    }
    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    res.json({
      success: true,
      leads: leads.slice().reverse(),
      total: leads.length
    });
  } catch (e) {
    console.error('Error reading leads:', e.message);
    res.status(500).json({ success: false, message: 'Error reading leads' });
  }
});

module.exports = router;
