import { getStore } from '@netlify/blobs';

export const config = { schedule: '@weekly' };

/* ─── Helpers ─── */
function normalizeJob(raw) {
  return {
    id:           String(raw.id           || ''),
    title:        String(raw.title        || '').trim(),
    company:      String(raw.company      || '').trim(),
    location:     String(raw.location     || '').trim(),
    salary_min:   raw.salary_min   != null ? Number(raw.salary_min)   : null,
    salary_max:   raw.salary_max   != null ? Number(raw.salary_max)   : null,
    currency:     String(raw.currency     || 'USD'),
    type:         String(raw.type         || '').toLowerCase().trim(),
    remote:       Boolean(raw.remote),
    url:          String(raw.url          || ''),
    description:  String(raw.description  || '').trim(),
    posted_date:  raw.posted_date ? String(raw.posted_date) : new Date().toISOString().slice(0, 10),
    source:       String(raw.source       || ''),
  };
}

function dedup(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}__${job.company.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, job);
  }
  return [...seen.values()];
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/* ─── Source 1: Remotive ─── */
async function fetchRemotive() {
  try {
    const data = await fetchJson('https://remotive.com/api/remote-jobs?category=finance&limit=50');
    return (data.jobs || []).map(j => normalizeJob({
      id:          `remotive_${j.id}`,
      title:       j.title,
      company:     j.company_name,
      location:    j.candidate_required_location || 'Remote',
      salary_min:  null,
      salary_max:  null,
      currency:    'USD',
      type:        j.job_type || 'full-time',
      remote:      true,
      url:         j.url,
      description: j.description || '',
      posted_date: j.publication_date ? j.publication_date.slice(0, 10) : null,
      source:      'Remotive',
    }));
  } catch (e) {
    console.error('[fetch-all-jobs] Remotive failed:', e.message);
    return [];
  }
}

/* ─── Source 2: Arbeitnow ─── */
async function fetchArbeitnow() {
  try {
    const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
    const financeRe = /financ|fp&a|fp\s*&\s*a|cfo|accountant|revenue|analyst/i;
    return (data.data || [])
      .filter(j => financeRe.test(j.title) || financeRe.test(j.description || ''))
      .map(j => normalizeJob({
        id:          `arbeitnow_${j.slug}`,
        title:       j.title,
        company:     j.company_name,
        location:    j.location || 'Remote',
        remote:      j.remote || false,
        type:        j.job_types?.[0] || 'full-time',
        url:         j.url,
        description: j.description || '',
        posted_date: j.created_at ? new Date(j.created_at * 1000).toISOString().slice(0, 10) : null,
        source:      'Arbeitnow',
      }));
  } catch (e) {
    console.error('[fetch-all-jobs] Arbeitnow failed:', e.message);
    return [];
  }
}

/* ─── Source 3: Indeed RSS (XML) ─── */
async function fetchIndeedRSS() {
  try {
    const res = await fetch('https://www.indeed.com/rss?q=FP%26A&l=remote&limit=25', {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobBoardBot/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    return items.map((item, i) => {
      const get = tag => { const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)); return m ? (m[1] || m[2] || '').trim() : ''; };
      const title   = get('title');
      const link    = get('link');
      const desc    = get('description');
      const pubDate = get('pubDate');
      const company = get('source') || get('author') || 'Unknown';
      const postedDate = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null;
      return normalizeJob({
        id:          `indeed_${i}_${Date.now()}`,
        title,
        company,
        location:    'Remote',
        remote:      true,
        type:        'full-time',
        url:         link,
        description: desc.replace(/<[^>]+>/g, '').trim(),
        posted_date: postedDate,
        source:      'Indeed',
      });
    }).filter(j => j.title);
  } catch (e) {
    console.error('[fetch-all-jobs] Indeed RSS failed:', e.message);
    return [];
  }
}

