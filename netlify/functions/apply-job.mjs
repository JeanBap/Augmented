import { getStore } from '@netlify/blobs';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

  const { jobId, applicantEmail, jobTitle, company, appliedAt } = body;

  if (!jobId || !applicantEmail) {
    return new Response(JSON.stringify({ error: 'jobId and applicantEmail are required' }), { status: 400, headers: CORS_HEADERS });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return new Response(JSON.stringify({ error: 'Invalid applicant email' }), { status: 400, headers: CORS_HEADERS });
  }

  const application = {
    jobId,
    applicantEmail: applicantEmail.trim().toLowerCase(),
    jobTitle:       (jobTitle || '').trim(),
    company:        (company  || '').trim(),
    appliedAt:      appliedAt || new Date().toISOString(),
    createdAt:      new Date().toISOString(),
  };

  // Key: jobId__email (sanitised)
  const safeEmail = applicantEmail.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
  const safeJob   = String(jobId).replace(/[^a-z0-9_-]/gi, '_');
  const key       = `${safeJob}__${safeEmail}`;

  try {
    const store = getStore('job-applications');
    await store.setJSON(key, application);

    return new Response(JSON.stringify({
      ok:      true,
      message: 'Application recorded',
      key,
    }), { status: 200, headers: CORS_HEADERS });
  } catch (e) {
    console.error('[apply-job] Error:', e.message);
    return new Response(JSON.stringify({ error: 'Failed to save application' }), { status: 500, headers: CORS_HEADERS });
  }
};
