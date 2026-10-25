const products = {
  'caramel-latte': { id: 'caramel-latte', name: 'Caramel Latte', price: 150, slug: "CONCIERGE'S CHOICE" },
  'spanish-latte': { id: 'spanish-latte', name: 'Spanish Latte', price: 110, slug: "BUTLER'S RESERVE" },
  'hot-chocolate': { id: 'hot-chocolate', name: 'Chocolate', price: 100, slug: 'CASA MANILA' },
  'bellmans-boost': { id: 'bellmans-boost', name: "Bellman's Boost", price: 70, slug: 'COFFEE' },
  'first-welcome': { id: 'first-welcome', name: 'First Welcome', price: 40, slug: 'COFFEE' },
  'heritage-refresher': { id: 'heritage-refresher', name: 'Heritage Refresher', price: 80, slug: 'NON COFFEE' },
  'luneta-jade': { id: 'luneta-jade', name: 'Luneta Jade', price: 80, slug: 'NON COFFEE' },
  'bay-sunrise': { id: 'bay-sunrise', name: 'Bay Sunrise', price: 60, slug: 'NON COFFEE' },
  'courtyard-cookie': { id: 'courtyard-cookie', name: 'Courtyard Cookie', price: 50, slug: 'PASTRIES' },
  'grand-manila-ensaymada': { id: 'grand-manila-ensaymada', name: 'Grand Manila Ensaymada', price: 60, slug: 'PASTRIES' },
  'penthouse-cheesecake': { id: 'penthouse-cheesecake', name: 'Penthouse Cheesecake', price: 80, slug: 'PASTRIES' },
  'strawberry-garden-danish': { id: 'strawberry-garden-danish', name: 'Strawberry Garden Danish', price: 110, slug: 'PASTRIES' },
  'sunrise-butter-croissant': { id: 'sunrise-butter-croissant', name: 'Sunrise Butter Croissant', price: 85, slug: 'PASTRIES' }
};

const cart = new Map();

function formatPrice(amount) {
  return `₱${Number(amount).toFixed(0)}`;
}

function getSelectedTemperature(productId) {
  const select = document.querySelector(`.temp-select[data-product-id="${productId}"]`);
  return select ? select.value : 'Hot';
}

