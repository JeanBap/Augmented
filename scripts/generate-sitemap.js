#!/usr/bin/env node
/**
 * Dynamic sitemap generator for raisereadybook.com
 *
 * Scans all HTML files on disk, filters out blog posts whose publishDate is
 * still in the future, and emits a SITEMAP INDEX plus two child sitemaps:
 *   - sitemap-core.xml: high-priority non-blog URLs (homepage, tools, templates,
 *     services, software, book, about, jobboard, etc.) — the pages you want
 *     Google to crawl aggressively
 *   - sitemap-blog.xml: blog posts whose publishDate has already passed
 *
 * Why the split?
 *   After the March 2026 content spike, Google put the site on crawl probation
 *   (167 URLs stuck in "Discovered – currently not indexed"). A sitemap index
 *   lets Google treat the core pages as a separate, smaller, higher-priority
 *   target while the blog backlog drains at the dripping rate.
 *
 * Why filter by publishDate?
 *   The existing shared/blog_data.js already carries publishDate for posts
 *   007-036 (daily drip 4/16 → 5/15). The new shared/publish_schedule.json
 *   adds publishDate for the 148 orphan HTML files added on 4/9 that are not
 *   tracked in blog_data.js, plus the 4+1 posts from 3/18 and 3/21.
 *   This script respects both sources.
 *
 * Run as Netlify build command: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_URL = 'https://www.raisereadybook.com';
const ROOT_DIR = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];

// Directories/files to exclude from sitemap
const EXCLUDE = new Set([
  '404.html',
  'admin/index.html',
  'success/index.html',
  'products/index.html',
]);

// Priority mapping by section
const PRIORITY_MAP = {
  '': 1.0,          // homepage
  'about': 0.8,
  'blog': 0.7,
  'services': 0.9,
  'tools': 0.8,
  'book': 0.8,
  'software': 0.7,
  'careers': 0.5,
  'contact': 0.6,
  'search': 0.3,
  'dl': 0.4,
  'jobboard': 0.6,
  'templates': 0.7,
  'covers': 0.3,
};

// Change frequency by section.
// Blog posts are NOT updated daily in practice — telling Google they are erodes
// trust in the freshness signal. "monthly" matches reality.
const FREQ_MAP = {
  'blog': 'monthly',
  'services': 'weekly',
  'tools': 'weekly',
  'about': 'monthly',
  'book': 'monthly',
  'software': 'monthly',
  'contact': 'monthly',
};

// ---------- Publish schedule ----------

function loadPublishSchedule() {
  // Two sources, merged. publish_schedule.json wins if there's a collision.
  const schedule = new Map(); // slug -> publishDate (YYYY-MM-DD)

  // Source 1: shared/blog_data.js (posts 007-036)
  try {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'shared', 'blog_data.js'), 'utf8');
    const regex = /slug:"([^"]+)"[^}]*?publishDate:"(\d{4}-\d{2}-\d{2})"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      schedule.set(m[1], m[2]);
    }
  } catch (e) {
    console.warn(`[sitemap] could not read blog_data.js: ${e.message}`);
  }

  // Source 2: shared/publish_schedule.json (148 orphan posts + 5 from 3/18 and 3/21)
  try {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'shared', 'publish_schedule.json'), 'utf8'));
    for (const [slug, date] of Object.entries(json)) {
      schedule.set(slug, date);
    }
  } catch (e) {
    console.warn(`[sitemap] could not read publish_schedule.json: ${e.message}`);
  }

  return schedule;
}

function isFuturePost(filePath, schedule) {
  // Only blog posts are gated by publishDate.
  if (!filePath.startsWith('blog/') || !filePath.endsWith('.html')) return false;
  if (filePath === 'blog/index.html') return false;
  const slug = path.basename(filePath, '.html');
  const publishDate = schedule.get(slug);
  if (!publishDate) return false; // unscheduled = already live
  return publishDate > TODAY;
}

// ---------- File discovery ----------

function findHtmlFiles(dir, base = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'shared', 'netlify', 'assets', 'data', 'files', 'scripts', 'covers'].includes(entry.name)) continue;
      results.push(...findHtmlFiles(path.join(dir, entry.name), relPath));
    } else if (entry.name.endsWith('.html')) {
      if (!EXCLUDE.has(relPath)) {
        results.push(relPath);
      }
    }
  }
  return results;
}

function getSection(filePath) {
  const parts = filePath.split('/');
  return parts.length > 1 ? parts[0] : '';
}

function fileToUrl(filePath) {
  if (filePath === 'index.html') return SITE_URL + '/';
  if (filePath.endsWith('/index.html')) {
    return SITE_URL + '/' + filePath.replace('/index.html', '/');
  }
  return SITE_URL + '/' + filePath;
}

function getLastmod(filePath, schedule) {
  // For drip-scheduled blog posts, prefer the publishDate as lastmod so that
  // Google sees a believable "this just got published today" signal when the
  // post drops into the sitemap.
  const slug = path.basename(filePath, '.html');
  const publishDate = schedule.get(slug);
  if (publishDate && filePath.startsWith('blog/')) {
    return publishDate;
  }
  // Otherwise prefer git commit date (file mtimes reset on clone).
  try {
    const gitDate = execSync(
      `git log -1 --format=%cs -- "${filePath}"`,
      { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) return gitDate;
  } catch {}
  try {
    const stat = fs.statSync(path.join(ROOT_DIR, filePath));
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return TODAY;
  }
}

// ---------- XML builders ----------

function buildUrlEntry(file, schedule) {
  const section = getSection(file);
  const priority = file === 'index.html' ? 1.0 :
    file.endsWith('/index.html') ? (PRIORITY_MAP[section] || 0.5) :
    Math.max((PRIORITY_MAP[section] || 0.5) - 0.1, 0.3);
  const changefreq = FREQ_MAP[section] || 'weekly';
  const lastmod = getLastmod(file, schedule);
  const url = fileToUrl(file);
  return `  <url>\n` +
    `    <loc>${url}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority.toFixed(1)}</priority>\n` +
    `  </url>\n`;
}

function buildUrlsetXml(files, schedule) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const file of files) xml += buildUrlEntry(file, schedule);
  xml += '</urlset>\n';
  return xml;
}

function buildSitemapIndexXml(childSitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const { loc, lastmod } of childSitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  xml += '</sitemapindex>\n';
  return xml;
}

// ---------- Main ----------

const schedule = loadPublishSchedule();
console.log(`[sitemap] loaded ${schedule.size} scheduled blog posts`);

const allFiles = findHtmlFiles(ROOT_DIR);
console.log(`[sitemap] scanned ${allFiles.length} HTML files on disk`);

// Filter out posts that have not been published yet.
const liveFiles = allFiles.filter(f => !isFuturePost(f, schedule));
const hiddenCount = allFiles.length - liveFiles.length;
console.log(`[sitemap] hiding ${hiddenCount} future-dated blog posts (will drip by ${TODAY} + N days)`);

// Split into core (non-blog) and blog
const coreFiles = [];
const blogFiles = [];
for (const f of liveFiles) {
  if (f.startsWith('blog/') && f !== 'blog/index.html') {
    blogFiles.push(f);
  } else {
    coreFiles.push(f);
  }
}

// Sort: homepage first, then alphabetically
function sortFiles(arr) {
  arr.sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });
}
sortFiles(coreFiles);
sortFiles(blogFiles);

// Write child sitemaps
const coreXml = buildUrlsetXml(coreFiles, schedule);
const blogXml = buildUrlsetXml(blogFiles, schedule);
fs.writeFileSync(path.join(ROOT_DIR, 'sitemap-core.xml'), coreXml);
fs.writeFileSync(path.join(ROOT_DIR, 'sitemap-blog.xml'), blogXml);

// Write sitemap index as sitemap.xml (the file GSC already subscribed to)
const indexXml = buildSitemapIndexXml([
  { loc: `${SITE_URL}/sitemap-core.xml`, lastmod: TODAY },
  { loc: `${SITE_URL}/sitemap-blog.xml`, lastmod: TODAY },
]);
fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), indexXml);

console.log(`[sitemap] sitemap.xml (index) -> 2 child sitemaps`);
console.log(`[sitemap] sitemap-core.xml -> ${coreFiles.length} URLs`);
console.log(`[sitemap] sitemap-blog.xml -> ${blogFiles.length} URLs`);
console.log(`[sitemap] total live URLs: ${coreFiles.length + blogFiles.length} (of ${allFiles.length} on disk)`);

// Also generate a URL list for IndexNow batch submission (live URLs only)
const urlList = [...coreFiles, ...blogFiles].map(f => fileToUrl(f));
fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'url-list.txt'), urlList.join('\n'));
console.log(`[sitemap] url-list.txt -> ${urlList.length} URLs`);