/* ─── Source 4: HN Who's Hiring ─── */
async function fetchHNHiring() {
  try {
    // Get top stories to find the latest "Ask HN: Who is Hiring?" post
    const topStories = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty&limitToFirst=200&orderBy="$key"');
    // Also check new stories
    const newStories = await fetchJson('https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty');
    // Limit to first 30 to avoid sequential-fetch timeout
    const allIds = [...new Set([...(Array.isArray(topStories) ? topStories.slice(0,30) : []), ...(Array.isArray(newStories) ? newStories.slice(0,30) : [])])];

    let hiringPostId = null;
    for (const id of allIds) {
      try {
        const item = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (item && item.type === 'story' && /ask hn.*who.?s hiring/i.test(item.title || '')) {
          hiringPostId = id;
          break;
        }
      } catch { continue; }
    }

    if (!hiringPostId) {
      // Fallback: search recent Ask HN posts by known pattern (limit to 20)
      const askStories = await fetchJson('https://hacker-news.firebaseio.com/v0/askstories.json?print=pretty');
      for (const id of (askStories || []).slice(0, 20)) {
        try {
          const item = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (item && /who.?s hiring/i.test(item.title || '')) {
            hiringPostId = id;
            break;
          }
        } catch { continue; }
      }
    }

    if (!hiringPostId) return [];

    const post = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${hiringPostId}.json`);
    const kids  = (post.kids || []).slice(0, 100);
    const financeRe = /financ|fp&a|fp\s*&\s*a|cfo|accountant|revenue ops|analyst|controller/i;
    const jobs = [];

    await Promise.all(kids.map(async kid => {
      try {
        const comment = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${kid}.json`);
        const text = (comment.text || '').replace(/<[^>]+>/g, ' ');
        if (!financeRe.test(text)) return;
        // Try to extract title from first line
        const lines = text.split(/\n|\|/).map(l => l.trim()).filter(Boolean);
        const title   = lines[0] || 'Finance Role';
        const company = lines[1] || 'HN Company';
        jobs.push(normalizeJob({
          id:          `hn_${kid}`,
          title:       title.slice(0, 120),
          company:     company.slice(0, 80),
          location:    /remote/i.test(text) ? 'Remote' : 'Unknown',
          remote:      /remote/i.test(text),
          type:        /contract|freelance/i.test(text) ? 'contract' : 'full-time',
          url:         `https://news.ycombinator.com/item?id=${kid}`,
          description: text.slice(0, 2000),
          posted_date: post.time ? new Date(post.time * 1000).toISOString().slice(0, 10) : null,
          source:      'HN Hiring',
        }));
      } catch { /* skip bad comments */ }
    }));

    return jobs;
  } catch (e) {
    console.error('[fetch-all-jobs] HN Hiring failed:', e.message);
    return [];
  }
}

/* ─── Source 5: JSearch (RapidAPI) ─── */
async function fetchJSearch() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) { console.log('[fetch-all-jobs] JSearch skipped: RAPIDAPI_KEY not set'); return []; }
  try {
    const data = await fetchJson(
      'https://jsearch.p.rapidapi.com/search?query=FP%26A+remote&num_pages=1',
      { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' } },
    );
    return (data.data || []).map(j => normalizeJob({
      id:          `jsearch_${j.job_id}`,
      title:       j.job_title,
      company:     j.employer_name,
      location:    j.job_city ? `${j.job_city}, ${j.job_state || j.job_country}` : (j.job_country || 'Remote'),
      salary_min:  j.job_min_salary,
      salary_max:  j.job_max_salary,
      currency:    j.job_salary_currency || 'USD',
      type:        j.job_employment_type ? j.job_employment_type.toLowerCase() : 'full-time',
      remote:      j.job_is_remote || false,
      url:         j.job_apply_link || j.job_google_link || '',
      description: j.job_description || '',
      posted_date: j.job_posted_at_datetime_utc ? j.job_posted_at_datetime_utc.slice(0, 10) : null,
      source:      'JSearch',
    }));
  } catch (e) {
    console.error('[fetch-all-jobs] JSearch failed:', e.message);
    return [];
  }
}

