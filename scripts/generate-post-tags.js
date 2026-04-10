#!/usr/bin/env node
/**
 * generate-post-tags.js (raisereadybook.com)
 *
 * Reads shared/blog_data.js, auto-assigns Stage / Topic / Lens tags by pattern
 * matching against slug, title, category, pillar, and tldr, and writes the
 * result to shared/post_tags.json.
 *
 * IMPORTANT: This script does NOT touch blog_data.js. The content file stays
 * untouched so there's zero risk of breaking the live site or regressing what
 * Google has already crawled. Phase 2 (the UI injection) reads post_tags.json
 * separately at build time and injects chips + related posts into HTML
 * without ever modifying blog_data.js.
 *
 * Re-run anytime to refresh tags. Manual overrides: edit shared/post_tags.json
 * directly; the script honors a `_manualOverride: true` marker and skips
 * those entries on re-run.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const BLOG_DATA_PATH = path.join(REPO_ROOT, 'shared', 'blog_data.js');
const OUTPUT_PATH = path.join(REPO_ROOT, 'shared', 'post_tags.json');

// ---------- Controlled vocabulary ----------

// Stage: where in the founder journey is this post relevant?
const STAGES = [
  { slug: 'idea',       label: 'Idea',         patterns: [/\bidea\b/i, /\bvalidation\b/i, /\bvalidating\b/i, /\bwhy start/i, /\bshould i start/i, /\bpre.?idea\b/i] },
  { slug: 'pre-seed',   label: 'Pre-Seed',     patterns: [/\bpre.?seed\b/i, /\bfirst.cheque/i, /\bfirst.?check\b/i, /\bfriends.and.family\b/i, /\bangel\b/i, /\bmvp\b/i] },
  { slug: 'seed',       label: 'Seed',         patterns: [/\bseed\b/i, /\bseries.seed\b/i, /\bproduct.market.fit\b/i, /\bpmf\b/i] },
  { slug: 'series-a',   label: 'Series A',     patterns: [/\bseries.?a\b/i, /\bscaling\b/i, /\bscale.up\b/i, /\bgrowth.stage\b/i] },
  { slug: 'series-b',   label: 'Series B+',    patterns: [/\bseries.?b\b/i, /\bseries.?c\b/i, /\blate.stage\b/i, /\bgrowth.round/i] },
  { slug: 'bridge',     label: 'Bridge/Extension', patterns: [/\bbridge.round\b/i, /\bextension.round\b/i, /\bdown.round\b/i, /\brunway.extension\b/i] },
  { slug: 'exit',       label: 'Exit',         patterns: [/\bexit\b/i, /\bacquisition\b/i, /\bacquir/i, /\bm&a\b/i, /\bipo\b/i, /\bsell.your.(business|company|startup)\b/i, /\bsale of\b/i] },
  { slug: 'any-stage',  label: 'Any Stage',    patterns: [] }, // catchall
];

// Topic: what is the post actually about?
const TOPICS = [
  { slug: 'pitch-deck',      label: 'Pitch Deck',      patterns: [/\bdeck\b/i, /\bpitch\b/i, /\bslide\b/i, /\bstorytelling\b/i, /\bnarrative\b/i] },
  { slug: 'financial-model', label: 'Financial Model', patterns: [/\bfinancial.model/i, /\bmodel(ling|ing)\b/i, /\bforecast/i, /\bprojection/i, /\bp&l\b/i, /\bpnl\b/i, /\bexcel\b/i] },
  { slug: 'unit-economics',  label: 'Unit Economics',  patterns: [/\bunit.economics\b/i, /\bcac\b/i, /\bltv\b/i, /\bpayback\b/i, /\bcontribution margin\b/i, /\bgross margin\b/i, /\bchurn\b/i] },
  { slug: 'metrics-kpis',    label: 'Metrics & KPIs',  patterns: [/\bkpi\b/i, /\bmetric/i, /\bnorth.star\b/i, /\bdashboard\b/i, /\bmrr\b/i, /\barr\b/i, /\bretention\b/i] },
  { slug: 'cap-table',       label: 'Cap Table',       patterns: [/\bcap.table\b/i, /\bcaptable\b/i, /\bequity\b/i, /\boption.pool\b/i, /\bdilution\b/i, /\bvesting\b/i, /\bshareholder/i] },
  { slug: 'term-sheet',      label: 'Term Sheets',     patterns: [/\bterm.sheet\b/i, /\bliquidation.preference\b/i, /\bpreferred.shares?\b/i, /\banti.dilution\b/i, /\bprotective.provision/i, /\bboard.seat\b/i] },
  { slug: 'valuation',       label: 'Valuation',       patterns: [/\bvaluation\b/i, /\bpre.money\b/i, /\bpost.money\b/i, /\bsafe\b/i, /\bconvertible\b/i, /\bdiscount.rate\b/i] },
  { slug: 'investor-relations', label: 'Investor Relations', patterns: [/\binvestor.update/i, /\bboard.meeting\b/i, /\binvestor.relation/i, /\bdata.room\b/i, /\bdue.diligence\b/i, /\bdd\b/i] },
  { slug: 'burn-runway',     label: 'Burn & Runway',   patterns: [/\bburn\b/i, /\brunway\b/i, /\bcash.out\b/i, /\bzero.cash\b/i, /\bdefault.alive\b/i, /\bdefault.dead\b/i] },
  { slug: 'growth-gtm',      label: 'Growth / GTM',    patterns: [/\bgrowth\b/i, /\bgtm\b/i, /\bgo.to.market\b/i, /\bacquisition\b/i, /\bchannel/i, /\bmarketing\b/i, /\bsales\b/i] },
  { slug: 'exit-planning',   label: 'Exit Planning',   patterns: [/\bexit\b/i, /\bacquisition\b/i, /\bm&a\b/i, /\bsell.your\b/i, /\bwaterfall\b/i, /\bsuccession\b/i] },
  { slug: 'ai-finance',      label: 'AI in Finance',   patterns: [/\bai\b/i, /\bartificial.intelligence\b/i, /\bmachine.learning\b/i, /\bllm\b/i, /\bautomation\b/i] },
  { slug: 'founder-psychology', label: 'Founder Psychology', patterns: [/\bfounder.(mindset|psychology|story|journey)/i, /\bburnout\b/i, /\bresilience\b/i, /\bmental.health\b/i, /\bcofounder.conflict\b/i] },
  { slug: 'fundraising-general', label: 'Fundraising', patterns: [] }, // catchall
];

// Lens: what kind of content is this?
const LENSES = [
  { slug: 'framework',  label: 'Framework',  patterns: [/\bframework\b/i, /\bmodel\b/i, /\bmethod/i, /\bprinciple/i, /\bsystem\b/i, /\brule\b/i, /\bformula\b/i, /\btemplate\b/i] },
  { slug: 'warning',    label: 'Watch-outs', patterns: [/\bmistake/i, /\bavoid\b/i, /\bkiller\b/i, /\bred.flag\b/i, /\bwarning\b/i, /\btrap\b/i, /\bdon'?t\b/i, /\bdeath\b/i, /\bfail/i] },
  { slug: 'insider',    label: 'Insider',    patterns: [/\bwhat.vcs\b/i, /\bwhat.investors\b/i, /\bbehind.the.scenes\b/i, /\binside\b/i, /\bsecret/i, /\binsider\b/i, /\buntold\b/i, /\breal.truth\b/i] },
  { slug: 'comparison', label: 'Comparison', patterns: [/\bvs\b/i, /\bcompar/i, /\bwhich\b.*\b(to|should|is)\b/i, /\bor\s+\w+\?/i, /\bbetter than\b/i] },
  { slug: 'story',      label: 'Story / Case Study', patterns: [/\bcase study\b/i, /\bstory\b/i, /\bjourney\b/i, /\bhow\s+\w+\s+raised\b/i, /\bhow\s+\w+\s+built\b/i, /\blessons from\b/i, /\bwhat\s+\w+\s+taught\b/i] },
  { slug: 'how-to',     label: 'How-to',     patterns: [/\bhow.to\b/i, /\bguide\b/i, /\bstep.by.step\b/i, /\bchecklist\b/i, /\bwalkthrough\b/i] },
];

// ---------- Load posts ----------

function loadPosts() {
  let src = fs.readFileSync(BLOG_DATA_PATH, 'utf8');
  // vm.runInContext doesn't attach top-level `const` to the sandbox global,
  // so rewrite the top-level const to var for the data array.
  src = src.replace(/^const\s+BLOG_ARTICLES\s*=/m, 'var BLOG_ARTICLES =');
  const sb = {};
  vm.createContext(sb);
  vm.runInContext(src, sb);
  if (!Array.isArray(sb.BLOG_ARTICLES)) {
    throw new Error('BLOG_ARTICLES is not an array after evaluating blog_data.js');
  }
  return sb.BLOG_ARTICLES;
}

// ---------- Assignment ----------

function scoredPick(post, vocab, fallbackSlug) {
  const hay = (post.slug + ' ' + post.title + ' ' + (post.tldr || '') + ' ' + (post.category || '')).toLowerCase();
  let best = { slug: fallbackSlug, score: 0 };
  for (const item of vocab) {
    if (!item.patterns || item.patterns.length === 0) continue;
    let score = 0;
    for (const re of item.patterns) {
      if (re.test(hay)) score += 1;
    }
    // Slug match bonus.
    if (post.slug && post.slug.toLowerCase().includes(item.slug.replace(/-/g, ''))) score += 2;
    if (score > best.score) best = { slug: item.slug, score: score };
  }
  return best.slug;
}

function assignStage(post) {
  return scoredPick(post, STAGES, 'any-stage');
}

function assignTopic(post) {
  // Category hint: rough pre-map of existing categories to topics.
  const categoryMap = {
    'Fundraising': 'fundraising-general',
    'Financial Modeling': 'financial-model',
    'Unit Economics': 'unit-economics',
    'Exit Planning': 'exit-planning',
    'AI in Finance': 'ai-finance',
    'Tool Guides': 'financial-model',
    'Founder Stories': 'founder-psychology',
    'Finance Operations': 'metrics-kpis',
    'Finance Ops': 'metrics-kpis',
    'Deep Dives': 'fundraising-general',
    'Start Ready': 'fundraising-general',
  };
  const fallback = categoryMap[post.category] || 'fundraising-general';
  return scoredPick(post, TOPICS, fallback);
}

function assignLens(post) {
  return scoredPick(post, LENSES, 'how-to');
}

// ---------- Main ----------

function main() {
  const posts = loadPosts();
  let existing = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    } catch (e) {
      console.warn('[tags] existing post_tags.json is not valid JSON, starting fresh.');
    }
  }

  const out = {};
  const stats = { stage: {}, topic: {}, lens: {}, overrides: 0 };

  for (const post of posts) {
    const slug = post.slug;
    if (!slug) continue;
    if (existing[slug] && existing[slug]._manualOverride) {
      out[slug] = existing[slug];
      stats.overrides += 1;
      continue;
    }
    const entry = {
      stage: assignStage(post),
      topic: assignTopic(post),
      lens: assignLens(post),
    };
    out[slug] = entry;
    stats.stage[entry.stage] = (stats.stage[entry.stage] || 0) + 1;
    stats.topic[entry.topic] = (stats.topic[entry.topic] || 0) + 1;
    stats.lens[entry.lens] = (stats.lens[entry.lens] || 0) + 1;
  }

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + '\n');

  console.log('[tags] wrote ' + posts.length + ' post entries to ' + path.relative(REPO_ROOT, OUTPUT_PATH));
  console.log('[tags] manual overrides preserved: ' + stats.overrides);
  console.log('[tags] stage distribution:');
  Object.keys(stats.stage).sort().forEach(function (k) { console.log('  ' + k.padEnd(20) + stats.stage[k]); });
  console.log('[tags] topic distribution:');
  Object.keys(stats.topic).sort().forEach(function (k) { console.log('  ' + k.padEnd(22) + stats.topic[k]); });
  console.log('[tags] lens distribution:');
  Object.keys(stats.lens).sort().forEach(function (k) { console.log('  ' + k.padEnd(14) + stats.lens[k]); });
}

main();
