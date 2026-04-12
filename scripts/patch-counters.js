#!/usr/bin/env node
/**
 * patch-counters.js
 *
 * Auto-counts site content at build time and patches the animated counter
 * data-target values in index.html. Runs as the LAST step in the Netlify
 * build pipeline so all other scripts (inject-post-seo, generate-tag-hubs,
 * etc.) have already run and the blog/tools dirs reflect the final state.
 *
 * Counters patched:
 *   counter-tools     -> class="tool-card" count in tools/index.html
 *   counter-books     -> static constant (books don't publish automatically)
 *   counter-articles  -> blog/*.html files with publish date <= today
 *                        (same logic as inject-post-seo.js / the blog index)
 *                        Posts not in publish_schedule.json are already live.
 *                        Posts with a future date are not yet visible.
 *   counter-software  -> sub-directories in software/
 *
 * Patches two locations in index.html (both must match for the animated
 * counter to work correctly):
 *   1. HTML: data-target="NNN"  on the counter <div> elements
 *   2. JS:   { target: NNN, suffix: '...' }  in the counterElements object
 *
 * Idempotent: safe to run on every build or locally.
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT       = path.resolve(__dirname, '..');
var INDEX_PATH = path.join(ROOT, 'index.html');

// ISO date string for today: "YYYY-MM-DD" - matches inject-post-seo.js
var TODAY_ISO = new Date().toISOString().split('T')[0];

// ─── Count helpers ────────────────────────────────────────────────────────────

/**
 * Count elements where the class attribute starts with exactly className.
 * Matches: class="tool-card" or class="tool-card featured"
 * Does NOT match: class="tool-card-cover" (child component, not a card)
 */
function countExactClass(filePath, className) {
  if (!fs.existsSync(filePath)) return 0;
  var src = fs.readFileSync(filePath, 'utf8');
  var re = new RegExp('class="' + className + '(?:"| )', 'g');
  return (src.match(re) || []).length;
}

/**
 * Count published blog posts: blog/*.html files where the publish date
 * is <= today or the post has no scheduled date (already live).
 *
 * Mirrors the isPublished() logic in inject-post-seo.js so the counter
 * always matches what visitors can actually see.
 */
function countPublishedPosts(blogDir, scheduleFile) {
  if (!fs.existsSync(blogDir)) return 0;

  // Load schedule: { slug: "YYYY-MM-DD" }
  var schedule = {};
  if (fs.existsSync(scheduleFile)) {
    try { schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8')); } catch (e) { /* ignore */ }
  }

  var htmlFiles = fs.readdirSync(blogDir)
    .filter(function(f) { return f.endsWith('.html') && f !== 'index.html'; });

  var published = htmlFiles.filter(function(f) {
    var slug = f.replace(/\.html$/, '');
    var date = schedule[slug];
    // No entry in schedule = already published; entry must be <= today to be live
    return !date || date <= TODAY_ISO;
  });

  return published.length;
}

/**
 * Count immediate sub-directories in a directory.
 */
function countSubDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter(function(f) { return fs.statSync(path.join(dir, f)).isDirectory(); })
    .length;
}

// ─── Gather counts ────────────────────────────────────────────────────────────

// Books rarely change; increment manually when a new book is published.
// Current books: Start Ready, Raise Ready, Model Ready, Exit Ready, Analytics Ready
var BOOK_COUNT = 5;

var counts = {
  tools:    countExactClass(path.join(ROOT, 'tools', 'index.html'), 'tool-card'),
  books:    BOOK_COUNT,
  articles: countPublishedPosts(
              path.join(ROOT, 'blog'),
              path.join(ROOT, 'shared', 'publish_schedule.json')
            ),
  software: countSubDirs(path.join(ROOT, 'software')),
};

console.log('patch-counters: build date: ' + TODAY_ISO);
console.log('patch-counters: computed counts:', JSON.stringify(counts));

// ─── Patch index.html ─────────────────────────────────────────────────────────

var src = fs.readFileSync(INDEX_PATH, 'utf8');
var original = src;

/**
 * Patch a single counter in both the HTML data-target attribute and the JS
 * counterElements object. Only the numeric target value is replaced.
 */
function patchCounter(html, id, newValue) {
  // 1. HTML: data-target="NNN" on the counter div with matching id
  var htmlRe = new RegExp(
    '(id="counter-' + id + '"[^>]*data-target=")\\d+(")',
    'g'
  );
  html = html.replace(htmlRe, '$1' + newValue + '$2');

  // 2. JS counterElements object: 'counter-<id>': { target: NNN, ... }
  var jsRe = new RegExp(
    "('counter-" + id + "'\\s*:\\s*\\{[^}]*target\\s*:\\s*)\\d+",
    'g'
  );
  html = html.replace(jsRe, '$1' + newValue);

  return html;
}

src = patchCounter(src, 'tools',    counts.tools);
src = patchCounter(src, 'books',    counts.books);
src = patchCounter(src, 'articles', counts.articles);
src = patchCounter(src, 'software', counts.software);

// ─── Write if changed ─────────────────────────────────────────────────────────

if (src !== original) {
  fs.writeFileSync(INDEX_PATH, src, 'utf8');
  console.log('patch-counters: index.html updated');
} else {
  console.log('patch-counters: no changes needed (counts already up to date)');
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(
  'patch-counters: done\n' +
  '  Free tools  -> ' + counts.tools   + '\n' +
  '  Books       -> ' + counts.books   + '\n' +
  '  Articles    -> ' + counts.articles + ' (published as of ' + TODAY_ISO + ')\n' +
  '  Software    -> ' + counts.software
);
