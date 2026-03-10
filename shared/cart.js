/**
 * cart.js - Shopping cart functionality
 * Manages cart state and UI for the Augmented website
 */

(function() {
  'use strict';

  // Cart state stored in memory (not localStorage)
  let cartItems = [];
  let cartOpen = false;

  const CART_DRAWER_HTML = `
    <div id="cart-drawer" class="cart-drawer">
      <div class="cart-header">
        <h2>Cart</h2>
        <button class="cart-close" onclick="toggleCart()">✕</button>
      </div>
      <div id="cart-items"></div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Total:</span>
          <span id="cart-total">$0.00</span>
        </div>
        <button class="cart-checkout-btn" onclick="cartCheckout()">Checkout</button>
      </div>
    </div>
  `;

  /**
   * Initialize cart drawer on page load
   */
  function initializeCart() {
    // Inject cart drawer if not present
    if (!document.getElementById('cart-drawer')) {
      const cartContainer = document.createElement('div');
      cartContainer.innerHTML = CART_DRAWER_HTML;
      document.body.appendChild(cartContainer.firstElementChild);
    }

    // Hide badge if cart is empty on load
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.style.display = cartItems.length > 0 ? 'flex' : 'none';
    }

    // Wire up .btn-add-to-cart buttons via event delegation
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-add-to-cart');
      if (!btn) return;

      const id = btn.dataset.productId;
      const name = btn.dataset.productName;
      const price = parseFloat(btn.dataset.productPrice);
      if (!id || !name || isNaN(price)) return;

      addToCart(id, name, price);

      // GA event for add to cart
      if (typeof gtag === 'function') {
        gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: price,
          items: [{ item_id: id, item_name: name, price: price, quantity: 1 }]
        });
      }

      // Visual feedback: change button text briefly
      const originalText = btn.textContent;
      btn.textContent = 'Added!';
      btn.style.pointerEvents = 'none';
      setTimeout(function() {
        btn.textContent = originalText;
        btn.style.pointerEvents = '';
      }, 1200);
    });
  }

  /**
   * Add item to cart
   * @param {string} id - Unique item ID
   * @param {string} name - Item name
   * @param {number} price - Item price
   */
  window.addToCart = function(id, name, price) {
    if (!id || !name || typeof price !== 'number') {
      console.error('Invalid cart item: id, name, and price are required');
      return;
    }

    // Check if item already exists in cart
    const existingItem = cartItems.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        id: id,
        name: name,
        price: price,
        quantity: 1
      });
    }

    updateCartUI();
  };

  /**
   * Remove item from cart
   * @param {string} id - Item ID to remove
   */
  window.removeFromCart = function(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    updateCartUI();
  };

  /**
   * Toggle cart drawer open/closed
   */
  window.toggleCart = function() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.toggle('open');
      cartOpen = !cartOpen;
    }
  };

  /**
   * Update cart UI with current state
   */
  window.updateCartUI = function() {
    // Update cart count badge
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Update cart items display
    const itemsContainer = document.getElementById('cart-items');
    if (itemsContainer) {
      if (cartItems.length === 0) {
        itemsContainer.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
      } else {
        itemsContainer.innerHTML = cartItems.map(item => `
          <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-info">
              <h4>${escapeHtml(item.name)}</h4>
              <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
          </div>
        `).join('');
      }
    }

    // Update total price
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotal.textContent = '$' + total.toFixed(2);
    }
  };

  // Map product IDs to their downloadable file paths
  const PRODUCT_FILES = {
    'book':        '/files/book/raise-ready-book.pdf',
    'exercises':   '/files/exercises/raise-ready-exercises.zip',
    'bundle':      '/files/bundle/raise-ready-bundle.zip',
    'tpl-preseed': '/files/tpl-preseed/pre-seed-model.xlsx',
    'tpl-seed':    '/files/tpl-seed/seed-model.xlsx',
    'tpl-seriesa': '/files/tpl-seriesa/series-a-model.xlsx',
    'tpl-seriesb': '/files/tpl-seriesb/series-b-model.xlsx'
  };

  /**
   * Trigger file download for a given URL
   */
  function triggerDownload(url) {
    var a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Process checkout - downloads files for all products in cart
   */
  window.cartCheckout = function() {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    var downloadable = cartItems.filter(function(item) {
      return PRODUCT_FILES[item.id];
    });

    if (downloadable.length === 0) {
      alert('No downloadable products in cart.');
      return;
    }

    // GA event for checkout
    if (typeof gtag === 'function') {
      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: getCartTotal(),
        items: cartItems.map(function(item) {
          return { item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity };
        })
      });
    }

    // Download each product file with a small delay between them
    downloadable.forEach(function(item, i) {
      setTimeout(function() {
        triggerDownload(PRODUCT_FILES[item.id]);
      }, i * 500);
    });

    // Clear cart after initiating downloads
    setTimeout(function() {
      clearCart();
      toggleCart();
    }, downloadable.length * 500 + 200);
  };

  /**
   * Get current cart items
   * @returns {Array} Array of cart items
   */
  window.getCartItems = function() {
    return JSON.parse(JSON.stringify(cartItems));
  };

  /**
   * Get cart total
   * @returns {number} Total cart price
   */
  window.getCartTotal = function() {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  /**
   * Clear entire cart
   */
  window.clearCart = function() {
    cartItems = [];
    updateCartUI();
  };

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  // Track Calendly "Book a Call" clicks via GA
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.btn-calendly');
    if (!link) return;
    if (typeof gtag === 'function') {
      var cardTitle = '';
      var card = link.closest('.role-card');
      if (card) { var h3 = card.querySelector('h3'); if (h3) cardTitle = h3.textContent; }
      gtag('event', 'book_call', { event_category: 'Services', event_label: cardTitle || 'Unknown service' });
    }
  });

  /**
   * Initialize cart when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
  } else {
    initializeCart();
  }

  // Expose cart state function for debugging (optional)
  window.getCartState = function() {
    return {
      items: JSON.parse(JSON.stringify(cartItems)),
      isOpen: cartOpen,
      total: getCartTotal()
    };
  };
})();
