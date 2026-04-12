#!/usr/bin/env node
/**
 * sync-robots-meta.js
 *
 * Ensures blog posts respect their publish schedule:
 *   - publishDate <= today  ->  <meta name="robots" content="index, follow, max-image-preview:large">
 *   - publishDate > today   ->  <meta name="robots" content="noindex, nofollow">
 *   - no scheduled date     ->  leave as index (already live)
 *
 * Reads from shared/publish_schedule.json + shared/blog_data.js
 * Runs as Netlify build step BEFORE generate-sitemap.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const TODAY = new Date().toISOString().split('T')[0];

const INDEX_META = 'content="index, follow, max-image-preview:large"';
const NOINDEX_META = 'content="noindex, nofollow"';

function loadSchedule() {
  const schedule = new Map();

  // Source 1: blog_data.js
  try {
    const content = fs.readFileSync(path.join(ROOT, 'shared', 'blog_data.js'), 'utf8');
    const regex = /slug:"([^"]+)"[^}]*?publishDate:"(\d{4}-\d{2}-\d{2})"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      schedule.set(m[1], m[2]);
    }
  } catch (e) {
    console.warn(`[sync-robots] could not read blog_data.js: ${e.message}`);
  }

  // Source 2: publish_schedule.json (wins on collision)
  try {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'publish_schedule.json'), 'utf8'));
    for (const [slug, date] of Object.entries(json)) {
      schedule.set(slug, date);
    }
  } catch (e) {
    console.warn(`[sync-robots] could not read publish_schedule.json: ${e.message}`);
  }

  return schedule;
}

const schedule = loadSchedule();
console.log(`[sync-robots] loaded ${schedule.size} scheduled posts, today = ${TODAY}`);

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
let flippedToIndex = 0;
let flippedToNoindex = 0;
let unchanged = 0;

for (const file of files) {
  const slug = file.replace('.html', '');
  const publishDate = schedule.get(slug);
  const isLive = !publishDate || publishDate <= TODAY;
  const targetMeta = isLive ? INDEX_META : NOINDEX_META;

  const filePath = path.join(BLOG_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Find existing robots meta
  const robotsRegex = /<meta\s+name="robots"\s+content="[^"]*"/;
  const match = html.match(robotsRegex);

  if (match) {
    const existing = match[0];
    const replacement = `<meta name="robots" ${targetMeta}`;
    if (existing !== replacement) {
      html = html.replace(existing, replacement);
      fs.writeFileSync(filePath, html);
      if (isLive) flippedToIndex++;
      else flippedToNoindex++;
    } else {
      unchanged++;
    }
  } else {
    unchanged++;
  }
}

console.log(`[sync-robots] flipped to index: ${flippedToIndex}`);
console.log(`[sync-robots] flipped to noindex: ${flippedToNoindex}`);
console.log(`[sync-robots] unchanged: ${unchanged}`);
console.log(`[sync-robots] total processed: ${files.length}`);
