/**
 * 智家清单 - 购物车页
 */
const CartPage = {
  render() {
    const container = document.getElementById('page-content');
    const cart = store.getCart();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="page cart-page">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            <h2>购物车是空的</h2>
            <p>去商城挑选心仪的产品吧</p>
            <button class="btn btn-primary" onclick="router.navigate('shop')">去商城</button>
          </div>
        </div>
      `;
      return;
    }

    const products = cart.map(item => {
      const product = ProductsDB.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(item => item.product);

    const total = products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    container.innerHTML = `
      <div class="page cart-page">
        <div class="cart-list-header">
          <span class="cart-count-sub">${cart.length}种商品</span>
        </div>

        <div class="cart-list">
          ${products.map(item => `
            <div class="cart-item">
              <div class="cart-item-info">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-brand">${item.product.brand}</div>
                <div class="cart-item-price">${item.product.priceLabel}</div>
              </div>
              <div class="cart-item-actions">
                <div class="qty-control">
                  <button class="qty-btn" onclick="CartPage.changeQty('${item.productId}', -1)">-</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="CartPage.changeQty('${item.productId}', 1)">+</button>
                </div>
                <button class="cart-item-delete" onclick="CartPage.remove('${item.productId}')">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
              <div class="cart-item-subtotal">
                小计 ¥${(item.product.price * item.quantity).toLocaleString()}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="cart-bottom-bar">
          <div class="cart-total">
            <span>合计</span>
            <span class="cart-total-price">¥${total.toLocaleString()}</span>
          </div>
          <button class="btn btn-primary" onclick="CartPage.checkout()">去结算</button>
        </div>
      </div>
    `;
  },

  changeQty(productId, delta) {
    const cart = store.getCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      store.removeFromCart(productId);
    } else {
      item.quantity = newQty;
      store.set('cart', cart);
    }
    this.render();
    App.updateCartBadge();
    window.triggerCartAnimation();
  },

  remove(productId) {
    store.removeFromCart(productId);
    this.render();
  },

  checkout() {
    this._showToast('即将前往抖音城');
  },

  _showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;white-space:nowrap;';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  }
};
