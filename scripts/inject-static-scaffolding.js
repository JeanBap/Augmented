#!/usr/bin/env node
/**
 * inject-static-scaffolding.js
 *
 * Why this exists:
 *   Googlebot crawls the raw HTML served by Netlify. Our nav and footer were
 *   being injected at runtime by shared/components.js, and the blog listing
 *   was being rendered at runtime from shared/blog_data.js. That meant every
 *   crawl saw an empty <div id="site-nav"></div>, an empty blog list, and no
 *   internal links. Combined with a 3/18 content-velocity spike, Google
 *   treated the site as a content farm and throttled indexing.
 *
 *   This script solves that by injecting NAV_HTML and FOOTER_HTML directly
 *   into the raw HTML of every page that has the placeholder divs, and by
 *   pre-rendering the blog cards into blog/index.html. components.js is
 *   also made idempotent so it does not double-inject at runtime.
 *
 * Safety:
 *   - Only replaces EMPTY placeholder divs (`<div id="site-nav"></div>`).
 *     If a page already has pre-rendered content, it is left alone.
 *   - Idempotent. Running the script twice is a no-op after the first run.
 *   - Runs during build (invoked from generate-sitemap.js or netlify.toml).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_PATH = path.join(REPO_ROOT, 'shared', 'components.js');
const BLOG_DATA_PATH = path.join(REPO_ROOT, 'shared', 'blog_data.js');
const BLOG_INDEX_PATH = path.join(REPO_ROOT, 'blog', 'index.html');
const PUBLISH_SCHEDULE_PATH = path.join(REPO_ROOT, 'shared', 'publish_schedule.json');

const TODAY_ISO = new Date().toISOString().split('T')[0];

// ---------- 1. Extract NAV_HTML and FOOTER_HTML from components.js ----------

function extractTemplate(source, constName) {
  // Match: const NAME = `...`; with non-greedy backtick matching. Templates
  // here contain no nested backticks, so a simple match is safe.
  const re = new RegExp('const\\s+' + constName + '\\s*=\\s*`([\\s\\S]*?)`', 'm');
  const m = source.match(re);
  if (!m) {
    throw new Error('Could not find `' + constName + '` template literal in components.js');
  }
  return m[1];
}

const componentsSource = fs.readFileSync(COMPONENTS_PATH, 'utf8');
const NAV_HTML = extractTemplate(componentsSource, 'NAV_HTML').trim();
const FOOTER_HTML = extractTemplate(componentsSource, 'FOOTER_HTML').trim();

// ---------- 2. Load blog_data.js in a vm sandbox ----------

function loadBlogArticles() {
  // blog_data.js uses `const BLOG_ARTICLES = [...]`. Lexical `const`
  // declarations at top level of a vm context do NOT attach to the sandbox
  // global, so we rewrite it to `var` so we can read it back.
  let src = fs.readFileSync(BLOG_DATA_PATH, 'utf8');
  src = src.replace(/^const\s+BLOG_ARTICLES\s*=/, 'var BLOG_ARTICLES =');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  if (!Array.isArray(sandbox.BLOG_ARTICLES)) {
    throw new Error('BLOG_ARTICLES not defined after evaluating blog_data.js');
  }
  return sandbox.BLOG_ARTICLES;
}

function loadPublishSchedule() {
  if (!fs.existsSync(PUBLISH_SCHEDULE_PATH)) return {};
  return JSON.parse(fs.readFileSync(PUBLISH_SCHEDULE_PATH, 'utf8'));
}

function isLive(article, schedule) {
  // Prefer explicit publishDate on the article, fall back to schedule, else live.
  const date = article.publishDate || schedule[article.slug];
  if (!date) return true;
  return date <= TODAY_ISO;
}

// ---------- 3. Render static blog cards for blog/index.html ----------

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlogCards(articles) {
  return articles.map(function (a) {
    return (
      '<a href="/blog/' + encodeURIComponent(a.slug) + '.html" class="blog-card" data-cat="' +
      escapeHtml(a.category) + '" style="text-decoration:none">' +
      '<span class="blog-num">' + escapeHtml(a.num) + '</span>' +
      '<div class="blog-card-body">' +
      '<h3>' + escapeHtml(a.title) + '</h3>' +
      '<p class="blog-tldr">' + escapeHtml(a.tldr) + '</p>' +
      '</div>' +
      '<div class="blog-meta">' +
      '<span class="blog-cat">' + escapeHtml(a.category) + '</span>' +
      '<span class="blog-time">' + escapeHtml(a.readTime) + ' min read</span>' +
      '</div>' +
      '</a>'
    );
  }).join('\n');
}

// ---------- 4. HTML replacement helpers ----------

// Match an EMPTY site-nav / site-footer placeholder. Only empty ones are
// safe to replace; if somebody already edited a page to include pre-rendered
// content inside the placeholder, we leave it alone.
const EMPTY_NAV_PLACEHOLDER_RE = /<div id="site-nav"><\/div>/g;
const EMPTY_FOOTER_PLACEHOLDER_RE = /<div id="site-footer"><\/div>/g;
// blog-list in blog/index.html. We always replace, even if previously populated,
// so the pre-render always reflects the current publish state.
const BLOG_LIST_RE = /<div class="blog-list" id="blog-list">[\s\S]*?<\/div>\s*<!--\s*\/blog-list\s*-->/;
const EMPTY_BLOG_LIST_RE = /<div class="blog-list" id="blog-list"><\/div>/;

// Schedule injection marker. The inject script writes a <script> block with
// __RR_SCHEDULE between these markers, replacing any previous one.
const SCHEDULE_MARKER_START = '<!-- RR_SCHEDULE_INJECT_START -->';
const SCHEDULE_MARKER_END = '<!-- RR_SCHEDULE_INJECT_END -->';

function injectNavFooter(html) {
  let next = html;
  if (EMPTY_NAV_PLACEHOLDER_RE.test(next)) {
    EMPTY_NAV_PLACEHOLDER_RE.lastIndex = 0;
    next = next.replace(EMPTY_NAV_PLACEHOLDER_RE, '<div id="site-nav">' + NAV_HTML + '</div>');
  }
  if (EMPTY_FOOTER_PLACEHOLDER_RE.test(next)) {
    EMPTY_FOOTER_PLACEHOLDER_RE.lastIndex = 0;
    next = next.replace(EMPTY_FOOTER_PLACEHOLDER_RE, '<div id="site-footer">' + FOOTER_HTML + '</div>');
  }
  return next;
}

// ---------- 5. Walk the repo and inject ----------

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'scripts',
  // any other build or tooling dirs you want to skip
]);

function walkHtmlFiles(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtmlFiles(path.join(dir, entry.name), results);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function main() {
  const allHtml = walkHtmlFiles(REPO_ROOT, []);
  let navInjected = 0;
  let footerInjected = 0;
  let filesChanged = 0;
  const unchanged = [];

  for (const file of allHtml) {
    const original = fs.readFileSync(file, 'utf8');
    const hadNav = /<div id="site-nav"><\/div>/.test(original);
    const hadFooter = /<div id="site-footer"><\/div>/.test(original);
    if (!hadNav && !hadFooter) {
      unchanged.push(file);
      continue;
    }
    const updated = injectNavFooter(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      filesChanged += 1;
      if (hadNav) navInjected += 1;
      if (hadFooter) footerInjected += 1;
    }
  }

  // ---------- 6. Pre-render blog cards into blog/index.html ----------

  const schedule = loadPublishSchedule();
  const articles = loadBlogArticles();
  const liveArticles = articles.filter(function (a) { return isLive(a, schedule); });
  const staticCards = renderBlogCards(liveArticles);

  let blogIndex = fs.readFileSync(BLOG_INDEX_PATH, 'utf8');
  const blogListBlock =
    '<div class="blog-list" id="blog-list">\n' + staticCards + '\n</div>\n<!-- /blog-list -->';

  if (BLOG_LIST_RE.test(blogIndex)) {
    // Subsequent runs: replace the previously injected block.
    blogIndex = blogIndex.replace(BLOG_LIST_RE, blogListBlock);
  } else if (EMPTY_BLOG_LIST_RE.test(blogIndex)) {
    // First run: replace the empty placeholder.
    blogIndex = blogIndex.replace(EMPTY_BLOG_LIST_RE, blogListBlock);
  } else {
    console.warn('[blog-index] could not find blog-list placeholder — skipping cards.');
  }

  // Inject the publish schedule as a window global so the runtime isLive()
  // filter matches the static pre-render exactly.
  const scheduleBlock =
    SCHEDULE_MARKER_START + '\n' +
    '<script>window.__RR_SCHEDULE=' + JSON.stringify(schedule) + ';</script>\n' +
    SCHEDULE_MARKER_END;
  const existingRe = new RegExp(SCHEDULE_MARKER_START + '[\\s\\S]*?' + SCHEDULE_MARKER_END);
  if (existingRe.test(blogIndex)) {
    blogIndex = blogIndex.replace(existingRe, scheduleBlock);
  } else {
    // Insert just before the first <script src="/shared/blog_data.js"> so
    // __RR_SCHEDULE is defined before the inline render logic reads it.
    blogIndex = blogIndex.replace(
      '<script src="/shared/blog_data.js"></script>',
      scheduleBlock + '\n<script src="/shared/blog_data.js"></script>'
    );
  }

  fs.writeFileSync(BLOG_INDEX_PATH, blogIndex, 'utf8');
  console.log('[blog-index] pre-rendered ' + liveArticles.length + ' static blog cards (of ' + articles.length + ' total).');
  console.log('[blog-index] injected __RR_SCHEDULE with ' + Object.keys(schedule).length + ' entries.');

  // ---------- 7. Report ----------

  console.log('[inject] scanned ' + allHtml.length + ' HTML files.');
  console.log('[inject] changed ' + filesChanged + ' files.');
  console.log('[inject] nav injected into ' + navInjected + ' files.');
  console.log('[inject] footer injected into ' + footerInjected + ' files.');
}

main();
