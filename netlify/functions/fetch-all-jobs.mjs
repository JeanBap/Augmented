// fetch-all-jobs.mjs
// Netlify function that aggregates job postings from VC/PE firm job boards
// Sources: Greenhouse, Lever, Ashby, SmartRecruiters, Recruitee

// ── Board token registries ─────────────────────────────────────────────────────

const GREENHOUSE_BOARDS = [
  'generalcatalyst',
  'batteryventures',
  'bessaborpartners', // Bessemer Venture Partners
  'tpg',
  'warburg',          // Warburg Pincus
  'eqtgroup',
  'permiraadvisers',
  'advent',           // Advent International
];

const LEVER_BOARDS = [
  // Add Lever board tokens here
];

const ASHBY_BOARDS = [
  'greylock',
  'firstround',       // First Round Capital
  'kleinerperkins',
];

const SMARTRECRUITERS_BOARDS = [
  'bridgepoint',
];

const RECRUITEE_BOARDS = [
  'bcpartners',
];

// ── Normalizers ────────────────────────────────────────────────────────────────

function normalizeGreenhouse(job, boardToken) {
  return {
    id: `greenhouse-${boardToken}-${job.id}`,
    title: job.title || '',
    company: boardToken,
    location: job.location?.name || '',
    type: job.metadata?.find(m => m.name === 'Employment Type')?.value || '',
    category: job.departments?.[0]?.name || '',
    url: job.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
    description: job.content || '',
    source: 'greenhouse',
    postedAt: job.updated_at || null,
  };
}

function normalizeLever(job, boardToken) {
  return {
    id: `lever-${boardToken}-${job.id}`,
    title: job.text || '',
    company: boardToken,
    location: job.categories?.location || job.workplaceType || '',
    type: job.categories?.commitment || '',
    category: job.categories?.department || job.categories?.team || '',
    url: job.hostedUrl || `https://jobs.lever.co/${boardToken}/${job.id}`,
    description: job.descriptionPlain || job.description || '',
    source: 'lever',
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  };
}

function normalizeAshby(job, slug) {
  return {
    id: `ashby-${slug}-${job.id}`,
    title: job.title || '',
    company: slug,
    location: job.isRemote ? 'Remote' : (job.location || ''),
    type: job.employmentType || '',
    category: job.department || '',
    url: job.applyUrl || job.jobUrl || '',
    description: job.descriptionHtml || job.description || '',
    source: 'ashby',
    postedAt: job.publishedAt || null,
  };
}

function normalizeSmartRecruiters(job, company) {
  return {
    id: `smartrecruiters-${company}-${job.id}`,
    title: job.name || '',
    company,
    location: job.location?.city
      ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
      : '',
    type: job.typeOfEmployment?.label || '',
    category: job.department?.label || '',
    url: job.ref || `https://jobs.smartrecruiters.com/${company}/${job.id}`,
    description: job.jobAd?.sections?.jobDescription?.text || '',
    source: 'smartrecruiters',
    postedAt: job.releasedDate || null,
  };
}

function normalizeRecruitee(job, company) {
  return {
    id: `recruitee-${company}-${job.id}`,
    title: job.title || '',
    company,
    location: job.city || job.location || '',
    type: job.employment_type_code || '',
    category: job.department || '',
    url: job.careers_url || `https://${company}.recruitee.com/o/${job.slug}`,
    description: job.description || '',
    source: 'recruitee',
    postedAt: job.published_at || null,
  };
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchGreenhouseBoard(boardToken) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map(job => normalizeGreenhouse(job, boardToken));
}

async function fetchLeverBoard(boardToken) {
  const url = `https://api.lever.co/v0/postings/${boardToken}?mode=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(job => normalizeLever(job, boardToken));
}

async function fetchAshbyBoard(slug) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.jobs || []).map(job => normalizeAshby(job, slug));
}

async function fetchSmartRecruitersBoard(company) {
  const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.content || []).map(job => normalizeSmartRecruiters(job, company));
}

async function fetchRecruiteeBoard(company) {
  const url = `https://${company}.recruitee.com/api/offers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.offers || []).map(job => normalizeRecruitee(job, company));
}

// ── Safe runner — skip bad tokens, don't break the pipeline ───────────────────

async function safeRun(label, fn) {
  try {
    const results = await fn();
    console.log(`[fetch-all-jobs] ${label}: ${results.length} jobs`);
    return results;
  } catch (err) {
    console.warn(`[fetch-all-jobs] SKIP ${label}: ${err.message}`);
    return [];
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export const handler = async () => {
  const tasks = [
    ...GREENHOUSE_BOARDS.map(token =>
      safeRun(`greenhouse/${token}`, () => fetchGreenhouseBoard(token))
    ),
    ...LEVER_BOARDS.map(token =>
      safeRun(`lever/${token}`, () => fetchLeverBoard(token))
    ),
    ...ASHBY_BOARDS.map(slug =>
      safeRun(`ashby/${slug}`, () => fetchAshbyBoard(slug))
    ),
    ...SMARTRECRUITERS_BOARDS.map(company =>
      safeRun(`smartrecruiters/${company}`, () => fetchSmartRecruitersBoard(company))
    ),
    ...RECRUITEE_BOARDS.map(company =>
      safeRun(`recruitee/${company}`, () => fetchRecruiteeBoard(company))
    ),
  ];

  const settled = await Promise.allSettled(tasks);
  const jobs = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

  console.log(`[fetch-all-jobs] total jobs fetched: ${jobs.length}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs, count: jobs.length }),
  };
};
