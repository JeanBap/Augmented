/**
 * components.js - Shared navigation, footer, and tracking components
 * Injects nav and footer into pages with #site-nav and #site-footer placeholders
 */

// Meta Pixel - fires immediately (before DOMContentLoaded)
(function() {
  var PIXEL_ID = '1298416075475311';
  if (!PIXEL_ID) return;
  if (window.fbq) return
  var n = window.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!window._fbq) window._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  var t = document.createElement('script'); t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(t, s);
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
  // ViewContent for product pages
  var path = window.location.pathname.toLowerCase();
  if (path.includes('/book/') || path.includes('/start-ready') || path.includes('/raise-ready') || path.includes('/exit-ready')) {
    fbq('track', 'ViewContent', { content_name: document.title, content_type: 'product' });
  }
  // Lead tracking on form submissions
  document.addEventListener('submit', function(e) {
    if (e.target.querySelectorAll('input[type="email"]').length > 0) {
      fbq('track', 'Lead', { content_name: 'Email Signup', content_category: 'lead_magnet' });
    }
  });
  // Add noscript fallback
  var ns = document.createElement('noscript');
  var img = document.createElement('img');
  img.height = 1; img.width = 1; img.style.display = 'none';
  img.src = 'https://www.facebook.com/tr?id=' + PIXEL_ID + '&ev=PageView&noscript=1';
  ns.appendChild(img);
  document.body.appendChild(ns);
})();

