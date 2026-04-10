#!/usr/bin/env node
/**
 * One-shot script: build shared/publish_schedule.json for the blog drip.
 *
 * Context: Google stopped indexing new pages after 18 March 2026 because the
 * sitemap exploded from ~130 to 328 blog URLs in three weeks (148 posts added
 * in a single commit on 4/9). This script identifies every blog HTML file
 * added AFTER the cliff that is not already drip-scheduled in blog_data.js
 * and assigns each one a future publishDate, 1 per day starting 2026-04-16.
 *
 * Combined with the existing 30-post drip queue in shared/blog_data.js
 * (posts 007-036, dates 2026-04-16 through 2026-05-15), the effective rate is
 * 2 posts/day for the first 30 days, then 1/day until the new queue empties.
 *
 * Run ONCE to populate shared/publish_schedule.json. Re-running is idempotent:
 * any slug that already has a publishDate keeps it.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const SCHEDULE_PATH = path.join(ROOT_DIR, 'shared', 'publish_schedule.json');
const BLOG_DATA_PATH = path.join(ROOT_DIR, 'shared', 'blog_data.js');

// The cliff date. Anything added on or after this date needs drip scheduling.
const CLIFF_DATE = '2026-03-18';

// Drip starts on this date (matches the existing blog_data.js queue for 007-036)
const DRIP_START = '2026-04-16';

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// 1. Find every blog HTML file added to git AFTER the cliff.
function getBlogAddDates() {
  const out = execSync(
    `git log --diff-filter=A --format="%cs %H" --since="${CLIFF_DATE}" --name-only -- "blog/*.html"`,
    { cwd: ROOT_DIR, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const map = new Map(); // slug -> git add date
  let currentDate = null;
  for (const line of out.split('\n')) {
    if (/^\d{4}-\d{2}-\d{2} [a-f0-9]+$/.test(line)) {
      currentDate = line.split(' ')[0];
    } else if (line.startsWith('blog/') && line.endsWith('.html')) {
      const slug = path.basename(line, '.html');
      if (!map.has(slug)) map.set(slug, currentDate);
    }
  }
  return map;
}

// 2. Extract slugs that ALREADY have a publishDate in blog_data.js (007-036).
function getScheduledSlugs() {
  const content = fs.readFileSync(BLOG_DATA_PATH, 'utf8');
  const scheduled = new Set();
  // Match {...slug:"xxx"...publishDate:"yyyy-mm-dd"...} across the entry
  const entryRegex = /slug:"([^"]+)"[^}]*?publishDate:"(\d{4}-\d{2}-\d{2})"/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    scheduled.add(m[1]);
  }
  return scheduled;
}

// 3. Load existing publish_schedule.json if present (so re-runs are idempotent).
function loadExistingSchedule() {
  if (!fs.existsSync(SCHEDULE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  const addDatesBySlug = getBlogAddDates();
  const alreadyScheduled = getScheduledSlugs();
  const existing = loadExistingSchedule();

  // Candidates: added after cliff AND not already scheduled in blog_data.js
  // (we sort by git-add date oldest-first so the order is deterministic).
  const candidates = [];
  for (const [slug, addDate] of addDatesBySlug.entries()) {
    if (alreadyScheduled.has(slug)) continue; // already drip-scheduled
    candidates.push({ slug, addDate });
  }
  candidates.sort((a, b) => {
    if (a.addDate !== b.addDate) return a.addDate.localeCompare(b.addDate);
    return a.slug.localeCompare(b.slug);
  });

  // Assign publishDate 1/day starting DRIP_START, preserving existing entries.
  const schedule = { ...existing };
  let dayOffset = 0;
  for (const { slug } of candidates) {
    if (schedule[slug]) continue; // preserve manual edits
    schedule[slug] = addDays(DRIP_START, dayOffset);
    dayOffset++;
  }

  // Write sorted by slug for easier diffs.
  const sorted = Object.fromEntries(
    Object.entries(schedule).sort((a, b) => a[0].localeCompare(b[0]))
  );

  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(sorted, null, 2) + '\n');

  // Print stats
  const entries = Object.entries(sorted);
  const dates = entries.map(([, d]) => d).sort();
  console.log(`publish_schedule.json written: ${entries.length} entries`);
  if (entries.length > 0) {
    console.log(`  date range: ${dates[0]} → ${dates[dates.length - 1]}`);
    // distribution
    const byDate = {};
    for (const [, d] of entries) byDate[d] = (byDate[d] || 0) + 1;
    const max = Math.max(...Object.values(byDate));
    console.log(`  max posts per day: ${max}`);
  }
  console.log(`  already drip-scheduled in blog_data.js: ${alreadyScheduled.size}`);
  console.log(`  candidates found since cliff (${CLIFF_DATE}): ${candidates.length}`);
}

main();
