/**
 * components.js - Shared navigation and footer components
 * Injects nav and footer into pages with #site-nav and #site-footer placeholders
 */

(function() {
  'use strict';

  const NAV_HTML = `
    <nav>
      <a href="/" class="logo">Augmented</a>
      <div class="nav-tabs">
        <a href="/book/" class="nav-tab" data-page="book">Book & Extras</a>
        <a href="/services/" class="nav-tab" data-page="services">Services</a>
        <a href="/blog/" class="nav-tab" data-page="blog">Blog</a>
        <a href="/careers/" class="nav-tab" data-page="careers">Careers</a>
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
  `;

  const FOOTER_HTML = `
    <footer>
      <div class="footer-links">
        <a href="/book/">Book & Extras</a>
        <a href="/services/">Services</a>
        <a href="/blog/">Blog</a>
        <a href="/templates/">Templates</a>
        <a href="/careers/">Careers</a>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
      </div>
      <span>&copy; 2025 Augmented</span>
      <span>AI-Native Fractional Talent</span>
      <span>hello@augmented.co</span>
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
    }
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