(function() {
  'use strict';

  // Brevo newsletter handler (rr-brevo-form). Binds in capture phase and
  // stopImmediatePropagation so the older .newsletter-form email-gate handlers
  // below do not also fire. Submits to /.netlify/functions/subscribe-newsletter.
  function initBrevoNewsletter() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (!form || form.id !== 'rr-brevo-form') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var input = form.querySelector('input[type="email"]');
      var btn = form.querySelector('button[type="submit"]');
      var section = form.closest('.rr-brevo-newsletter');
      var msg = section ? section.querySelector('.rr-brevo-msg') : null;
      var email = input ? input.value.trim() : '';
      if (!email) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
      if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
      fetch('/.netlify/functions/subscribe-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, body: j }; }); })
      .then(function(res) {
        if (res.ok && res.body && res.body.success) {
          if (msg) {
            msg.style.display = 'block';
            msg.style.color = '#c8a45a';
            msg.textContent = 'You are in. The Raise Ready Weekly lands in your inbox Fridays.';
          }
          if (input) input.value = '';
          if (btn) { btn.textContent = 'Subscribed'; }
          if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Brevo Newsletter Signup' });
        } else {
          if (msg) {
            msg.style.display = 'block';
            msg.style.color = '#e06c6c';
            msg.textContent = (res.body && res.body.error) ? res.body.error : 'Something went wrong. Please try again.';
          }
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        }
      })
      .catch(function() {
        if (msg) {
          msg.style.display = 'block';
          msg.style.color = '#e06c6c';
          msg.textContent = 'Network error. Please try again.';
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
      });
    }, true); // capture phase
  }

  const NAV_HTML = `
    <a href="#main" class="skip-to-content">Skip to main content</a>
    <header>
    <nav>
      <a href="/" class="logo"><img src="/logo.svg" alt="Raise Ready" style="height:38px;"></a>
      <div class="nav-tabs">
        <div class="nav-dropdown">
          <a href="/book/" class="nav-tab" data-page="products">Products</a>
          <div class="dropdown-menu">
            <a href="/book/">Books</a>
            <a href="/templates/">Templates</a>
            <a href="/tools/">Tools</a>
            <a href="/software/">Software</a>
          </div>
        </div>
        <a href="/blog/" class="nav-tab" data-page="blog">Blog</a>
        <a href="/services/" class="nav-tab" data-page="services">Services</a>
        <a href="/founder-questionnaire.html" class="nav-tab nav-tab-cta" data-page="questionnaire" style="background:var(--gold,#c8a45a);color:var(--ink,#08080d);padding:0.35rem 1rem;border-radius:6px;font-weight:700;font-size:0.85rem;white-space:nowrap;">Start Here</a>
      </div>
      <div class="nav-right">
        <button class="hamburger" aria-label="Menu" onclick="document.querySelector('.nav-tabs').classList.toggle('mobile-open'); this.classList.toggle('open')">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    </header>
  `;

  const FOOTER_HTML = `
    <footer>
      <div class="footer-links">
        <a href="/book/">Books</a>
        <a href="/templates/">Templates</a>
        <a href="/tools/">Tools</a>
        <a href="/software/">Software</a>
        <a href="/blog/">Blog</a>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </div>
      <span>&copy; <span class="footer-year"></span> Raise Ready</span>
      <span>Fundraising Intelligence for Founders</span>
    </footer>
  `;

  /**
   * Initialize navigation and footer components
   */
  function initializeComponents() {
    // Inject nav into #site-nav placeholder.
    // Idempotency: the build step (scripts/inject-static-scaffolding.js) now
    // pre-renders NAV_HTML into the raw HTML so Googlebot sees a full nav on
    // first paint. If that injection has already happened, the placeholder
    // has children, so we skip the runtime assignment to avoid a flash of
    // duplicated markup during hydration. We still call setActiveNavTab so
    // the active state gets applied to the pre-rendered nav.
    const navPlaceholder = document.getElementById('site-nav');
    if (navPlaceholder) {
      if (!navPlaceholder.children.length) {
        navPlaceholder.innerHTML = NAV_HTML;
      }
      setActiveNavTab();
    }

    // Inject footer into #site-footer placeholder (same idempotency pattern).
    const footerPlaceholder = document.getElementById('site-footer');
    if (footerPlaceholder) {
      if (!footerPlaceholder.children.length) {
        footerPlaceholder.innerHTML = FOOTER_HTML;
      }
      const yearSpan = footerPlaceholder.querySelector('.footer-year');
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    }

    // Add labels to newsletter form inputs for accessibility
    document.querySelectorAll('.newsletter-form input[type="email"]').forEach(function(input) {
      if (!input.id) input.id = 'newsletter-email';
      if (!input.parentElement.querySelector('label[for="' + input.id + '"]')) {
        var label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.className = 'sr-only';
        label.textContent = 'Email address';
        input.parentElement.insertBefore(label, input);
      }
    });
  }

  /**
   * Set active nav tab based on body data-page attribute
   * Maps book, templates, tools, software pages to 'products' tab
   */
  function setActiveNavTab() {
    const currentPage = document.body.getAttribute('data-page');
    if (!currentPage) return;

    // Map product-related pages to 'products' tab
    const productPages = ['book', 'templates', 'tools', 'software'];
    const pageToMatch = productPages.includes(currentPage) ? 'products' : currentPage;

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      const tabPage = tab.getAttribute('data-page');
      if (tabPage === pageToMatch) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents);
  } else {
    initializeComponents();
  }

  // Expose setActiveNavTab for manual updates
  window.setActiveNavTab = setActiveNavTab;

  /* ===================================================================
   * CONVERSION ELEMENTS (Issues 2B, 3A, 4A)
   * - Timed popup (30s) for checklist lead magnet
   * - Blog post inline CTA + bottom newsletter form
   * - Sticky bottom bar with email capture
   * =================================================================== */

  /**
   * Issue 4A: Sticky bottom bar with checklist offer
   * Appears on all pages. Hides after submit or dismiss. Respects localStorage.
   */
  function initStickyBar() {
    if (localStorage.getItem('rr_sticky_dismissed')) return;

    // Context-aware copy for the sticky bar
    var path = window.location.pathname.toLowerCase();
    var barLabel = 'Free: 90-Minute Financial Model Audit Checklist';
    if (path.indexOf('/tools/') >= 0 && path.indexOf('financial-model') < 0) {
      barLabel = 'Free: SaaS Metrics Cheat Sheet for Founders';
    } else if (path.indexOf('financial-model') >= 0) {
      barLabel = 'Like this tool? Get the complete Financial Model Template ($29)';
    } else if (path.indexOf('/services/') >= 0) {
      barLabel = 'Not sure which service? Book a free 15-min call';
    }

    var bar = document.createElement('div');
    bar.id = 'rr-sticky-bar';
    bar.innerHTML =
      '<form id="rr-sticky-form" style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;justify-content:center;">' +
        '<span style="font-family:var(--serif,Georgia,serif);font-size:0.9rem;color:#f2ede4;">' + barLabel + '</span>' +
        '<input type="email" id="rr-sticky-email" placeholder="you@company.com" required style="padding:0.5rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.8rem;background:#1a1a1f;color:#f2ede4;width:200px;">' +
        '<button type="submit" style="padding:0.5rem 1.2rem;background:#c8a45a;color:#08080d;border:none;border-radius:6px;font-family:monospace;font-size:0.8rem;font-weight:500;cursor:pointer;">Send</button>' +
      '</form>' +
      '<button id="rr-sticky-close" aria-label="Close" style="position:absolute;top:0.4rem;right:0.6rem;background:none;border:none;color:#6e6a61;font-size:1.2rem;cursor:pointer;padding:0.2rem;">&times;</button>';

    var s = bar.style;
    s.position = 'fixed'; s.bottom = '0'; s.left = '0'; s.right = '0';
    s.background = '#08080d'; s.borderTop = '1px solid #3a3830';
    s.padding = '0.75rem 2rem'; s.zIndex = '999';
    s.textAlign = 'center'; s.transition = 'transform 0.3s ease';

    document.body.appendChild(bar);

    bar.querySelector('#rr-sticky-close').addEventListener('click', function() {
      bar.style.transform = 'translateY(100%)';
      localStorage.setItem('rr_sticky_dismissed', '1');
    });

    bar.querySelector('#rr-sticky-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = bar.querySelector('#rr-sticky-email').value.trim();
      if (!email) return;
      fetch('/.netlify/functions/email-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, tool: 'newsletter-audit-checklist' })
      }).then(function() {
        bar.querySelector('#rr-sticky-form').innerHTML =
          '<span style="font-family:monospace;font-size:0.85rem;color:#c8a45a;">Check your inbox. The checklist is on its way.</span>';
        setTimeout(function() {
          bar.style.transform = 'translateY(100%)';
          localStorage.setItem('rr_sticky_dismissed', '1');
        }, 3000);
      });
      if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Sticky Bar Signup' });
    });
  }

  /**
   * Issue 2B: Timed popup (30s) for checklist lead magnet
   * Shows once per visitor after 30 seconds on the page.
   */
  function initTimedPopup() {
    if (localStorage.getItem('rr_popup_shown')) return;

    setTimeout(function() {
      if (localStorage.getItem('rr_popup_shown')) return;

      var overlay = document.createElement('div');
      overlay.id = 'rr-popup-overlay';
      var os = overlay.style;
      os.position = 'fixed'; os.inset = '0'; os.background = 'rgba(0,0,0,0.6)';
      os.zIndex = '1100'; os.display = 'flex'; os.alignItems = 'center';
      os.justifyContent = 'center'; os.padding = '1rem';

      overlay.innerHTML =
        '<div id="rr-popup-box" style="background:#f2ede4;border-radius:12px;padding:2.5rem;max-width:420px;width:100%;position:relative;color:#08080d;">' +
          '<button id="rr-popup-close" style="position:absolute;top:0.75rem;right:1rem;background:none;border:none;font-size:1.5rem;color:#6e6a61;cursor:pointer;">&times;</button>' +
          '<p style="font-family:monospace;font-size:0.7rem;color:#c8a45a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.75rem;">Free Download</p>' +
          '<h3 style="font-family:Georgia,serif;font-size:1.4rem;margin:0 0 0.5rem;line-height:1.3;">The 90-Minute Financial Model Audit Checklist</h3>' +
          '<p style="font-size:0.9rem;color:#6e6a61;margin:0 0 1.5rem;line-height:1.5;">The same checklist used to audit models with 3,600+ formulas. Find errors before your investors do.</p>' +
          '<form id="rr-popup-form" style="display:flex;gap:0.5rem;">' +
            '<input type="email" id="rr-popup-email" placeholder="you@company.com" required style="flex:1;padding:0.7rem 0.75rem;border:1.5px solid #d5d0c7;border-radius:8px;font-family:monospace;font-size:0.85rem;background:#fff;color:#08080d;">' +
            '<button type="submit" style="padding:0.7rem 1.5rem;background:#c8a45a;color:#08080d;border:none;border-radius:8px;font-family:Georgia,serif;font-weight:700;font-size:0.9rem;cursor:pointer;white-space:nowrap;">Send</button>' +
          '</form>' +
          '<p style="font-family:monospace;font-size:0.7rem;color:#a09b90;margin:0.75rem 0 0;text-align:center;">No spam. Unsubscribe anytime.</p>' +
          '<div id="rr-popup-status" style="display:none;text-align:center;margin-top:1rem;font-family:monospace;font-size:0.85rem;color:#c8a45a;"></div>' +
        '</div>';

      document.body.appendChild(overlay);
      localStorage.setItem('rr_popup_shown', '1');

      function closePopup() { overlay.remove(); }
      overlay.querySelector('#rr-popup-close').addEventListener('click', closePopup);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', handler); }
      });

      overlay.querySelector('#rr-popup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var email = overlay.querySelector('#rr-popup-email').value.trim();
        if (!email) return;
        fetch('/.netlify/functions/email-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, tool: 'newsletter-audit-checklist' })
        }).then(function() {
          overlay.querySelector('#rr-popup-form').style.display = 'none';
          var st = overlay.querySelector('#rr-popup-status');
          st.style.display = 'block';
          st.textContent = 'Check your inbox. The checklist is on its way.';
          // Also hide the sticky bar since they just signed up
          var stickyBar = document.getElementById('rr-sticky-bar');
          if (stickyBar) { stickyBar.style.transform = 'translateY(100%)'; localStorage.setItem('rr_sticky_dismissed', '1'); }
          setTimeout(closePopup, 3000);
        });
        if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Timed Popup Signup' });
      });
    }, 30000); // 30 seconds
  }

  /**
   * Handle mid-article email capture form submission
   */
  function handleBlogInlineSignup(e) {
    e.preventDefault();
    var form = e.target;
    var email = form.querySelector('input[type="email"]').value.trim();
    if (!email) return false;

    fetch('/.netlify/functions/email-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, tool: 'blog-inline-checklist' })
    }).then(function() {
      // Replace form with success message
      var container = form.closest('.blog-inline-cta');
      if (container) {
        container.innerHTML = '<p style="font-family:var(--mono);font-size:0.85rem;color:var(--gold);text-align:center;margin:0;">Check your inbox. The checklist is on its way.</p>';
      }
      if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Blog Inline Checklist' });
    });
    return false;
  }
  window.handleBlogInlineSignup = handleBlogInlineSignup;

  /**
   * Inject mid-article email capture after the 3rd paragraph
   */
  function initBlogParagraphCTA() {
    if (document.body.getAttribute('data-page') !== 'blog') return;
    var article = document.querySelector('.blog-article');
    if (!article) return;

    // Find all paragraph tags in the article
    var paragraphs = article.querySelectorAll('p');
    if (paragraphs.length < 3) return;

    // Get the 3rd paragraph
    var thirdParagraph = paragraphs[2];

    // Create the email capture HTML
    var ctaDiv = document.createElement('div');
    ctaDiv.className = 'blog-inline-cta';
    ctaDiv.style.cssText = 'margin:2rem 0;padding:1.5rem 2rem;border:1px solid var(--rule);border-radius:10px;background:var(--paper);';
    ctaDiv.innerHTML =
      '<p style="font-family:var(--serif);font-size:1.1rem;margin:0 0 0.5rem;">Get the free Financial Model Audit Checklist</p>' +
      '<p style="font-family:var(--mono);font-size:0.75rem;color:var(--mid);margin:0 0 1rem;">90 checks. Used by 47+ founders before investor meetings.</p>' +
      '<form class="blog-inline-form" style="display:flex;gap:0.5rem;" onsubmit="return handleBlogInlineSignup(event)">' +
        '<input type="email" placeholder="you@company.com" required style="flex:1;padding:0.6rem 1rem;border:1px solid var(--rule);border-radius:6px;font-size:0.85rem;font-family:var(--mono);">' +
        '<button type="submit" style="padding:0.6rem 1.5rem;background:var(--gold);color:#fff;border:none;border-radius:6px;font-family:var(--mono);font-size:0.8rem;cursor:pointer;white-space:nowrap;">Get It Free</button>' +
      '</form>';

    // Insert after the 3rd paragraph
    thirdParagraph.parentNode.insertBefore(ctaDiv, thirdParagraph.nextSibling);
  }

  /**
   * Inject BlogPosting JSON-LD schema on individual blog post pages
   */
  function initBlogSchema() {
    if (document.body.getAttribute('data-page') !== 'blog') return;
    if (!document.querySelector('.blog-article')) return;
    // Check if we're on an individual post (not the blog index)
    if (window.location.pathname === '/blog/' || window.location.pathname === '/blog/index.html') return;

    // Skip if a BlogPosting schema already exists on the page
    var existing = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < existing.length; i++) {
      try { if (JSON.parse(existing[i].textContent)['@type'] === 'BlogPosting') return; } catch(e) {}
    }

    var title = document.querySelector('h1')?.textContent || document.title;
    var description = document.querySelector('meta[name="description"]')?.content || '';
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "author": {"@type": "Person", "name": "Yanni Papoutsi"},
      "publisher": {"@type": "Organization", "name": "Raise Ready", "url": "https://www.raisereadybook.com"},
      "url": window.location.href,
      "mainEntityOfPage": window.location.href
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Issue 3A: Blog post inline CTA + bottom newsletter form
   * Injects a contextual CTA midway and a newsletter form at the bottom of every blog article.
   */
  function initBlogCTAs() {
    if (document.body.getAttribute('data-page') !== 'blog') return;
    var article = document.querySelector('.blog-article');
    if (!article) return;

    // Detect blog category for contextual CTAs
    var categoryEl = document.querySelector('.blog-category, [data-category]');
    var category = (categoryEl && (categoryEl.getAttribute('data-category') || categoryEl.textContent || '')).toLowerCase().trim();

    // Category-aware tool/service cross-sell (injected before the lead magnet CTA)
    var toolCTA = '';
    if (category.indexOf('financial') >= 0 || category.indexOf('model') >= 0 || category.indexOf('unit-econ') >= 0) {
      toolCTA = '<div style="border:1px solid rgba(200,164,90,0.3);border-radius:10px;padding:1.25rem;margin:2rem 0;background:rgba(200,164,90,0.04);">' +
        '<p style="font-family:Georgia,serif;font-size:1rem;margin:0 0 0.4rem;">Build your model in minutes</p>' +
        '<p style="font-size:0.85rem;color:#6e6a61;margin:0 0 0.75rem;">Try the free 5-Year Financial Model Builder with 3 scenarios, hiring plan, and board report.</p>' +
        '<a href="/tools/financial-model-pro.html" style="font-family:monospace;font-size:0.85rem;color:#c8a45a;text-decoration:none;">Launch the model &rarr;</a></div>';
    } else if (category.indexOf('fundrais') >= 0) {
      toolCTA = '<div style="border:1px solid rgba(200,164,90,0.3);border-radius:10px;padding:1.25rem;margin:2rem 0;background:rgba(200,164,90,0.04);">' +
        '<p style="font-family:Georgia,serif;font-size:1rem;margin:0 0 0.4rem;">Not sure if you are ready to raise?</p>' +
        '<p style="font-size:0.85rem;color:#6e6a61;margin:0 0 0.75rem;">Get a 2-3 hour deep-dive audit of your model, deck, and data room. Scored report included.</p>' +
        '<a href="/services/" style="font-family:monospace;font-size:0.85rem;color:#c8a45a;text-decoration:none;">View the Readiness Audit ($990) &rarr;</a></div>';
    } else if (category.indexOf('exit') >= 0) {
      toolCTA = '<div style="border:1px solid rgba(200,164,90,0.3);border-radius:10px;padding:1.25rem;margin:2rem 0;background:rgba(200,164,90,0.04);">' +
        '<p style="font-family:Georgia,serif;font-size:1rem;margin:0 0 0.4rem;">Planning your exit?</p>' +
        '<p style="font-size:0.85rem;color:#6e6a61;margin:0 0 0.75rem;">30 free exit planning tools covering valuation, deal structure, tax, and readiness.</p>' +
        '<a href="/tools/exit-ready/" style="font-family:monospace;font-size:0.85rem;color:#c8a45a;text-decoration:none;">Explore Exit Ready Tools &rarr;</a></div>';
    }

    // Find all h3 headings to insert the inline CTA roughly midway
    var headings = article.querySelectorAll('h3');
    if (headings.length >= 4) {
      var midIndex = Math.floor(headings.length / 2);
      var midHeading = headings[midIndex];

      // Insert contextual tool CTA slightly before the lead magnet
      if (toolCTA && headings.length >= 6) {
        var earlyIndex = Math.floor(headings.length / 3);
        var earlyDiv = document.createElement('div');
        earlyDiv.innerHTML = toolCTA;
        headings[earlyIndex].parentNode.insertBefore(earlyDiv.firstChild, headings[earlyIndex]);
      }

      var inlineCTA = document.createElement('div');
      inlineCTA.style.cssText = 'border:1px solid #3a3830;border-radius:10px;padding:1.5rem;margin:2rem 0;background:rgba(200,164,90,0.04);';
      inlineCTA.innerHTML =
        '<p style="font-family:monospace;font-size:0.7rem;color:#c8a45a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem;">Free Download</p>' +
        '<p style="font-family:Georgia,serif;font-size:1.1rem;margin:0 0 0.5rem;line-height:1.3;">Get the 90-Minute Financial Model Audit Checklist</p>' +
        '<p style="font-size:0.85rem;color:#6e6a61;margin:0 0 1rem;line-height:1.5;">The same framework used to audit models with 3,600+ formulas. Find errors before investors do.</p>' +
        '<form class="rr-inline-cta-form" style="display:flex;gap:0.5rem;max-width:400px;">' +
          '<input type="email" placeholder="you@company.com" required style="flex:1;padding:0.6rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.85rem;background:#08080d;color:#f2ede4;">' +
          '<button type="submit" style="padding:0.6rem 1.2rem;background:#c8a45a;color:#08080d;border:none;border-radius:6px;font-family:monospace;font-size:0.8rem;font-weight:500;cursor:pointer;">Send</button>' +
        '</form>';

      midHeading.parentNode.insertBefore(inlineCTA, midHeading);

      inlineCTA.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        var email = this.querySelector('input').value.trim();
        if (!email) return;
        fetch('/.netlify/functions/email-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, tool: 'newsletter-audit-checklist' })
        }).then(function() {
          inlineCTA.innerHTML = '<p style="font-family:monospace;font-size:0.9rem;color:#c8a45a;text-align:center;margin:0;">Check your inbox. The checklist is on its way.</p>';
        });
        if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Blog Inline CTA' });
      });
    }

    // Add newsletter signup form before the author bio
    var authorBio = article.parentElement.querySelector('.author-bio');
    var insertTarget = authorBio || article;
    var nlSection = document.createElement('div');
    nlSection.style.cssText = 'padding:2rem;margin:2rem 0;border:1px solid #3a3830;border-radius:10px;background:rgba(200,164,90,0.04);text-align:center;';
    nlSection.innerHTML =
      '<p style="font-family:Georgia,serif;font-size:1.15rem;margin:0 0 0.5rem;">Stay sharp on startup finance</p>' +
      '<p style="font-size:0.85rem;color:#6e6a61;margin:0 0 1.25rem;">Weekly articles on fundraising, financial modeling, and exit strategy. No spam.</p>' +
      '<form class="rr-blog-nl-form" style="display:flex;gap:0.5rem;max-width:400px;margin:0 auto;">' +
        '<input type="email" placeholder="you@company.com" required style="flex:1;padding:0.7rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.85rem;background:#08080d;color:#f2ede4;">' +
        '<button type="submit" style="padding:0.7rem 1.5rem;background:#c8a45a;color:#08080d;border:none;border-radius:6px;font-family:monospace;font-size:0.85rem;font-weight:500;cursor:pointer;">Subscribe</button>' +
      '</form>';

    if (authorBio) {
      authorBio.parentNode.insertBefore(nlSection, authorBio);
    } else {
      article.appendChild(nlSection);
    }

    nlSection.querySelector('form').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = this.querySelector('input').value.trim();
      if (!email) return;
      fetch('/.netlify/functions/email-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, tool: 'newsletter-audit-checklist' })
      }).then(function() {
        nlSection.innerHTML = '<p style="font-family:monospace;font-size:0.9rem;color:#c8a45a;margin:0;">You are in. Check your inbox for the checklist.</p>';
      });
      if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: 'Blog Newsletter Signup' });
    });
  }

  /**
   * Initialize all conversion elements
   */
  function initConversionElements() {
    try { initStickyBar(); } catch (e) { console.error('initStickyBar failed', e); }
    try { initTimedPopup(); } catch (e) { console.error('initTimedPopup failed', e); }
    try { initBlogParagraphCTA(); } catch (e) { console.error('initBlogParagraphCTA failed', e); }
    try { initBlogSchema(); } catch (e) { console.error('initBlogSchema failed', e); }
    try { initBlogCTAs(); } catch (e) { console.error('initBlogCTAs failed', e); }
  }

  // Attach Brevo handler immediately (document-level listener, safe before DOM ready)
  try { initBrevoNewsletter(); } catch (e) { console.error('initBrevoNewsletter failed', e); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConversionElements);
  } else {
    initConversionElements();
  }

})();
