import { getStore } from '@netlify/blobs';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function emailKey(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS_HEADERS });
  }

  const store = getStore('applicant-profiles');

  /* ─── POST: save / update profile ─── */
  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
    }

    const { name, email, phone, linkedin, summary, cvBase64, cvFilename } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers: CORS_HEADERS });
    }

    const profile = {
      name:       (name       || '').trim(),
      email:      email.trim().toLowerCase(),
      phone:      (phone      || '').trim(),
      linkedin:   (linkedin   || '').trim(),
      summary:    (summary    || '').trim(),
      cvBase64:   cvBase64   || null,
      cvFilename: cvFilename || null,
      updatedAt:  new Date().toISOString(),
    };

    try {
      await store.setJSON(emailKey(email), profile);
      return new Response(JSON.stringify({ ok: true, message: 'Profile saved' }), { status: 200, headers: CORS_HEADERS });
    } catch (e) {
      console.error('[applicant-profile] POST error:', e.message);
      return new Response(JSON.stringify({ error: 'Failed to save profile' }), { status: 500, headers: CORS_HEADERS });
    }
  }

  /* ─── GET: retrieve profile by email ─── */
  if (req.method === 'GET') {
    const url   = new URL(req.url);
    const email = url.searchParams.get('email') || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email query param required' }), { status: 400, headers: CORS_HEADERS });
    }

    try {
      const profile = await store.get(emailKey(email), { type: 'json' });
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: CORS_HEADERS });
      }
      // Strip CV data from GET response for size
      const { cvBase64: _, ...safe } = profile;
      return new Response(JSON.stringify(safe), { status: 200, headers: CORS_HEADERS });
    } catch (e) {
      console.error('[applicant-profile] GET error:', e.message);
      return new Response(JSON.stringify({ error: 'Failed to retrieve profile' }), { status: 500, headers: CORS_HEADERS });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
};
