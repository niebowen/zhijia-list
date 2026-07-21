/**
 * 智家清单 - 个人中心页
 */
const ProfilePage = {
  render() {
    const container = document.getElementById('page-content');
    const quizCompleted = store.isQuizCompleted();
    const result = store.getQuizResult();
    const profile = store.getProfile();

    container.innerHTML = `
      <div class="page profile-page">
        <div class="profile-header">
          <div class="profile-avatar">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#FF8C00" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1>我的智家清单</h1>
          <p class="profile-subtitle">智家清单 v1.0</p>
        </div>

        <div class="profile-card">
          <div class="profile-card-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
            智能测评
          </div>
          ${quizCompleted ? `
            <div class="quiz-status done">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              已完成测评
            </div>
            <div class="quiz-summary">
              <span>${result.platform === 'apple' ? '苹果HomeKit' : result.platform === 'huawei' ? '华为鸿蒙智联' : '米家'}</span>
              <span>${result.houseType === 'new' ? '毛坯' : result.houseType === 'renovate' ? '改造' : '租房'}</span>
              ${result.rooms ? '<span>' + (result.rooms.bedrooms || 3) + '室' + (result.rooms.livingRooms || 1) + '厅</span>' : ''}
            </div>
            <div class="profile-quiz-result">
              <button class="btn btn-primary" data-action="nav" data-target="recommend">查看推荐方案</button>
              <button class="btn btn-outline" data-action="nav" data-target="quiz">重新测评</button>
            </div>
          ` : `
            <div class="quiz-status pending">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              尚未完成测评
            </div>
            <button class="btn btn-primary" data-action="nav" data-target="quiz">开始测评</button>
          `}
        </div>

        <div class="profile-stats">
          <div class="stat-card" data-action="nav" data-target="favorites">
            <span class="stat-card-num">${profile.favorites.length}</span>
            <span class="stat-card-label">收藏</span>
          </div>
          <div class="stat-card" data-action="nav" data-target="cart">
            <span class="stat-card-num">${store.getCartCount()}</span>
            <span class="stat-card-label">购物车</span>
          </div>
          <div class="stat-card" data-action="nav" data-target="compare">
            <span class="stat-card-num">${store.getCompareList().length}</span>
            <span class="stat-card-label">对比</span>
          </div>
        </div>

        <div class="profile-menu">
          <div class="menu-item" data-action="nav" data-target="owned-products">
            <div class="menu-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF8C00" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <span>我家已有产品</span>
            <div class="menu-arrow">
              <span>${Object.values(store.getOwnedProducts()).reduce(function(a,b){return a+b;},0)}件</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="menu-item" data-action="toast" data-msg="功能开发中">
            <div class="menu-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF8C00" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </div>
            <span>偏好设置</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="menu-item" data-action="feedback">
            <div class="menu-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF8C00" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <span>问题反馈</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="menu-item" data-action="reset" style="margin-top:16px; border-top:1px solid var(--border,#333); padding-top:16px;">
            <div class="menu-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            </div>
            <span style="color:#ef4444;">重置数据</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div class="profile-footer">
          <p>智家清单 v1.0.0</p>
          <p>基于真实产品数据 · 科学推荐</p>
        </div>
      </div>
    `;

    // Event delegation for profile page
    container.querySelectorAll('[data-action="nav"]').forEach(function(el) {
      el.addEventListener('click', function() {
        router.navigate(this.dataset.target);
      });
    });
    container.querySelectorAll('[data-action="toast"]').forEach(function(el) {
      el.addEventListener('click', function() {
        App.showToast(this.dataset.msg);
      });
    });
    var feedbackBtn = container.querySelector('[data-action="feedback"]');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', function() { ProfilePage.showFeedback(); });
    }
    var resetBtn = container.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() { ProfilePage.showResetConfirm(); });
    }
  },

  renderOwnedProducts() {
    var container = document.getElementById('page-content');
    var owned = store.getOwnedProducts();

    var categoryGroups = [
      { title: '灯光', items: [
        { key: 'light_bulb', name: '智能灯泡' },
        { key: 'light_strip', name: '智能灯带' },
        { key: 'downlight', name: '筒射灯' },
        { key: 'ceiling_light', name: '智能主灯/吸顶灯' },
        { key: 'atmosphere_light', name: '氛围灯' }
      ]},
      { title: '开关', items: [
        { key: 'switch_wall', name: '智能墙壁开关' },
        { key: 'switch_wireless', name: '无线/随意贴开关' },
        { key: 'smart_panel', name: '智能面板' }
      ]},
      { title: '传感器', items: [
        { key: 'sensor_door', name: '门窗传感器' },
        { key: 'sensor_body', name: '人体传感器' },
        { key: 'sensor_smoke', name: '烟雾报警器' },
        { key: 'sensor_temp', name: '温湿度传感器' },
        { key: 'sensor_gas', name: '天然气报警器' }
      ]},
      { title: '安防', items: [
        { key: 'lock', name: '智能门锁' },
        { key: 'camera', name: '智能摄像头' }
      ]},
      { title: '窗帘', items: [
        { key: 'curtain_motor', name: '智能窗帘电机' }
      ]},
      { title: '网关与音箱', items: [
        { key: 'gateway', name: '智能网关' },
        { key: 'speaker', name: '智能音箱' }
      ]},
      { title: '家电', items: [
        { key: 'ac_controller', name: '空调伴侣' },
        { key: 'air_purifier', name: '空气净化器' }
      ]},
      { title: '智能家务', items: [
        { key: 'vacuum', name: '扫拖机器人' },
        { key: 'dishwasher', name: '洗碗机' }
      ]}
    ];

    var totalItems = Object.values(owned).reduce(function(a, b) { return a + b; }, 0);

    var html = '<div class="page owned-products-page">';
    html += '<div class="page-sub-header"><h1>我家已有产品</h1>';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<button class="btn btn-text" id="sync-mihome-btn" style="font-size:12px;padding:4px 8px;height:auto;color:var(--primary);display:flex;align-items:center;gap:4px;">';
    html += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    html += '米家账号同步</button>';
    html += '<span class="cart-count-sub">' + totalItems + '件</span></div></div>';
    html += '<p class="owned-products-desc">设置你已有的产品品类和数量，推荐时会自动排除，避免重复购买</p>';
    html += '<div class="owned-products-list">';

    categoryGroups.forEach(function(group, gidx) {
      var groupQty = group.items.reduce(function(sum, item) { return sum + (owned[item.key] || 0); }, 0);
      html += '<div class="category-accordion ' + (gidx === 0 ? 'expanded' : '') + '" id="cat-' + group.title + '">';
      html += '<div class="category-accordion-header" data-cat="' + group.title + '"><h3>' + group.title + '</h3>';
      if (groupQty > 0) {
        html += '<span style="font-size:12px;color:var(--primary);background:rgba(255,140,0,0.1);padding:2px 8px;border-radius:10px;margin-left:auto;margin-right:8px;">' + groupQty + '件</span>';
      }
      html += '<svg class="accordion-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '</div><div class="category-accordion-body"><div class="owned-category-items">';

      group.items.forEach(function(item) {
        var qty = owned[item.key] || 0;
        html += '<div class="owned-category-row">';
        html += '<span class="owned-category-name">' + item.name + '</span>';
        html += '<div class="room-config-stepper">';
        html += '<button class="qty-btn" data-key="' + item.key + '" data-delta="-1">-</button>';
        html += '<span class="qty-value">' + qty + '</span>';
        html += '<button class="qty-btn" data-key="' + item.key + '" data-delta="1">+</button>';
        html += '</div></div>';
      });

      html += '</div></div></div>';
    });

    html += '</div></div>';
    container.innerHTML = html;

    // Event delegation
    container.querySelectorAll('.category-accordion-header').forEach(function(el) {
      el.addEventListener('click', function() {
        ProfilePage.toggleAccordion(this.dataset.cat);
      });
    });
    container.querySelectorAll('.qty-btn').forEach(function(el) {
      el.addEventListener('click', function() {
        ProfilePage.changeOwnedQty(this.dataset.key, parseInt(this.dataset.delta));
      });
    });
    var syncBtn = document.getElementById('sync-mihome-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', function() { App.showToast('功能开发中'); });
    }
  },

  toggleAccordion(cat) {
    var el = document.getElementById('cat-' + cat);
    if (el) el.classList.toggle('expanded');
  },

  changeOwnedQty(key, delta) {
    var current = store.getOwnedQuantity(key);
    var next = Math.max(0, current + delta);
    store.setOwnedQuantity(key, next);
    this.renderOwnedProducts();
  },

  showFeedback() {
    var overlay = document.createElement('div');
    overlay.id = 'feedback-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = '<div style="background:var(--bg2,#1a1a1a);border-radius:16px;padding:24px;max-width:320px;width:100%;border:1px solid var(--border,#333);">'
      + '<h3 style="margin:0 0 16px;color:var(--text-primary,#fff);font-size:18px;">问题反馈</h3>'
      + '<p style="margin:0 0 12px;color:var(--text-secondary,#999);font-size:14px;line-height:1.6;">遇到问题或有建议？欢迎通过以下方式联系我们：</p>'
      + '<div style="background:var(--bg,#0a0a0a);border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid var(--border,#333);">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
      + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF8C00" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
      + '<span style="color:var(--text-primary,#fff);font-size:14px;">邮箱：841914286@qq.com</span></div>'
      + '<div style="display:flex;align-items:center;gap:10px;">'
      + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF8C00" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>'
      + '<span style="color:var(--text-primary,#fff);font-size:14px;">联系：juzhidedahuangmao</span></div></div>'
      + '<button class="btn btn-primary" id="feedback-close-btn" style="width:100%;">知道了</button></div>';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    document.getElementById('feedback-close-btn').addEventListener('click', function() {
      overlay.remove();
    });
  },

  showResetConfirm() {
    var overlay = document.createElement('div');
    overlay.id = 'reset-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = '<div style="background:var(--bg2,#1a1a1a);border-radius:16px;padding:24px;max-width:320px;width:100%;border:1px solid var(--border,#333);">'
      + '<h3 style="margin:0 0 12px;color:#ef4444;font-size:18px;">重置所有数据</h3>'
      + '<p style="margin:0 0 8px;color:var(--text-secondary,#999);font-size:14px;line-height:1.6;">确定要删除所有账户数据吗？以下内容将被清空：</p>'
      + '<ul style="margin:0 0 16px;padding-left:20px;color:var(--text-secondary,#999);font-size:13px;line-height:2;">'
      + '<li>测评历史与推荐方案</li><li>购物车商品</li><li>收藏列表</li>'
      + '<li>对比清单</li><li>已有产品记录</li><li>场景包选择记录</li></ul>'
      + '<div style="display:flex;gap:12px;">'
      + '<button class="btn btn-outline" id="reset-cancel-btn" style="flex:1;">取消</button>'
      + '<button class="btn btn-primary" id="reset-confirm-btn" style="flex:1;background:#ef4444;">确认重置</button>'
      + '</div></div>';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    document.getElementById('reset-cancel-btn').addEventListener('click', function() {
      overlay.remove();
    });
    document.getElementById('reset-confirm-btn').addEventListener('click', function() {
      ProfilePage.resetAllData();
    });
  },

  resetAllData() {
    store.clear();
    App.updateCartBadge();
    var overlay = document.getElementById('reset-overlay');
    if (overlay) overlay.remove();
    App.showToast('数据已重置');
    this.render();
  }
};
window.ProfilePage = ProfilePage;
