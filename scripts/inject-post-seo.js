#!/usr/bin/env node
/**
 * inject-post-seo.js
 *
 * Walks every blog/*.html file (except index.html) and injects:
 *   1. BreadcrumbList JSON-LD schema in <head> (if missing)
 *   2. <meta property="article:modified_time"> (from git mtime)
 *   3. A tag-chip strip linking to generated tag hubs
 *   4. A "Related reads" aside of 4-5 siblings scored by tag overlap
 *
 * All injected blocks use data-post-seo="kind" markers so re-runs are
 * idempotent: the script removes any existing blocks with that marker
 * before injecting fresh ones. This lets the daily rebuild script re-run
 * as tag data shifts (new hubs, posts dripping in) without stacking.
 *
 * Runs from netlify.toml after generate-tag-hubs.js. Safe to run locally.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://www.raisereadybook.com';
const BLOG_DIR = path.join(ROOT, 'blog');
const POST_TAGS_PATH = path.join(ROOT, 'shared', 'post_tags.json');
const BLOG_DATA_PATH = path.join(ROOT, 'shared', 'blog_data.js');
const PUBLISH_SCHEDULE_PATH = path.join(ROOT, 'shared', 'publish_schedule.json');
const TODAY_ISO = new Date().toISOString().split('T')[0];

// Labels must match generate-tag-hubs.js so chip text stays consistent.
const STAGE_LABELS = { 'any-stage':'Any Stage','idea':'Idea Stage','pre-seed':'Pre-Seed','seed':'Seed','series-a':'Series A','growth':'Growth Stage','bridge':'Bridge Round','exit':'Exit' };
const TOPIC_LABELS = { 'financial-model':'Financial Modeling','unit-economics':'Unit Economics','fundraising-general':'Fundraising','cap-table':'Cap Table','pitch-deck':'Pitch Deck','valuation':'Valuation','exit-planning':'Exit Planning','metrics-kpis':'Metrics and KPIs','investor-relations':'Investor Relations','burn-runway':'Burn and Runway','growth-gtm':'Growth and GTM','term-sheet':'Term Sheets','founder-psychology':'Founder Psychology' };
const LENS_LABELS = { 'how-to':'How-To Guides','framework':'Frameworks and Playbooks','comparison':'Comparisons and Breakdowns','warning':'Warnings and Pitfalls','story':'Founder Stories','insider':'Insider Perspectives' };
const CATCHALL = new Set(['any-stage','how-to']);
const MIN_HUB = 5;

function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escapeAttr(s) { return escapeHtml(s); }

function loadPostTags() {
  try { return JSON.parse(fs.readFileSync(POST_TAGS_PATH, 'utf8')); }
  catch { return {}; }
}
function loadArticles() {
  let src = fs.readFileSync(BLOG_DATA_PATH, 'utf8');
  src = src.replace(/^const\s+BLOG_ARTICLES\s*=/, 'var BLOG_ARTICLES =');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.BLOG_ARTICLES || [];
}
function loadSchedule() {
  if (!fs.existsSync(PUBLISH_SCHEDULE_PATH)) return {};
  return JSON.parse(fs.readFileSync(PUBLISH_SCHEDULE_PATH, 'utf8'));
}
function isLive(article, schedule) {
  const date = article.publishDate || schedule[article.slug];
  if (!date) return true;
  return date <= TODAY_ISO;
}
function gitLastmod(relPath) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${relPath}"`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch {}
  return null;
}

// --------------------------------------------------------------------
// Determine which hubs are "live" (will be generated). This has to
// stay in sync with generate-tag-hubs.js so chips never link to 404s.
// --------------------------------------------------------------------
function computeLiveHubs(postTags, articles, schedule) {
  const bySlug = { stage: new Set(), topic: new Set(), lens: new Set() };
  const counts = { stage: new Map(), topic: new Map(), lens: new Map() };
  const articleBySlug = new Map();
  for (const a of articles) if (a && a.slug) articleBySlug.set(a.slug, a);
  for (const [postSlug, tags] of Object.entries(postTags)) {
    const article = articleBySlug.get(postSlug);
    if (!article || !isLive(article, schedule)) continue;
    for (const dim of ['stage', 'topic', 'lens']) {
      const v = tags && tags[dim];
      if (!v || CATCHALL.has(v)) continue;
      counts[dim].set(v, (counts[dim].get(v) || 0) + 1);
    }
  }
  for (const dim of ['stage', 'topic', 'lens']) {
    for (const [slug, n] of counts[dim]) {
      if (n >= MIN_HUB) bySlug[dim].add(slug);
    }
  }
  return bySlug;
}

// --------------------------------------------------------------------
// Related posts: score tag overlap, prefer non-catchall matches.
// --------------------------------------------------------------------
function relatedFor(slug, postTags, articles, schedule, n) {
  const mine = postTags[slug];
  if (!mine) return [];
  const scored = [];
  for (const a of articles) {
    if (!a.slug || a.slug === slug) continue;
    if (!isLive(a, schedule)) continue;
    const t = postTags[a.slug];
    if (!t) continue;
    let score = 0;
    for (const dim of ['stage', 'topic', 'lens']) {
      if (mine[dim] && t[dim] && mine[dim] === t[dim]) {
        score += CATCHALL.has(mine[dim]) ? 1 : 3;
      }
    }
    if (score > 0) scored.push({ a, score });
  }
  scored.sort((x, y) => y.score - x.score || (parseInt(y.a.num) || 0) - (parseInt(x.a.num) || 0));
  return scored.slice(0, n).map(x => x.a);
}

// --------------------------------------------------------------------
// Build injection blocks
// --------------------------------------------------------------------
function buildBreadcrumbSchema(article) {
  const url = `${SITE_URL}/blog/${article.slug}.html`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  };
  return `<script type="application/ld+json" data-post-seo="breadcrumb">${JSON.stringify(schema)}</script>`;
}

function buildModifiedMeta(dateMod) {
  return `<meta property="article:modified_time" content="${escapeAttr(dateMod)}" data-post-seo="modified">`;
}

function buildChipsBlock(tags, liveHubs) {
  const chips = [];
  const dims = [
    { key: 'stage', labels: STAGE_LABELS },
    { key: 'topic', labels: TOPIC_LABELS },
    { key: 'lens',  labels: LENS_LABELS },
  ];
  for (const { key, labels } of dims) {
    const slug = tags && tags[key];
    if (!slug || CATCHALL.has(slug)) continue;
    if (!liveHubs[key].has(slug)) continue;
    const label = labels[slug] || slug;
    const href = `/tag/${key}-${slug}.html`;
    chips.push(`<a class="post-seo-chip" href="${escapeAttr(href)}">${escapeHtml(label)}</a>`);
  }
  if (!chips.length) return '';
  return `<div class="post-seo-chips" data-post-seo="chips" aria-label="Topics"><span class="post-seo-chips-label">Topics:</span> ${chips.join(' ')}</div>`;
}

function buildRelatedBlock(related) {
  if (!related.length) return '';
  const lis = related.map(a => {
    const href = `/blog/${encodeURIComponent(a.slug)}.html`;
    return `    <li><a href="${escapeAttr(href)}">${escapeHtml(a.title)}</a></li>`;
  }).join('\n');
  return `<aside class="post-seo-related" data-post-seo="related" aria-label="Related reads">
  <h2>Related reads</h2>
  <ul>
${lis}
  </ul>
</aside>`;
}

// Inline style block, injected once per file (idempotent via marker).
const STYLE_BLOCK = `<style data-post-seo="style">
  .post-seo-chips { margin: 2rem auto 0.5rem; padding: 0.75rem 1.25rem; max-width: 760px; background: rgba(200,164,90,0.06); border: 1px solid #e5ddc9; border-radius: 6px; font-size: 0.85rem; color: #3a3830; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  .post-seo-chips-label { font-family: 'DM Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6e6a61; margin-right: 0.25rem; }
  .post-seo-chip { display: inline-block; padding: 0.3rem 0.75rem; background: #fff; border: 1px solid #d9d4c3; border-radius: 999px; color: #3a3830; text-decoration: none; font-size: 0.8rem; }
  .post-seo-chip:hover { background: var(--gold, #c8a45a); color: #08080d; border-color: var(--gold, #c8a45a); }
  .post-seo-related { max-width: 760px; margin: 2.5rem auto 1rem; padding: 1.5rem 1.75rem; background: #fff; border: 1px solid #e8e4d4; border-radius: 8px; }
  .post-seo-related h2 { font-family: 'Instrument Serif', serif; margin: 0 0 0.75rem; font-size: 1.4rem; color: #3a3830; }
  .post-seo-related ul { list-style: none; padding: 0; margin: 0; }
  .post-seo-related li { padding: 0.5rem 0; border-bottom: 1px solid #f1ede0; }
  .post-seo-related li:last-child { border-bottom: 0; }
  .post-seo-related a { color: #3a3830; text-decoration: none; font-size: 0.95rem; }
  .post-seo-related a:hover { color: var(--gold, #c8a45a); }
</style>`;

// --------------------------------------------------------------------
// Idempotent injection: strip existing post-seo blocks, insert fresh.
// --------------------------------------------------------------------
function stripPostSeoBlocks(html) {
  // Remove anything with data-post-seo="..." on the opening tag.
  // We target <script>, <meta>, <style>, <div>, <aside> with the marker.
  html = html.replace(/<script[^>]*data-post-seo="breadcrumb"[^>]*>[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<meta[^>]*data-post-seo="modified"[^>]*>\s*/g, '');
  html = html.replace(/<style[^>]*data-post-seo="style"[^>]*>[\s\S]*?<\/style>\s*/g, '');
  html = html.replace(/<div[^>]*data-post-seo="chips"[^>]*>[\s\S]*?<\/div>\s*/g, '');
  html = html.replace(/<aside[^>]*data-post-seo="related"[^>]*>[\s\S]*?<\/aside>\s*/g, '');
  return html;
}

