#!/usr/bin/env node
/**
 * Dynamic sitemap generator for raisereadybook.com
 * Scans all HTML files and generates sitemap.xml with proper priorities.
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

// Change frequency by section
const FREQ_MAP = {
  'blog': 'daily',
  'services': 'weekly',
  'tools': 'weekly',
  'about': 'monthly',
  'book': 'monthly',
  'software': 'monthly',
  'contact': 'monthly',
};

function findHtmlFiles(dir, base = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    // Skip hidden dirs, node_modules, .git, shared, netlify, assets, data, files
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
  // index.html -> directory URL
  if (filePath === 'index.html') return SITE_URL + '/';
  if (filePath.endsWith('/index.html')) {
    return SITE_URL + '/' + filePath.replace('/index.html', '/');
  }
  return SITE_URL + '/' + filePath;
}

function getLastmod(filePath) {
  // 1. Prefer the git commit date of the last change. File mtimes are reset
  //    on every `git clone`, so on Netlify every file would otherwise show
  //    today's build date, which gives Google no signal about freshness.
  try {
    const gitDate = execSync(
      `git log -1 --format=%cs -- "${filePath}"`,
      { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) return gitDate;
  } catch {}
  // 2. Fallback to filesystem mtime (covers files not yet committed).
  try {
    const stat = fs.statSync(path.join(ROOT_DIR, filePath));
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return TODAY;
  }
}

// Generate sitemap
const htmlFiles = findHtmlFiles(ROOT_DIR);
console.log(`Found ${htmlFiles.length} HTML files`);

// Sort: homepage first, then by section, then alphabetically
htmlFiles.sort((a, b) => {
  if (a === 'index.html') return -1;
  if (b === 'index.html') return 1;
  return a.localeCompare(b);
});

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const file of htmlFiles) {
  const section = getSection(file);
  const priority = file === 'index.html' ? 1.0 :
    file.endsWith('/index.html') ? (PRIORITY_MAP[section] || 0.5) :
    Math.max((PRIORITY_MAP[section] || 0.5) - 0.1, 0.3);
  const changefreq = FREQ_MAP[section] || 'weekly';
  const lastmod = getLastmod(file);
  const url = fileToUrl(file);

  xml += '  <url>\n';
  xml += `    <loc>${url}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  xml += '  </url>\n';
}

xml += '</urlset>\n';

fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml);
console.log(`Sitemap generated: ${htmlFiles.length} URLs -> sitemap.xml`);

// Also generate a URL list for IndexNow batch submission
const urlList = htmlFiles.map(f => fileToUrl(f));
fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'url-list.txt'), urlList.join('\n'));
console.log(`URL list generated: ${urlList.length} URLs -> scripts/url-list.txt`);
