/**
 * components.js - Shared navigation, footer, and tracking components
 * Injects nav and footer into pages with #site-nav and #site-footer placeholders
 */

// Meta Pixel - fires immediately (before DOMContentLoaded)
(function() {
  var PIXEL_ID = '1298416075475311';
  if (!PIXEL_ID) return;
  if (window.fbq) return;
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
      <a href="/" class="logo">Raise Ready</a>
      <div class="nav-tabs">
        <div class="nav-dropdown">
          <a href="/book/" class="nav-tab" data-page="book">Books & Extras</a>
          <div class="dropdown-menu">
            <a href="/book/#start-ready">Start Ready Book</a>
            <a href="/book/#raise-ready">Raise Ready Book</a>
            <a href="/book/#exit-ready">Exit Ready Book</a>
            <a href="/book/#templates">Financial Model Template</a>
          </div>
        </div>
        <a href="/services/" class="nav-tab" data-page="services">Services</a>
        <div class="nav-dropdown">
          <a href="/tools/" class="nav-tab" data-page="tools">Tools</a>
          <div class="dropdown-menu">
            <a href="/tools/start-ready/">Start Ready Tools</a>
            <a href="/tools/raise-ready.html">Raise Ready Tools</a>
            <a href="/tools/exit-ready/">Exit Ready Tools</a>
          </div>
        </div>
        <a href="/blog/" class="nav-tab" data-page="blog">Blog</a>
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
        <a href="/book/">Books & Extras</a>
        <a href="/services/">Services</a>
        <a href="/tools/">Tools</a>
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
})();