/* ─── Source 6: Adzuna ─── */
async function fetchAdzuna() {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) { console.log('[fetch-all-jobs] Adzuna skipped: env vars not set'); return []; }
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=finance+analyst&results_per_page=50&content-type=application/json`;
    const data = await fetchJson(url);
    return (data.results || []).map(j => normalizeJob({
      id:          `adzuna_${j.id}`,
      title:       j.title,
      company:     j.company?.display_name || '',
      location:    j.location?.display_name || '',
      salary_min:  j.salary_min,
      salary_max:  j.salary_max,
      currency:    'USD',
      type:        j.contract_time || 'full-time',
      remote:      /remote/i.test(j.title + ' ' + (j.description || '')),
      url:         j.redirect_url || '',
      description: j.description || '',
      posted_date: j.created ? j.created.slice(0, 10) : null,
      source:      'Adzuna',
    }));
  } catch (e) {
    console.error('[fetch-all-jobs] Adzuna failed:', e.message);
    return [];
  }
}

/* ─── Source 7: Reed ─── */
async function fetchReed() {
  const key = process.env.REED_API_KEY;
  if (!key) { console.log('[fetch-all-jobs] Reed skipped: REED_API_KEY not set'); return []; }
  try {
    const creds = Buffer.from(`${key}:`).toString('base64');
    const data  = await fetchJson(
      'https://www.reed.co.uk/api/1.0/search?keywords=FP%26A&locationName=remote&resultsToTake=50',
      { headers: { Authorization: `Basic ${creds}` } },
    );
    return (data.results || []).map(j => normalizeJob({
      id:          `reed_${j.jobId}`,
      title:       j.jobTitle,
      company:     j.employerName,
      location:    j.locationName || 'Remote',
      salary_min:  j.minimumSalary,
      salary_max:  j.maximumSalary,
      currency:    'GBP',
      type:        j.contractType || 'full-time',
      remote:      /remote/i.test(j.locationName || ''),
      url:         j.jobUrl || `https://www.reed.co.uk/jobs/${j.jobId}`,
      description: j.jobDescription || j.snippet || '',
      posted_date: j.date ? new Date(j.date).toISOString().slice(0, 10) : null,
      source:      'Reed',
    }));
  } catch (e) {
    console.error('[fetch-all-jobs] Reed failed:', e.message);
    return [];
  }
}

/* ─── Main handler ─── */
export default async (req, context) => {
  console.log('[fetch-all-jobs] Starting weekly job fetch…');

  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchArbeitnow(),
    fetchIndeedRSS(),
    fetchHNHiring(),
    fetchJSearch(),
    fetchAdzuna(),
    fetchReed(),
  ]);

  let allJobs = [];
  const sources = ['Remotive', 'Arbeitnow', 'Indeed', 'HN Hiring', 'JSearch', 'Adzuna', 'Reed'];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[fetch-all-jobs] ${sources[i]}: ${r.value.length} jobs`);
      allJobs = allJobs.concat(r.value);
    } else {
      console.error(`[fetch-all-jobs] ${sources[i]} rejected:`, r.reason?.message);
    }
  });

  const deduped = dedup(allJobs.filter(j => j.title && j.company));
  console.log(`[fetch-all-jobs] Total after dedup: ${deduped.length}`);

  try {
    const store = getStore('job-board');
    await store.setJSON('all-jobs', {
      jobs:        deduped,
      fetchedAt:   new Date().toISOString(),
      totalCount:  deduped.length,
    });
    console.log('[fetch-all-jobs] Stored to Netlify Blobs successfully.');
  } catch (e) {
    console.error('[fetch-all-jobs] Failed to write to Netlify Blobs:', e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message, count: deduped.length }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, count: deduped.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
