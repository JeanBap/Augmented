import { getStore } from '@netlify/blobs';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Lightweight Resend email sender (mirrors notify.js pattern)
async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[post-job] RESEND_API_KEY not set, skipping email');
    return { sent: false, reason: 'no_api_key' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Raise Ready <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error('[post-job] Resend error:', res.status, await res.text());
    return { sent: false, reason: 'api_error' };
  }
  return { sent: true };
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }

  const { title, company, location, type, salary, url, email, description, stripeSessionId } = body;

  // Validate required fields
  if (!title || !company || !url || !email || !description) {
    return new Response(JSON.stringify({ error: 'Missing required fields: title, company, url, email, description' }), { status: 400, headers: CORS_HEADERS });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400, headers: CORS_HEADERS });
  }

  const now = new Date().toISOString();
  const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const listing = {
    id,
    title: title.trim(),
    company: company.trim(),
    location: (location || 'Remote').trim(),
    type: type || 'full-time',
    salary: (salary || '').trim(),
    apply_url: url.trim(),
    contact_email: email.trim().toLowerCase(),
    description: description.trim(),
    stripe_session_id: stripeSessionId || null,
    status: 'pending_review',
    posted_date: now,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
    created_at: now,
  };

  try {
    // Store in Netlify Blobs
    const store = getStore('job-postings');
    await store.setJSON(id, listing);

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'papoutsis89@gmail.com';
    await sendEmail(adminEmail, `New Job Posting: ${esc(title)} at ${esc(company)}`, `
      <h2>New Job Listing Submitted</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Title</td><td>${esc(title)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Company</td><td>${esc(company)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Location</td><td>${esc(location || 'Remote')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Type</td><td>${esc(type)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Salary</td><td>${esc(salary || 'Not specified')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Apply URL</td><td><a href="${esc(url)}">${esc(url)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Contact</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Stripe Session</td><td>${esc(stripeSessionId || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Expires</td><td>${listing.expires_at}</td></tr>
      </table>
      <h3>Description</h3>
      <p style="white-space:pre-wrap;">${esc(description)}</p>
      <p style="margin-top:1rem;font-size:0.85rem;color:#666;">Review and approve this listing to make it live on the job board.</p>
    `);

    // Send confirmation to the poster
    await sendEmail(email, 'Your job listing has been submitted', `
      <h2>Thanks for posting on Raise Ready</h2>
      <p>Your listing for <strong>${esc(title)}</strong> at <strong>${esc(company)}</strong> has been received.</p>
      <p>We'll review and publish it within 24 hours. Your listing will be live for 3 months.</p>
      <p style="margin-top:1rem;font-size:0.85rem;color:#666;">If you have any questions, reply to this email.</p>
    `);

    return new Response(JSON.stringify({ ok: true, id, message: 'Listing submitted successfully' }), { status: 200, headers: CORS_HEADERS });
  } catch (e) {
    console.error('[post-job] Error:', e.message);
    return new Response(JSON.stringify({ error: 'Failed to save listing' }), { status: 500, headers: CORS_HEADERS });
  }
};
