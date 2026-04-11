#!/usr/bin/env node
/**
 * generate-tag-hubs.js
 *
 * Generates static tag hub HTML files under /tag/ for raisereadybook.com.
 * One page per (dimension, slug) pair from shared/post_tags.json, filtered:
 *   - Skip catchall slugs (any-stage, how-to) that dominate a dimension.
 *   - Skip slugs with fewer than MIN_HUB_POSTS live posts.
 *
 * Each hub is a CollectionPage listing its member posts newest-first, with
 * CollectionPage + BreadcrumbList JSON-LD, a curated intro, and canonical
 * site styling (Instrument Serif / DM Mono / Syne).
 *
 * URL scheme: /tag/<dimension>-<slug>.html  (e.g. /tag/stage-seed.html)
 * Why prefixed: avoids collision with existing /blog/, /book/, /tools/,
 * /templates/, /software/ top-level paths.
 *
 * Called from netlify.toml before generate-sitemap.js so auto-discovery
 * picks up the generated files.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://www.raisereadybook.com';
const TAG_DIR = path.join(ROOT, 'tag');
const POST_TAGS_PATH = path.join(ROOT, 'shared', 'post_tags.json');
const BLOG_DATA_PATH = path.join(ROOT, 'shared', 'blog_data.js');
const PUBLISH_SCHEDULE_PATH = path.join(ROOT, 'shared', 'publish_schedule.json');

const TODAY_ISO = new Date().toISOString().split('T')[0];

// --------------------------------------------------------------------
// Taxonomy labels + catchall filtering
// --------------------------------------------------------------------
const STAGE_LABELS = {
  'any-stage': 'Any Stage',
  'idea': 'Idea Stage',
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'growth': 'Growth Stage',
  'bridge': 'Bridge Round',
  'exit': 'Exit',
};
const TOPIC_LABELS = {
  'financial-model': 'Financial Modeling',
  'unit-economics': 'Unit Economics',
  'fundraising-general': 'Fundraising',
  'cap-table': 'Cap Table',
  'pitch-deck': 'Pitch Deck',
  'valuation': 'Valuation',
  'exit-planning': 'Exit Planning',
  'metrics-kpis': 'Metrics and KPIs',
  'investor-relations': 'Investor Relations',
  'burn-runway': 'Burn and Runway',
  'growth-gtm': 'Growth and GTM',
  'term-sheet': 'Term Sheets',
  'founder-psychology': 'Founder Psychology',
};
const LENS_LABELS = {
  'how-to': 'How-To Guides',
  'framework': 'Frameworks and Playbooks',
  'comparison': 'Comparisons and Breakdowns',
  'warning': 'Warnings and Pitfalls',
  'story': 'Founder Stories',
  'insider': 'Insider Perspectives',
};

const CATCHALL_SLUGS = new Set(['any-stage', 'how-to']);

// Longer SEO-optimised <title> overrides. If a tag hub is here, the generator
// uses this string instead of `${label} | Raise Ready`. This lives on top of
// the generator rather than the static HTML so Netlify rebuilds don't regress.
// Keys are `${dimension}/${slug}`.
const SEO_TITLE_OVERRIDES = {
  'stage/pre-seed': 'Pre-Seed Stage Guides: Idea to First Check | Raise Ready',
  'stage/seed': 'Seed Stage Startup Guides: Fundraising & Metrics | Raise Ready',
  'stage/exit': 'Exit Stage Guides: M&A, IPO, Sale Readiness | Raise Ready',
  'topic/financial-model': 'Financial Modeling Guides for Startups | Raise Ready',
  'topic/valuation': 'Startup Valuation Guides: Methods & Calculators | Raise Ready',
  'topic/exit-planning': 'Exit Planning Guides: M&A, Valuation, Post-Close | Raise Ready',
  'topic/fundraising-general': 'Startup Fundraising Guides: Pre-Seed to Series B | Raise Ready',
  'topic/unit-economics': 'Unit Economics Guides: LTV, CAC, Payback | Raise Ready',
  'topic/cap-table': 'Cap Table Management Guides: SAFEs & Dilution | Raise Ready',
  'topic/growth-gtm': 'Growth & GTM Strategy Guides for Startups | Raise Ready',
  'topic/metrics-kpis': 'Startup Metrics & KPI Guides (MRR, NRR, LTV) | Raise Ready',
  'topic/pitch-deck': 'Pitch Deck Guides: Templates, Slides & Investor Tips | Raise Ready',
  'topic/investor-relations': 'Investor Relations Guides for Startup Founders | Raise Ready',
  'topic/burn-runway': 'Burn Rate & Runway Management Guides | Raise Ready',
  'topic/term-sheet': 'Term Sheet Guides: Key Terms & Negotiation | Raise Ready',
  'topic/founder-psychology': 'Founder Psychology Guides: Mental Health & Resilience | Raise Ready',
};
const MIN_HUB_POSTS = 5;

const HUB_BLURBS = {
  'stage/exit': 'Writing for founders thinking about an exit: valuation, multiples, term sheets, and what happens in the final 90 days.',
  'stage/seed': 'Seed-stage fundraising, financial modeling, and investor conversations for the first priced round.',
  'stage/series-a': 'Series A playbook writing: metrics that matter, the deck, the data room, and how growth investors think.',
  'stage/pre-seed': 'Pre-seed writing for founders before product-market fit: angel cheques, SAFEs, and early financial modeling.',
  'stage/bridge': 'Bridge round writing for founders raising between priced rounds. SAFEs, convertibles, and when to take the bridge.',
  'topic/financial-model': 'Financial modeling playbook for startups: assumptions, revenue build, cohort economics, and investor-ready outputs.',
  'topic/unit-economics': 'Unit economics writing: CAC, LTV, payback period, contribution margin, and the numbers investors actually grade you on.',
  'topic/fundraising-general': 'Practical fundraising writing across all stages: the narrative, the ask, investor outreach, and closing the round.',
  'topic/cap-table': 'Cap table writing: option pools, dilution, SAFEs vs priced, and keeping founders on the right side of the waterfall.',
  'topic/pitch-deck': 'Pitch deck writing: the 10 slides that matter, what VCs look for in the first 93 seconds, and how to build a deck that earns meetings.',
  'topic/valuation': 'Valuation writing for founders: pre-money, post-money, how investors set the number, and how to defend it.',
  'topic/exit-planning': 'Exit planning writing: strategic vs financial buyers, multiples, deal structure, and the 90 days before signing.',
  'topic/metrics-kpis': 'Startup metrics and KPIs that actually matter: north stars, cohort retention, magic number, and the dashboard an investor wants.',
  'topic/investor-relations': 'Investor relations writing: monthly updates, board decks, asking for intros, and managing the relationship after the cheque.',
  'topic/burn-runway': 'Burn rate and runway writing: cash discipline, the 18-month rule, layoffs done right, and extending without diluting.',
  'topic/growth-gtm': 'Growth and go-to-market writing for startups: channels, funnels, and how to build a GTM motion that scales.',
  'lens/framework': 'Framework and playbook writing: reusable templates, decision trees, and structured ways to think about common founder problems.',
  'lens/comparison': 'Head-to-head comparisons and breakdowns: SAFEs vs priced rounds, platforms, tools, and the tradeoffs founders actually face.',
  'lens/warning': 'What goes wrong and how to avoid it: common financial modeling errors, fundraising missteps, and expensive founder mistakes.',
  'lens/story': 'Founder stories and case studies worth reading: what actually happened, what was learned, and what to copy or avoid.',
};

// --------------------------------------------------------------------
// Load data
// --------------------------------------------------------------------
function loadPostTags() {
  try { return JSON.parse(fs.readFileSync(POST_TAGS_PATH, 'utf8')); }
  catch (e) { console.error('[generate-tag-hubs] post_tags.json failed to load:', e.message); return {}; }
}

function loadBlogArticles() {
  let src = fs.readFileSync(BLOG_DATA_PATH, 'utf8');
  src = src.replace(/^const\s+BLOG_ARTICLES\s*=/, 'var BLOG_ARTICLES =');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  if (!Array.isArray(sandbox.BLOG_ARTICLES)) throw new Error('BLOG_ARTICLES not found');
  return sandbox.BLOG_ARTICLES;
}

function loadPublishSchedule() {
  if (!fs.existsSync(PUBLISH_SCHEDULE_PATH)) return {};
  return JSON.parse(fs.readFileSync(PUBLISH_SCHEDULE_PATH, 'utf8'));
}

function isLive(article, schedule) {
  const date = article.publishDate || schedule[article.slug];
  if (!date) return true;
  return date <= TODAY_ISO;
}

// --------------------------------------------------------------------
// Hub computation
// --------------------------------------------------------------------
function computeHubs(postTags, articles, schedule) {
  const bySlug = { stage: new Map(), topic: new Map(), lens: new Map() };
  const articleBySlug = new Map();
  for (const a of articles) if (a && a.slug) articleBySlug.set(a.slug, a);

  for (const [postSlug, tags] of Object.entries(postTags)) {
    const article = articleBySlug.get(postSlug);
    if (!article || !isLive(article, schedule)) continue;
    for (const dim of ['stage', 'topic', 'lens']) {
      const v = tags && tags[dim];
      if (!v) continue;
      if (!bySlug[dim].has(v)) bySlug[dim].set(v, []);
      bySlug[dim].get(v).push(article);
    }
  }

  const labelMaps = { stage: STAGE_LABELS, topic: TOPIC_LABELS, lens: LENS_LABELS };
  const hubs = [];
  for (const dim of ['stage', 'topic', 'lens']) {
    for (const [tagSlug, arr] of bySlug[dim]) {
      if (CATCHALL_SLUGS.has(tagSlug)) continue;
      if (arr.length < MIN_HUB_POSTS) continue;
      const label = labelMaps[dim][tagSlug] || tagSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const sorted = arr.slice().sort((a, b) => (parseInt(b.num) || 0) - (parseInt(a.num) || 0));
      hubs.push({ dimension: dim, slug: tagSlug, label, posts: sorted });
    }
  }
  return hubs;
}

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }
function truncate(s, n) { s = String(s || ''); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; }

// --------------------------------------------------------------------
// Render
// --------------------------------------------------------------------
function renderHubPage(hub) {
  const { dimension, slug, label, posts } = hub;
  const url = `${SITE_URL}/tag/${dimension}-${slug}.html`;
  const dimLabel = dimension === 'stage' ? 'Funding Stage' : dimension === 'topic' ? 'Topic' : 'Format';
  const title = SEO_TITLE_OVERRIDES[`${dimension}/${slug}`] || `${label} | Raise Ready`;
  const blurb = HUB_BLURBS[`${dimension}/${slug}`]
    || `All Raise Ready writing tagged ${label.toLowerCase()}. Practical playbooks, frameworks, and post-mortems for startup founders.`;
  const description = truncate(blurb, 158);

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    isPartOf: { '@type': 'WebSite', name: 'Raise Ready', url: SITE_URL },
    hasPart: posts.slice(0, 20).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}.html`,
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: label, item: url },
    ],
  };

  const cards = posts.map(p => `      <a href="/blog/${encodeURIComponent(p.slug)}.html" class="blog-card" data-cat="${escapeAttr(p.category || '')}" style="text-decoration:none">
        <span class="blog-num">${escapeHtml(p.num || '')}</span>
        <div class="blog-card-body">
          <h3>${escapeHtml(p.title)}</h3>
          <p class="blog-tldr">${escapeHtml(truncate(p.tldr || '', 180))}</p>
        </div>
        <div class="blog-meta">
          <span class="blog-cat">${escapeHtml(p.category || '')}</span>
          <span class="blog-time">${escapeHtml(String(p.readTime || ''))} min read</span>
        </div>
      </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${escapeAttr(url)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:url" content="${escapeAttr(url)}">
<meta property="og:image" content="${SITE_URL}/og-image.png">
<meta property="og:site_name" content="Raise Ready">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${SITE_URL}/og-image.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/shared/style.css">
<script type="application/ld+json">${JSON.stringify(schemaOrg)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
<style>
  .tag-hub-intro { max-width: 760px; margin: 0 auto 2.5rem; padding: 0 1.5rem; }
  .tag-hub-intro .dim-label { display: inline-block; font-family: 'DM Mono', monospace; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold, #c8a45a); margin-bottom: 0.5rem; }
  .tag-hub-intro h1 { font-family: 'Instrument Serif', serif; font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; margin: 0 0 0.75rem; }
  .tag-hub-intro p { font-size: 1.05rem; color: #3a3830; margin: 0 0 0.5rem; line-height: 1.55; }
  .tag-hub-intro .count { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #6e6a61; }
  .tag-hub-grid { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem 4rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
</style>
</head>
<body data-page="tag-hub">
<div id="site-nav"></div>
<main class="page-content">
  <nav class="breadcrumb" aria-label="Breadcrumb" style="max-width:760px;margin:1.5rem auto 0;padding:0 1.5rem;font-family:'DM Mono',monospace;font-size:0.75rem;color:#6e6a61;">
    <a href="/" style="color:#6e6a61;text-decoration:none;">Home</a> &rsaquo;
    <a href="/blog/" style="color:#6e6a61;text-decoration:none;">Blog</a> &rsaquo;
    ${escapeHtml(label)}
  </nav>
  <section class="tag-hub-intro">
    <span class="dim-label">${escapeHtml(dimLabel)}</span>
    <h1>${escapeHtml(label)}</h1>
    <p>${escapeHtml(blurb)}</p>
    <p class="count">${posts.length} ${posts.length === 1 ? 'article' : 'articles'}</p>
  </section>
  <section class="tag-hub-grid">
${cards}
  </section>
</main>
<div id="site-footer"></div>
<script src="/shared/components.js" defer></script>
</body>
</html>
`;
}

// --------------------------------------------------------------------
// Main
// --------------------------------------------------------------------
function main() {
  const postTags = loadPostTags();
  const articles = loadBlogArticles();
  const schedule = loadPublishSchedule();
  const hubs = computeHubs(postTags, articles, schedule);

  fs.mkdirSync(TAG_DIR, { recursive: true });

  // Clean stale hub files whose slug is no longer generated.
  const wanted = new Set(hubs.map(h => `${h.dimension}-${h.slug}.html`));
  try {
    for (const entry of fs.readdirSync(TAG_DIR)) {
      if (entry.endsWith('.html') && !wanted.has(entry)) {
        fs.unlinkSync(path.join(TAG_DIR, entry));
      }
    }
  } catch {}

  // Write hub files.
  for (const hub of hubs) {
    const html = renderHubPage(hub);
    fs.writeFileSync(path.join(TAG_DIR, `${hub.dimension}-${hub.slug}.html`), html);
  }

  console.log(`[generate-tag-hubs] wrote ${hubs.length} hub pages to tag/`);
  for (const hub of hubs) {
    console.log(`  tag/${hub.dimension}-${hub.slug}.html (${hub.posts.length} posts)`);
  }
}

main();
