# Augmented — raisereadybook.com

Static site on **Netlify** (no framework, no SSR). Deploys from `main` branch.
Repo: `JeanBap/Augmented`. Domain: `www.raisereadybook.com`.

## Build

```
netlify.toml → build command runs 7 scripts in order:
  1. inject-static-scaffolding.js  — injects NAV_HTML + FOOTER_HTML from shared/components.js
                                      into every page with empty <div id="site-nav"></div> placeholder
  2. generate-tag-hubs.js
  3. inject-post-seo.js
  4. sync-robots-meta.js
  5. generate-sitemap.js
  6. patch-counters.js
  7. ping-search-engines.js
```

**Key rule:** New HTML pages MUST use empty `<div id="site-nav"></div>` and `<div id="site-footer"></div>` placeholders. The build step fills them. The runtime `shared/components.js` is idempotent (skips if children already exist).

## Folder map

```
/                       — index.html (homepage)
/blog/                  — 328 static blog posts (.html), drip-scheduled via publish_schedule.json
/tools/                 — 72 interactive tool pages (HTML + inline JS)
/software/              — listing page → links to:
  /financial-model-builder/  — standalone product page (13 views)
  /personal-finance-tools/   — standalone product page (18 tools)
/book/                  — book landing pages
/pillars/               — 5 pillar/guide pages
/templates/             — template pages
/products/              — 13 product download/gated dirs (pf001, er-toolkit, rr-toolkit, etc.)
/services/              — services page
/covers/                — book cover images (1.5MB)
/assets/                — site assets (1.1MB)
/shared/                — components.js, style.css, blog_data.js, publish_schedule.json, post_tags.json
/scripts/               — Node build scripts (see Build above)
/data/                  — structured data files
/netlify/functions/     — serverless functions
/admin/                 — admin interface
```

## Analytics / tracking

- Datafast: `dfid_HS9C0iwIwCdxt1LcHos8K`
- GA4: `G-BXXBYNXWZ7`
- Google site verification: `JdCJFGDqrO29TMr70TQofnIEMA82gDS7KFFm421UT7Q`

## Conventions

- All pages share: `/shared/style.css`, `/shared/components.js`
- CSS variables defined in style.css: `--serif`, `--mono`, `--gold`, `--ink`, `--mid`, `--dim`, `--rule`, `--paper`
- Pages set `data-page` on `<body>` for nav active state
- Blog posts are static HTML (not generated). Drip schedule controls visibility at runtime.
- Breadcrumbs use BreadcrumbList JSON-LD schema
- SEO: robots meta, OG tags, twitter cards, canonical URLs on every page

## Branches

- `main` — production (auto-deploys to Netlify)
- Other branches are feature/SEO work; don't commit to them without checking context

## What NOT to touch without reading first

- `shared/components.js` — runtime nav/footer; also source for build-time injection
- `scripts/inject-static-scaffolding.js` — the build step that pre-renders nav/footer
- `shared/publish_schedule.json` — controls blog drip timing
- `netlify.toml` — build pipeline order matters
