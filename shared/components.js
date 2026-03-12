/**
 * components.js - Shared navigation and footer components
 * Injects nav and footer into pages with #site-nav and #site-footer placeholders
 */

(function() {
  'use strict';

  const NAV_HTML = `
    <a href="#main" class="skip-to-content">Skip to main content</a>
    <header>
    <nav>
      <a href="/" class="logo">Augmented</a>
      <div class="nav-tabs">
        <div class="nav-dropdown">
          <a href="/book/" class="nav-tab" data-page="book">Book & Extras</a>
          <div class="dropdown-menu">
            <a href="/book/">Raise Ready Book</a>
            <a href="/book/#companion">Companion Products</a>
            <a href="/book/#templates">Financial Model Templates</a>
          </div>
        </div>
        <a href="/tools/" class="nav-tab" data-page="tools">Tools</a>
        <a href="/blog/" class="nav-tab" data-page="blog">Blog</a>
      </div>
      <div class="nav-right">
        <button class="nbtn cart-btn" onclick="toggleCart()" style="position:relative">
          <span>&#128722; Cart</span>
          <span id="cart-count" style="position: absolute; top: -8px; right: -8px; background-color: #c0392b; color: #f2ede4; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">0</span>
        </button>
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
        <a href="/book/">Book & Extras</a>
        <a href="/tools/">Tools</a>
        <a href="/blog/">Blog</a>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </div>
      <span>&copy; <span class="footer-year"></span> Augmented</span>
      <span>Fundraising Intelligence for Founders</span>
      <span>yanni@raisereadybook.com</span>
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

    // Inject sticky bundle bar
    if (!document.getElementById('bundle-bar')) {
      var bar = document.createElement('div');
      bar.id = 'bundle-bar';
      bar.innerHTML = '<div style="position:fixed;bottom:0;left:0;right:0;background:#08080d;border-top:1px solid rgba(200,164,90,0.3);padding:0.65rem 2rem;display:flex;align-items:center;justify-content:center;gap:1.25rem;z-index:100;flex-wrap:wrap;" id="bundle-bar-inner">'
        + '<span style="font-family:\'DM Mono\',monospace;font-size:0.8rem;color:rgba(242,237,228,0.7);"><strong style="color:#f2ede4;">Raise Ready Bundle</strong></span>'
        + '<span style="font-family:\'DM Mono\',monospace;font-size:0.8rem;color:rgba(242,237,228,0.7);">Book + All Templates + Audit</span>'
        + '<span style="font-family:\'DM Mono\',monospace;font-size:0.8rem;color:rgba(242,237,228,0.4);text-decoration:line-through;">$715</span>'
        + '<span style="font-family:\'Instrument Serif\',serif;font-size:1.2rem;color:#c8a45a;">$499</span>'
        + '<a href="/book/#bundle-section" style="padding:0.45rem 1.1rem;background:#c8a45a;color:#08080d;border:none;border-radius:6px;font-family:\'DM Mono\',monospace;font-size:0.8rem;font-weight:500;cursor:pointer;text-decoration:none;">Get the Bundle</a>'
        + '<button onclick="document.getElementById(\'bundle-bar\').style.display=\'none\'" style="background:none;border:none;color:rgba(242,237,228,0.4);font-size:1.2rem;cursor:pointer;padding:0 0.25rem;line-height:1;" aria-label="Dismiss">&times;</button>'
        + '</div>';
      document.body.appendChild(bar);
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
