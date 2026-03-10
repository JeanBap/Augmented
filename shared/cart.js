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
    // Check if cart drawer already exists
    if (!document.getElementById('cart-drawer')) {
      // Inject cart drawer HTML at the end of body
      const cartContainer = document.createElement('div');
      cartContainer.innerHTML = CART_DRAWER_HTML;
      document.body.appendChild(cartContainer.firstElementChild);
    }
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

  /**
   * Process checkout
   */
  window.cartCheckout = function() {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert('Checkout coming soon! Your cart total is: $' + total.toFixed(2));
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
