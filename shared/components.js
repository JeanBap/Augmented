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

  const NAV_HTML = `
    <a href="#main" class="skip-to-content">Skip to main content</a>
    <header>
    <nav>
      <a href="/" class="logo"><img src="/logo.svg" alt="Raise Ready" style="height:38px;"></a>
      <div class="nav-tabs">
        <div class="nav-dropdown">
          <a href="/book/" class="nav-tab" data-page="book">Books</a>
          <div class="dropdown-menu">
            <a href="/book/#start-ready">Start Ready</a>
            <a href="/book/#raise-ready">Raise Ready</a>
            <a href="/book/#model-ready">Model Ready</a>
            <a href="/book/#exit-ready">Exit Ready</a>
          </div>
        </div>
        <a href="/templates/" class="nav-tab" data-page="templates">Templates</a>
        <div class="nav-dropdown">
          <a href="/tools/" class="nav-tab" data-page="tools">Tools</a>
          <div class="dropdown-menu">
            <a href="/tools/start-ready/">Personal Finance (18 tools)</a>
            <a href="/tools/raise-ready.html">Fundraising Tools</a>
            <a href="/tools/exit-ready/">Exit Planning (30 tools)</a>
            <a href="/tools/fundraising-readiness-scorecard.html">Investor Readiness Scorecard</a>
          </div>
        </div>
        <div class="nav-dropdown">
          <a href="/software/" class="nav-tab" data-page="software">Software</a>
          <div class="dropdown-menu">
            <a href="https://finance.raisereadybook.com" target="_blank" style="color:#c8a45a;font-weight:600;">Financial Model Builder</a>
            <a href="/tools/financial-model-pro.html">Financial Model Light</a>
            <a href="https://app.raisereadybook.com" target="_blank">Personal Finance App</a>
          </div>
        </div>
        <a href="/blog/" class="nav-tab" data-page="blog">Blog</a>
        <a href="/jobboard/" class="nav-tab" data-page="jobboard">Jobs</a>
        <a href="/services/" class="nav-tab" data-page="services">Services</a>
        <a href="https://finance.raisereadybook.com" target="_blank" class="nav-tab nav-tab-cta" data-page="fm-pro" style="background:var(--gold,#c8a45a);color:var(--ink,#08080d);padding:0.35rem 1rem;border-radius:6px;font-weight:700;font-size:0.85rem;white-space:nowrap;">Financial Model Builder</a>
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
    // Inject nav into #site-nav placeholder
    const navPlaceholder = document.getElementById('site-nav');
    if (navPlaceholder) {
      navPlaceholder.innerHTML = NAV_HTML;
      setActiveNavTab();
    }

    // Inject footer into #site-footer placeholder
    const footerPlaceholder = document.getElementById('site-footer');
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = FOOTER_HTML;
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
   */
  function setActiveNavTab() {
    const currentPage = document.body.getAttribute('data-page');
    if (!currentPage) return;

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      const tabPage = tab.getAttribute('data-page');
      if (tabPage === currentPage) {
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
        '<input type="email" id="rr-sticky-email" placeholder="your@email.com" required style="padding:0.5rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.8rem;background:#1a1a1f;color:#f2ede4;width:200px;">' +
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
            '<input type="email" id="rr-popup-email" placeholder="your@email.com" required style="flex:1;padding:0.7rem 0.75rem;border:1.5px solid #d5d0c7;border-radius:8px;font-family:monospace;font-size:0.85rem;background:#fff;color:#08080d;">' +
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
          '<input type="email" placeholder="your@email.com" required style="flex:1;padding:0.6rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.85rem;background:#08080d;color:#f2ede4;">' +
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
        '<input type="email" placeholder="your@email.com" required style="flex:1;padding:0.7rem 0.75rem;border:1px solid #3a3830;border-radius:6px;font-family:monospace;font-size:0.85rem;background:#08080d;color:#f2ede4;">' +
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
    initStickyBar();
    initTimedPopup();
    initBlogCTAs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConversionElements);
  } else {
    initConversionElements();
  }

})();
