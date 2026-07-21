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
            <button class="btn btn-primary" data-action="nav-shop">去商城</button>
          </div>
        </div>
      `;
      container.querySelector('[data-action="nav-shop"]').addEventListener('click', function() {
        router.navigate('shop');
      });
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
          ${products.map(item => {
            const cat = item.product.category;
            const emoji = cat === 'gateway' ? '🔌' : cat === 'light' ? '💡' : cat === 'sensor' ? '📡' : cat === 'camera' ? '📹' : cat === 'lock' ? '🔒' : cat === 'curtain' ? '🪟' : cat === 'switch' ? '🔘' : cat === 'speaker' ? '🔊' : '📦';
            const gradient = cat === 'gateway' ? '135deg,#1a1a2e,#16213e' : cat === 'light' ? '135deg,#3d2b1f,#5c3d2e' : cat === 'sensor' ? '135deg,#1a1a2e,#0f3460' : cat === 'camera' ? '135deg,#2c3e50,#1a1a2e' : cat === 'lock' ? '135deg,#1a1a2e,#2d3436' : cat === 'curtain' ? '135deg,#2d3436,#636e72' : cat === 'switch' ? '135deg,#2c3e50,#34495e' : cat === 'speaker' ? '135deg,#2d132c,#801336' : '135deg,#1a1a2e,#2c3e50';
            return `
            <div class="cart-item" data-action="change-qty" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-card);border-radius:10px;margin-bottom:4px;border:1px solid var(--border);">
              <div style="width:36px;height:36px;border-radius:6px;background:linear-gradient(${gradient});display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:16px;">${emoji}</span>
              </div>
              <div style="flex:1;min-width:0;overflow:hidden;">
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.product.brand} ${item.product.name}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                  <span style="font-size:11px;color:var(--primary);font-weight:700;">¥${item.product.price.toLocaleString()}</span>
                  <span style="font-size:10px;color:var(--text-muted);">×${item.quantity}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:2px;flex-shrink:0;">
                <button class="qty-btn" data-pid="${item.productId}" data-delta="-1" style="width:20px;height:20px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text-primary);font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;">-</button>
                <span style="min-width:14px;text-align:center;font-size:12px;">${item.quantity}</span>
                <button class="qty-btn" data-pid="${item.productId}" data-delta="1" style="width:20px;height:20px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text-primary);font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;">+</button>
              </div>
              <span style="font-size:13px;font-weight:700;color:var(--primary);min-width:44px;text-align:right;flex-shrink:0;">¥${(item.product.price * item.quantity).toLocaleString()}</span>
              <button data-action="remove" data-pid="${item.productId}" style="width:20px;height:20px;border-radius:50%;border:none;background:transparent;color:#666;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            `;
          }).join('')}
        </div>

        <div class="cart-bottom-bar">
          <div class="cart-total">
            <span>合计</span>
            <span class="cart-total-price">¥${total.toLocaleString()}</span>
          </div>
          <button class="btn btn-primary checkout-btn">去结算</button>
        </div>

        <div style="margin:12px 16px 80px;">
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <span style="font-size:13px;font-weight:600;color:var(--text-primary);">购买清单</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.6;">
              购物车共${products.length}件商品，已生成购买链接
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary open-links-btn" style="flex:1;font-size:12px;padding:8px;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                逐个打开链接
              </button>
              <button class="btn btn-outline copy-links-btn" style="font-size:12px;padding:8px 12px;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                复制全部
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event delegation
    container.querySelectorAll('.qty-btn[data-pid]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        CartPage.changeQty(this.dataset.pid, parseInt(this.dataset.delta));
      });
    });
    container.querySelectorAll('[data-action="remove"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        CartPage.remove(this.dataset.pid);
      });
    });
    var checkoutBtn = container.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() { CartPage.checkout(); });
    }
    var openLinksBtn = container.querySelector('.open-links-btn');
    if (openLinksBtn) {
      openLinksBtn.addEventListener('click', function() { CartPage.openAllLinks(); });
    }
    var copyLinksBtn = container.querySelector('.copy-links-btn');
    if (copyLinksBtn) {
      copyLinksBtn.addEventListener('click', function() { CartPage.copyAllLinks(); });
    }
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
    this.copyAllLinks();
  },

  openAllLinks() {
    const cart = store.getCart();
    const products = cart.map(item => {
      const p = ProductsDB.find(x => x.id === item.productId);
      return p ? { ...item, product: p } : null;
    }).filter(x => x && x.product.promotionUrl);
    if (products.length === 0) {
      this._showToast('暂无购买链接');
      return;
    }
    products.forEach(function(item, idx) {
      setTimeout(function() {
        window.open(item.product.promotionUrl, '_blank');
      }, idx * 800);
    });
  },

  copyAllLinks() {
    const cart = store.getCart();
    const products = cart.map(item => {
      const p = ProductsDB.find(x => x.id === item.productId);
      return p ? { ...item, product: p } : null;
    }).filter(x => x && x.product.promotionUrl);
    if (products.length === 0) {
      this._showToast('暂无购买链接');
      return;
    }
    var text = products.map(function(item) {
      return item.product.name + ' x' + item.quantity + ' · ' + item.product.promotionUrl;
    }).join('\n');
    text = '智家清单 - 购买清单\n====================\n' + text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => this._showToast('购买清单已复制，请粘贴到浏览器')).catch(() => this._showToast('复制失败'));
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this._showToast('购买清单已复制，请粘贴到浏览器');
    }
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