function renderCart() {
  const items = [...cart.values()];
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  document.querySelector('#cart-badge').textContent = quantity;
  document.querySelector('#drawer-item-count').textContent = `(${quantity})`;
  document.querySelector('#subtotal').textContent = formatPrice(subtotal);
  document.querySelector('#checkout-total').textContent = formatPrice(subtotal);

  const emptyCart = document.querySelector('#empty-cart');
  const cartSummary = document.querySelector('#cart-summary');
  const cartItems = document.querySelector('#cart-items');

  emptyCart.hidden = quantity > 0;
  cartSummary.hidden = quantity === 0;

  if (quantity === 0) {
    cartItems.innerHTML = '';
    return;
  }

  cartItems.innerHTML = items
    .map(({ product, quantity: count, temperature, variantId }) => `
      <div class="cart-line">
        <div>
          <h3>${product.name} (${temperature})</h3>
          <span class="cart-line-price">${formatPrice(product.price * count)}</span><br>
          <button class="remove-item" data-remove="${variantId}">Remove</button>
        </div>
        <div class="cart-line-controls">
          <button class="qty-button" data-quantity="${variantId}" data-change="-1" aria-label="Decrease ${product.name} ${temperature}">−</button>
          <span class="qty-value">${count}</span>
          <button class="qty-button" data-quantity="${variantId}" data-change="1" aria-label="Increase ${product.name} ${temperature}">+</button>
        </div>
      </div>
    `)
    .join('');
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.innerHTML = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function showReceipt(markup) {
  const toast = document.querySelector('#toast');
  toast.innerHTML = markup + '<button class="receipt-close" aria-label="Close receipt">×</button>';
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = null;
}

function hideToast() {
  const toast = document.querySelector('#toast');
  toast.classList.remove('show');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatOrderSummary(items) {
  if (!items.length) return 'your order';

  return items
    .map(({ product, temperature, quantity }) => {
      const detail = `${product.name} (${temperature})`;
      return quantity > 1 ? `${detail} x${quantity}` : detail;
    })
    .join(', ');
}

function buildReceiptMarkup(firstName, room, items) {
  const safeFirstName = escapeHtml(firstName || 'Guest');
  const safeRoom = escapeHtml(room || 'N/A');
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return `
    <div class="receipt">
      <div class="receipt-header">LE CAFÉ NOIR</div>
      <div class="receipt-sub">Order Confirmation</div>
      <div class="receipt-meta">
        <span>Guest</span>
        <strong>${safeFirstName}</strong>
      </div>
      <div class="receipt-meta">
        <span>Room</span>
        <strong>${safeRoom}</strong>
      </div>
      <div class="receipt-divider"></div>
      ${items
        .map(({ product, temperature, quantity }) => `
          <div class="receipt-line">
            <span>${escapeHtml(product.name)} <em>(${escapeHtml(temperature)})</em> x${quantity}</span>
            <strong>${formatPrice(product.price * quantity)}</strong>
          </div>
        `)
        .join('')}
      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <span>Total</span>
        <strong>${formatPrice(subtotal)}</strong>
      </div>
    </div>
  `;
}

function addProduct(productId, temperature = getSelectedTemperature(productId)) {
  const product = products[productId];
  if (!product) return;

  const variantId = `${productId}-${temperature.toLowerCase()}`;
  const existing = cart.get(variantId);
  cart.set(variantId, {
    product,
    temperature,
    variantId,
    quantity: (existing ? existing.quantity : 0) + 1
  });

  renderCart();
  openCart();
  showToast(`<strong>${product.name} (${temperature})</strong> added to your order`);
}

function updateOverlay(shouldShow) {
  const overlay = document.querySelector('#overlay');
  const drawer = document.querySelector('#cart-drawer');
  const modal = document.querySelector('#checkout-modal');

  const isVisible = shouldShow || drawer.classList.contains('open') || modal.classList.contains('open');
  overlay.classList.toggle('visible', isVisible);
  document.body.classList.toggle('no-scroll', isVisible);
}

function openCart() {
  document.querySelector('#cart-drawer').classList.add('open');
  document.querySelector('#cart-drawer').setAttribute('aria-hidden', 'false');
  updateOverlay(true);
}

function closeCart() {
  document.querySelector('#cart-drawer').classList.remove('open');
  document.querySelector('#cart-drawer').setAttribute('aria-hidden', 'true');
  updateOverlay(false);
}

function closeCheckout() {
  document.querySelector('#checkout-modal').classList.remove('open');
  document.querySelector('#checkout-modal').setAttribute('aria-hidden', 'true');
  updateOverlay(false);
}

function openCheckout() {
  const modal = document.querySelector('#checkout-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  updateOverlay(true);
  document.querySelector('#customer-name').focus();
}

document.body.addEventListener('click', (event) => {
  const closeReceiptButton = event.target.closest('.receipt-close');
  if (closeReceiptButton) {
    hideToast();
    return;
  }

  const orderButton = event.target.closest('[data-order]');
  if (orderButton) {
    const productId = orderButton.dataset.order;
    closeCart();
    addProduct(productId, getSelectedTemperature(productId));
    openCheckout();
    return;
  }

  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    const productId = addButton.dataset.add;
    addProduct(productId, getSelectedTemperature(productId));
    return;
  }

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    const id = removeButton.dataset.remove;
    cart.delete(id);
    renderCart();
    return;
  }

  const qtyButton = event.target.closest('[data-quantity]');
  if (qtyButton) {
    const id = qtyButton.dataset.quantity;
    const item = cart.get(id);
    if (!item) return;

    item.quantity += Number(qtyButton.dataset.change);
    if (item.quantity <= 0) cart.delete(id);
    renderCart();
  }
});

document.querySelector('#cart-trigger').addEventListener('click', openCart);
document.querySelector('#close-cart').addEventListener('click', closeCart);
document.querySelector('#close-checkout').addEventListener('click', closeCheckout);
document.querySelector('#browse-menu').addEventListener('click', () => {
  closeCart();
  document.querySelector('#menu').scrollIntoView({ behavior: 'smooth' });
});
document.querySelector('#overlay').addEventListener('click', () => {
  closeCart();
  closeCheckout();
});
document.querySelector('#checkout-button').addEventListener('click', () => {
  closeCart();
  openCheckout();
});
document.querySelector('#checkout-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) {
    event.currentTarget.reportValidity();
    return;
  }

  const formData = new FormData(event.currentTarget);
  const name = String(formData.get('name') || '').trim();
  const firstName = name.split(/\s+/)[0] || 'Guest';
  const room = String(formData.get('room') || '').trim();
  const orderItems = [...cart.values()];
  const receiptMarkup = buildReceiptMarkup(firstName, room, orderItems);

  cart.clear();
  renderCart();
  event.currentTarget.reset();
  closeCheckout();
  showReceipt(receiptMarkup);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCart();
    closeCheckout();
  }
});

renderCart();
