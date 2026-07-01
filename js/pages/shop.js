/**
 * 智家清单 - 商城页
 */
const ShopPage = {
  currentCategory: 'all',
  currentBrand: 'all',
  searchQuery: '',
  filterRentFriendly: false,
  filterNoGateway: false,
  filterDifficulty: null,

  render() {
    const cartCount = store.getCartCount();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page shop-page">
        <div class="shop-header">
          <div class="shop-header-top">
            <h1>商城</h1>
            <div class="shop-cart-icon" onclick="router.navigate('cart')">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
            </div>
          </div>
          <p>精选${ProductsDB.length}款京东在售产品</p>
        </div>

        <!-- 搜索 -->
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="搜索产品名称、品牌..." id="shop-search"
                 oninput="ShopPage.onSearch(this.value)">
        </div>

        <!-- 分类筛选 -->
        <div class="category-tabs" id="category-tabs">
          ${Categories.map(c => `
            <div class="cat-tab ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}"
                 onclick="ShopPage.filterCategory('${c.id}')">
              ${c.label}
            </div>
          `).join('')}
        </div>

        <!-- 品牌和额外筛选 -->
        <div class="filter-row">
          <select id="brand-filter" onchange="ShopPage.filterBrand(this.value)" class="filter-select">
            ${Brands.map(b => `<option value="${b.id}">${b.label}</option>`).join('')}
          </select>
          <label class="filter-checkbox">
            <input type="checkbox" onchange="ShopPage.toggleRentFriendly(this.checked)">
            <span>租房友好</span>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" onchange="ShopPage.toggleNoGateway(this.checked)">
            <span>无需网关</span>
          </label>
        </div>

        <!-- 产品列表 -->
        <div class="product-grid" id="product-grid"></div>
        <div class="search-empty" id="search-empty" style="display:none">
          <p>没有找到匹配的产品</p>
        </div>
      </div>
    `;
    this.renderProducts();
  },

  getFilteredProducts() {
    let products = [...ProductsDB];

    // Category filter
    if (this.currentCategory !== 'all') {
      products = products.filter(p => p.category === this.currentCategory);
    }

    // Brand filter
    if (this.currentBrand !== 'all') {
      products = products.filter(p => p.brand === this.currentBrand);
    }

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    }

    // Extra filters
    if (this.filterRentFriendly) {
      products = products.filter(p => p.rentFriendly);
    }
    if (this.filterNoGateway) {
      products = products.filter(p => !p.needGateway);
    }

    return products;
  },

  renderProducts() {
    const products = this.getFilteredProducts();
    const grid = document.getElementById('product-grid');
    const empty = document.getElementById('search-empty');

    if (products.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = products.map(p => `
      <div class="product-card" onclick="router.navigate('product-detail', {id: '${p.id}'})">
        <button class="product-add-btn" onclick="event.stopPropagation(); ShopPage.addToCart('${p.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div class="product-card-header">
          <span class="product-card-brand">${p.brand}</span>
          <span class="product-card-rating">${'★'.repeat(Math.floor(p.rating))}${p.rating}</span>
        </div>
        <h3 class="product-card-name">${p.name}</h3>
        <p class="product-card-desc">${p.description}</p>
        <div class="product-card-tags">
          ${p.tags.slice(0, 2).map(t => `<span class="mini-tag">${t}</span>`).join('')}
        </div>
        <div class="product-card-bottom">
          <span class="product-card-price">${p.priceLabel}</span>
          <span class="product-card-sales">${p.sales > 10000 ? (p.sales / 10000).toFixed(1) + '万' : p.sales}人付款</span>
        </div>
      </div>
    `).join('');
  },

  addToCart(productId) {
    store.addToCart(productId, 1);
    const count = store.getCartCount();
    this._showToast('已加入购物车');
    // Update badge if visible
    const badge = document.querySelector('.shop-cart-icon .cart-badge');
    const cartIcon = document.querySelector('.shop-cart-icon');
    if (badge) {
      badge.textContent = count;
    } else if (cartIcon) {
      cartIcon.insertAdjacentHTML('beforeend', `<span class="cart-badge">${count}</span>`);
    }
    window.triggerCartAnimation();
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
  },

  filterCategory(catId) {
    this.currentCategory = catId;
    document.querySelectorAll('.cat-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.cat === catId);
    });
    this.renderProducts();
  },

  filterBrand(brandId) {
    this.currentBrand = brandId;
    this.renderProducts();
  },

  onSearch(value) {
    this.searchQuery = value.trim();
    this.renderProducts();
  },

  toggleRentFriendly(checked) {
    this.filterRentFriendly = checked;
    this.renderProducts();
  },

  toggleNoGateway(checked) {
    this.filterNoGateway = checked;
    this.renderProducts();
  }
};
