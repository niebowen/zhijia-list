/**
 * 智家清单 - 主应用逻辑
 * 初始化路由、Tab栏、页面切换
 */
(function() {
  'use strict';

  // Tab routes configuration
  const TAB_ROUTES = ['quiz', 'shop', 'recommend', 'square', 'profile'];
  const SUB_ROUTES = ['product-detail', 'compare', 'scene', 'favorites', 'cart', 'owned-products'];

  // Tab SVG icons
  const TAB_ICONS = {
    quiz: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
    shop: '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    recommend: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    square: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    profile: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  };

  const TAB_LABELS = {
    quiz: '测评',
    shop: '商城',
    recommend: '场景',
    square: '广场',
    profile: '我的'
  };

  /**
   * 初始化Tab栏
   */
  function initTabBar() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    const cartCount = store.getCartCount();

    tabBar.innerHTML = TAB_ROUTES.map(route => {
      const onclick = route === 'recommend'
        ? `onclick="store.isQuizCompleted() ? router.navigate('recommend') : router.navigate('quiz')"`
        : `onclick="router.navigate('${route}')"`;
      const cartBadge = route === 'shop' && cartCount > 0
        ? `<span class="tab-cart-badge">${cartCount}</span>`
        : '';
      return `
      <div class="tab-item" data-route="${route}" ${onclick}>
        <span class="tab-icon-wrap">${TAB_ICONS[route]}${cartBadge}</span>
        <span>${TAB_LABELS[route]}</span>
        <span class="tab-indicator"></span>
      </div>
    `}).join('');
  }

  /**
   * 更新Tab栏高亮
   */
  function updateTabBar(currentRoute) {
    const tabBar = document.getElementById('tab-bar');
    const subHeader = document.getElementById('sub-header');
    const content = document.getElementById('page-content');

    if (!tabBar) return;

    if (SUB_ROUTES.includes(currentRoute)) {
      // Sub page: hide tab bar, show sub header
      tabBar.style.display = 'none';
      if (subHeader) {
        subHeader.style.display = 'flex';
        const routeLabels = {
          'recommend': '推荐方案',
          'product-detail': '产品详情',
          'compare': '产品对比',
          'scene': '场景体验',
          'favorites': '我的收藏',
          'cart': '购物车',
          'owned-products': '我家已有产品'
        };
        subHeader.innerHTML = `
          <button class="back-btn" onclick="history.back()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            返回
          </button>
          <h1>${routeLabels[currentRoute] || '详情'}</h1>
        `;
      }
      if (content) {
        content.style.paddingTop = '0';
      }
    } else {
      // Tab page: show tab bar, hide sub header
      tabBar.style.display = 'flex';
      if (subHeader) subHeader.style.display = 'none';
      if (content) content.style.paddingTop = '0';

      // Update active tab
      tabBar.querySelectorAll('.tab-item').forEach(item => {
        const isActive = item.dataset.route === currentRoute;
        item.classList.toggle('active', isActive);
      });
    }
  }

  /**
   * 页面渲染方法映射
   */
  function renderPage(route, params) {
    switch (route) {
      case 'quiz':
        QuizPage.render();
        break;
      case 'recommend':
        RecommendPage.render(params);
        break;
      case 'shop':
        ShopPage.render();
        break;
      case 'product-detail':
        ProductDetailPage.render(params);
        break;
      case 'compare':
        ComparePage.render(params);
        break;
      case 'scene':
        ScenePage.render(params);
        break;
      case 'square':
        SquarePage.render();
        break;
      case 'profile':
        ProfilePage.render();
        break;
      case 'favorites':
        FavoritesPage.render();
        break;
      case 'cart':
        CartPage.render();
        break;
      case 'owned-products':
        ProfilePage.renderOwnedProducts();
        break;
      default:
        router.navigate('quiz');
    }
  }

  // App global API
  window.App = {
    showToast(message) {
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

    updateCartBadge() {
      const tabBar = document.getElementById('tab-bar');
      if (!tabBar) return;
      const shopTab = tabBar.querySelector('.tab-item[data-route="shop"]');
      if (!shopTab) return;
      const iconWrap = shopTab.querySelector('.tab-icon-wrap');
      if (!iconWrap) return;

      const count = store.getCartCount();
      let badge = iconWrap.querySelector('.tab-cart-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'tab-cart-badge';
          iconWrap.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    }
  };

  /**
   * 初始化应用
   */
  function init() {
    // Build HTML structure
    const app = document.getElementById('app');
    app.innerHTML = `
      <div id="sub-header" class="sub-header" style="display: none;"></div>
      <div id="page-content"></div>
      <div id="tab-bar" class="tab-bar"></div>
    `;

    // Init Tab bar
    initTabBar();

    // Register routes
    const routes = ['quiz', 'recommend', 'shop', 'product-detail', 'compare', 'scene', 'square', 'profile', 'favorites', 'cart', 'owned-products'];
    routes.forEach(route => {
      router.register(route, (params) => {
        renderPage(route, params);
      });
    });

    // After route change hook: update UI
    router.afterEach((route, params) => {
      updateTabBar(route);
      // Scroll to top
      window.scrollTo(0, 0);
    });

    // Start router
    router.start();
  }

  // Expose global cart animation trigger
  window.triggerCartAnimation = function() {
    const shopTab = document.querySelector('.tab-item[data-route="shop"]');
    if (shopTab) {
      const iconWrap = shopTab.querySelector('.tab-icon-wrap');
      const badge = shopTab.querySelector('.tab-cart-badge');
      if (iconWrap) {
        iconWrap.classList.remove('cart-icon-animated');
        void iconWrap.offsetWidth; // force reflow
        iconWrap.classList.add('cart-icon-animated');
      }
      if (badge) {
        badge.classList.remove('cart-badge-animated');
        void badge.offsetWidth;
        badge.classList.add('cart-badge-animated');
      }
    }
    // Also update badge count
    window.App.updateCartBadge();
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
