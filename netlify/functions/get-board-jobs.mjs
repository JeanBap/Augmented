import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  const url    = new URL(req.url);
  const params = url.searchParams;

  const keyword  = (params.get('keyword')  || '').trim().toLowerCase();
  const source   = (params.get('source')   || '').trim().toLowerCase();
  const remoteQ  = params.get('remote');
  const typeQ    = (params.get('type')     || '').trim().toLowerCase();
  const locationQ= (params.get('location') || '').trim().toLowerCase();
  const page     = Math.max(1, parseInt(params.get('page')  || '1', 10));
  const limit    = Math.min(500, Math.max(1, parseInt(params.get('limit') || '10', 10)));

  try {
    const store = getStore('job-board');
    const blob  = await store.get('all-jobs', { type: 'json' });

    if (!blob || !blob.jobs) {
      return new Response(JSON.stringify({
        jobs: [], total: 0, page: 1, totalPages: 0,
        remoteCount: 0, fetchedAt: null,
      }), { status: 200, headers });
    }

    let jobs = blob.jobs;

    /* ─── Filtering ─── */
    if (keyword) {
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(keyword) ||
        j.company.toLowerCase().includes(keyword) ||
        (j.description || '').toLowerCase().includes(keyword) ||
        (j.location    || '').toLowerCase().includes(keyword)
      );
    }

    if (source) {
      jobs = jobs.filter(j => (j.source || '').toLowerCase().includes(source));
    }

    if (remoteQ === 'true') {
      jobs = jobs.filter(j => j.remote === true);
    } else if (remoteQ === 'false') {
      jobs = jobs.filter(j => j.remote === false);
    }

    if (typeQ) {
      jobs = jobs.filter(j => (j.type || '').toLowerCase().includes(typeQ));
    }

    if (locationQ) {
      jobs = jobs.filter(j => (j.location || '').toLowerCase().includes(locationQ));
    }

    /* ─── Sort by posted_date desc ─── */
    jobs.sort((a, b) => {
      const da = a.posted_date ? new Date(a.posted_date) : new Date(0);
      const db = b.posted_date ? new Date(b.posted_date) : new Date(0);
      return db - da;
    });

    /* ─── Pagination ─── */
    const total       = jobs.length;
    const remoteCount = blob.jobs.filter(j => j.remote).length;
    const totalPages  = Math.ceil(total / limit);
    const offset      = (page - 1) * limit;
    const paginated   = jobs.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      jobs:        paginated,
      total,
      page,
      totalPages,
      remoteCount,
      fetchedAt:   blob.fetchedAt || null,
    }), { status: 200, headers });

  } catch (e) {
    console.error('[get-board-jobs] Error:', e.message);
    return new Response(JSON.stringify({
      jobs: [], total: 0, page: 1, totalPages: 0,
      remoteCount: 0, fetchedAt: null,
      error: 'Failed to load jobs',
    }), { status: 200, headers });
  }
};
