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
 *   counter-tools     → class="tool-card" count in tools/index.html
 *   counter-books     → static constant (books don't change often)
 *   counter-articles  → *.html files in blog/ excluding blog/index.html
 *   counter-software  → sub-directories in software/
 *
 * Patches two locations in index.html (both must match for the animated
 * counter to work correctly):
 *   1. HTML: data-target="NNN"  on the counter <div> elements
 *   2. JS:   { target: NNN, suffix: '...' }  in the counterElements object
 *
 * Idempotent: safe to run on every build or locally.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

// ─── Count helpers ────────────────────────────────────────────────────────────

/**
 * Count elements where the class attribute starts with exactly className.
 * Matches: class="tool-card" or class="tool-card featured"
 * Does NOT match: class="tool-card-cover" (child component, not a card)
 */
function countExactClass(filePath, className) {
  if (!fs.existsSync(filePath)) return 0;
  const src = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp(`class="${className}(?:"| )`, 'g');
  return (src.match(re) || []).length;
}

/**
 * Count *.html files in a directory, optionally excluding a set of filenames.
 */
function countHtmlFiles(dir, exclude) {
  exclude = exclude || [];
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter(function(f) { return f.endsWith('.html') && exclude.indexOf(f) === -1; })
    .length;
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

// Books rarely change; keep as a static constant.
// Increment BOOK_COUNT manually when a new book is published.
var BOOK_COUNT = 4;

var counts = {
  tools:    countExactClass(path.join(ROOT, 'tools', 'index.html'), 'tool-card'),
  books:    BOOK_COUNT,
  articles: countHtmlFiles(path.join(ROOT, 'blog'), ['index.html']),
  software: countSubDirs(path.join(ROOT, 'software')),
};

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
  '  Free tools  -> ' + counts.tools + '\n' +
  '  Books       -> ' + counts.books + '\n' +
  '  Articles    -> ' + counts.articles + '\n' +
  '  Software    -> ' + counts.software
);
