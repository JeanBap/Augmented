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
      <a href="/" class="logo">Raise Ready</a>
      <div class="nav-tabs">
        <div class="nav-dropdown">
          <a href="/book/" class="nav-tab" data-page="book">Book & Extras</a>
          <div class="dropdown-menu">
            <a href="/book/">Raise Ready Book</a>
            <a href="/book/#templates">Financial Model Template</a>
            <a href="/book/#sessions">Sessions & Model Building</a>
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