function injectHead(html, blocks) {
  const marker = '</head>';
  const idx = html.lastIndexOf(marker);
  if (idx === -1) return html;
  return html.slice(0, idx) + blocks.join('\n') + '\n' + html.slice(idx);
}
function injectBeforeMainClose(html, blocks) {
  const marker = '</main>';
  const idx = html.lastIndexOf(marker);
  if (idx === -1) return html;
  return html.slice(0, idx) + blocks.join('\n') + '\n' + html.slice(idx);
}

// --------------------------------------------------------------------
// Main
// --------------------------------------------------------------------
function main() {
  const postTags = loadPostTags();
  const articles = loadArticles();
  const schedule = loadSchedule();
  const liveHubs = computeLiveHubs(postTags, articles, schedule);
  const articleBySlug = new Map();
  for (const a of articles) if (a && a.slug) articleBySlug.set(a.slug, a);

  let touched = 0, skipped = 0, chipsAdded = 0, relatedAdded = 0, crumbAdded = 0;
  const entries = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

  for (const file of entries) {
    const slug = file.replace(/\.html$/, '');
    const article = articleBySlug.get(slug);
    if (!article) { skipped++; continue; }
    const tags = postTags[slug];

    const fullPath = path.join(BLOG_DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    const orig = html;

    // Strip prior post-seo blocks (idempotency).
    html = stripPostSeoBlocks(html);

    // Build fresh blocks.
    const headBlocks = [];
    const bodyBlocks = [];
    headBlocks.push(STYLE_BLOCK);
    if (!html.includes('"BreadcrumbList"')) {
      headBlocks.push(buildBreadcrumbSchema(article));
      crumbAdded++;
    } else {
      // There is already a BreadcrumbList somewhere (e.g. a prior run
      // that inlined it without the marker). Leave it alone; our marker
      // approach means we only control marked blocks.
      headBlocks.push(buildBreadcrumbSchema(article));
      crumbAdded++;
    }
    const relPath = `blog/${file}`;
    const dateMod = gitLastmod(relPath);
    if (dateMod) {
      headBlocks.push(buildModifiedMeta(new Date(dateMod).toISOString()));
    }
    if (tags) {
      const chips = buildChipsBlock(tags, liveHubs);
      if (chips) { bodyBlocks.push(chips); chipsAdded++; }
      const related = relatedFor(slug, postTags, articles, schedule, 5);
      const relBlock = buildRelatedBlock(related);
      if (relBlock) { bodyBlocks.push(relBlock); relatedAdded++; }
    }

    html = injectHead(html, headBlocks);
    if (bodyBlocks.length) html = injectBeforeMainClose(html, bodyBlocks);

    if (html !== orig) {
      fs.writeFileSync(fullPath, html);
      touched++;
    }
  }

  console.log(`[inject-post-seo] touched ${touched}/${entries.length} post files`);
  console.log(`  breadcrumb schemas: ${crumbAdded}`);
  console.log(`  tag-chip blocks:    ${chipsAdded}`);
  console.log(`  related-reads blocks: ${relatedAdded}`);
  console.log(`  skipped (no article match): ${skipped}`);
}

main();
