/**
 * 智家清单 - 场景广场页
 */
const SquarePage = {
  currentTag: 'all',

  allTags: ['all', '租房', '新房', '安防', '老人', '宠物', '小孩', '独居', '新手入门', '全屋智能'],

  render() {
    const container = document.getElementById('page-content');

    container.innerHTML = `
      <div class="page square-page">
        <div class="square-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h1>场景广场</h1>
            <p>真实用户方案分享，找到最适合你的</p>
          </div>
          <button class="btn btn-primary" onclick="App.showToast('投稿功能即将开放')" style="font-size:13px;padding:6px 14px;height:auto;margin-top:4px;">
            去投稿
          </button>
        </div>

        <!-- 标签筛选 -->
        <div class="tag-filter-row" id="tag-filters">
          ${this.allTags.map(tag => `
            <span class="filter-tag ${tag === 'all' ? 'active' : ''}" data-tag="${tag}"
                  onclick="SquarePage.filterTag('${tag}')">
              ${tag === 'all' ? '全部' : tag}
            </span>
          `).join('')}
        </div>

        <!-- 社区方案列表 -->
        <div class="community-list" id="community-list"></div>
      </div>
    `;
    this.renderList();
  },

  renderList() {
    let items = [...CommunityScenarios];
    if (this.currentTag !== 'all') {
      items = items.filter(s => s.tags.includes(this.currentTag));
    }

    const list = document.getElementById('community-list');
    list.innerHTML = items.map(s => `
      <div class="community-card" onclick="SquarePage.viewDetail('${s.id}')" style="cursor:pointer;">
        <div class="cc-header">
          <div class="cc-author">
            <div class="cc-avatar">${s.avatar}</div>
            <div>
              <span class="cc-name">${s.author}</span>
              <span class="cc-meta">${s.rooms} | ${s.budget}</span>
            </div>
          </div>
          <span class="cc-difficulty">${s.difficulty}</span>
        </div>
        <h3 class="cc-title">${s.title}</h3>
        <p class="cc-desc">${s.description}</p>
        <div class="cc-tags">
          ${s.tags.map(t => `<span class="mini-tag">${t}</span>`).join('')}
        </div>
        <div class="cc-products">
          <span class="cc-products-label">涉及产品：</span>
          ${s.products.map(pid => {
            const p = ProductsDB.find(x => x.id === pid);
            return p ? `<span class="cc-product-tag">${p.name}</span>` : '';
          }).join('')}
        </div>
        <div class="cc-footer">
          <div class="cc-action ${store.isLiked(s.id) ? 'active' : ''}" onclick="event.stopPropagation(); SquarePage.toggleLike('${s.id}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${store.isLiked(s.id) ? '#ef4444' : 'none'}" stroke="${store.isLiked(s.id) ? '#ef4444' : '#999'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span>${s.likes + (store.isLiked(s.id) ? 1 : 0)}</span>
          </div>
          <div class="cc-action ${store.isFavorited(s.id) ? 'active' : ''}" onclick="event.stopPropagation(); SquarePage.toggleFav('${s.id}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${store.isFavorited(s.id) ? '#FF8C00' : 'none'}" stroke="${store.isFavorited(s.id) ? '#FF8C00' : '#999'}" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            <span>收藏</span>
          </div>
          <div class="cc-action" onclick="event.stopPropagation(); SquarePage.shareScenario('${s.id}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>分享</span>
          </div>
          <div class="cc-action cc-action-buy" onclick="event.stopPropagation(); SquarePage.addAllToCart('${s.id}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span>一键加购</span>
          </div>
        </div>
      </div>
    `).join('');

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state-sm"><p>暂无相关方案</p></div>';
    }

  },

  // 查看社区方案详情
  viewDetail(scenarioId) {
    const s = CommunityScenarios.find(x => x.id === scenarioId);
    if (!s) return;

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page">
        <div style="padding:16px;">
          <button class="btn btn-text" onclick="SquarePage.render()" style="padding:6px 0;font-size:14px;margin-bottom:12px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            返回场景广场
          </button>

          <!-- 方案头部 -->
          <div class="community-card" style="margin-bottom:20px;">
            <div class="cc-header">
              <div class="cc-author">
                <div class="cc-avatar">${s.avatar}</div>
                <div>
                  <span class="cc-name">${s.author}</span>
                  <span class="cc-meta">${s.rooms} | ${s.budget} | ${s.difficulty}</span>
                </div>
              </div>
            </div>
            <h3 class="cc-title" style="font-size:20px;">${s.title}</h3>
            <p class="cc-desc" style="font-size:15px;line-height:1.8;">${s.description}</p>
            <div class="cc-tags">
              ${s.tags.map(t => `<span class="mini-tag">${t}</span>`).join('')}
            </div>
            <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
              <div class="cc-action cc-action-buy" onclick="SquarePage.addAllToCart('${s.id}')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <span>一键加购</span>
              </div>
              <div class="cc-action" onclick="SquarePage.shareScenario('${s.id}')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>分享方案</span>
              </div>
            </div>
          </div>

          <!-- 涉及产品 -->
          <h3 style="font-size:16px;color:var(--text-primary);margin-bottom:12px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            涉及产品
          </h3>
          <div class="scene-package-products" style="margin-bottom:24px;">
            ${s.products.map(pid => {
              const p = ProductsDB.find(x => x.id === pid);
              if (!p) return '';
              return `
                <div class="sp-product" onclick="ProductDetailPage.render({id:'${p.id}'})">
                  <div class="sp-product-info">
                    <div class="sp-product-name">${p.name}</div>
                    <div class="sp-product-desc">${p.brand} · ${p.description || ''}</div>
                  </div>
                  <div class="sp-product-price">¥${p.price.toLocaleString()}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- 实施步骤 -->
          ${s.steps && s.steps.length > 0 ? `
            <h3 style="font-size:16px;color:var(--text-primary);margin-bottom:12px;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              实施步骤
            </h3>
            <div style="margin-bottom:24px;">
              ${s.steps.map((step, i) => `
                <div style="display:flex;gap:14px;margin-bottom:16px;">
                  <div style="min-width:28px;height:28px;border-radius:50%;background:var(--primary,#FF8C00);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">${i + 1}</div>
                  <div style="flex:1;padding-top:3px;">
                    <p style="margin:0;color:var(--text-primary);font-size:14px;line-height:1.6;">${step}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- 智能场景体验 -->
          <h3 style="font-size:16px;color:var(--text-primary);margin-bottom:12px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            智能场景体验
          </h3>
          <div style="background:var(--bg,#0a0a0a);border:1px solid var(--border,#333);border-radius:12px;padding:20px;margin-bottom:16px;">
            <h4 style="margin:0 0 8px;color:var(--primary,#FF8C00);font-size:15px;">设置前</h4>
            <div style="margin-bottom:16px;">
              ${(s.beforeItems || []).map(item => `
                <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span style="color:var(--text-secondary);font-size:13px;">${item}</span>
                </div>
              `).join('')}
            </div>
            <div style="text-align:center;margin:12px 0;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </div>
            <h4 style="margin:0 0 8px;color:#10b981;font-size:15px;">设置后</h4>
            <div>
              ${(s.afterItems || []).map(item => `
                <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style="color:var(--text-secondary);font-size:13px;">${item}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 米家设置指南 -->
          <h3 style="font-size:16px;color:var(--text-primary);margin-bottom:12px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            米家自动化设置指南
          </h3>
          <div style="background:var(--bg,#0a0a0a);border:1px solid var(--border,#333);border-radius:12px;padding:20px;">
            <p style="margin:0 0 16px;color:var(--text-secondary);font-size:13px;">按照以下步骤在米家App中创建自动化：</p>
            ${(s.automationSteps || []).map((step, i) => `
              <div style="display:flex;gap:14px;margin-bottom:16px;">
                <div style="min-width:28px;height:28px;border-radius:50%;background:var(--bg2,#1a1a1a);border:1px solid var(--border,#333);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--primary);font-weight:600;">${step.step}</div>
                <div style="flex:1;">
                  <p style="margin:0 0 4px;color:var(--text-primary);font-size:14px;">${step.action}</p>
                  <p style="margin:0;color:var(--text-secondary);font-size:12px;">${step.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 分享场景
  shareScenario(scenarioId) {
    const s = CommunityScenarios.find(x => x.id === scenarioId);
    if (!s) return;

    const overlay = document.createElement('div');
    overlay.id = 'share-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
      <div style="background:var(--bg2,#1a1a1a);border-radius:16px;padding:24px;max-width:360px;width:100%;border:1px solid var(--border,#333);">
        <h3 style="margin:0 0 16px;color:var(--text-primary,#fff);font-size:18px;">分享方案</h3>
        <div style="background:var(--bg,#0a0a0a);border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid var(--border,#333);">
          <p style="margin:0 0 6px;color:var(--text-primary);font-size:14px;font-weight:600;">${s.title}</p>
          <p style="margin:0;color:var(--text-secondary);font-size:13px;">${s.description.substring(0, 60)}...</p>
        </div>
        <textarea id="share-text" placeholder="编辑你的分享文案，说说你的使用心得..." 
          style="width:100%;height:80px;background:var(--bg,#0a0a0a);border:1px solid var(--border,#333);border-radius:10px;padding:12px;color:var(--text-primary);font-size:14px;resize:none;margin-bottom:16px;outline:none;font-family:inherit;"
        >我在智家清单上看到了「${s.title}」，${s.rooms}只花了${s.budget}就搞定了智能家居，推荐！</textarea>
        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <button class="btn btn-primary" style="flex:1;" onclick="SquarePage.copyShareText()">复制文案</button>
          <button class="btn btn-outline" style="flex:1;" onclick="SquarePage.screenshotShare()">截图分享</button>
        </div>
        <button class="btn btn-text" style="width:100%;color:var(--text-secondary);" onclick="document.getElementById('share-overlay').remove()">取消</button>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  copyShareText() {
    const text = document.getElementById('share-text');
    if (text && text.value) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text.value).then(() => {
          App.showToast('文案已复制到剪贴板');
          document.getElementById('share-overlay').remove();
        });
      } else {
        text.select();
        document.execCommand('copy');
        App.showToast('文案已复制到剪贴板');
        document.getElementById('share-overlay').remove();
      }
    }
  },

  screenshotShare() {
    document.getElementById('share-overlay').remove();
    App.showToast('请截图后分享给好友');
  },

  filterTag(tag) {
    this.currentTag = tag;
    document.querySelectorAll('.filter-tag').forEach(t => {
      t.classList.toggle('active', t.dataset.tag === tag);
    });
    this.renderList();
  },

  toggleLike(id) {
    store.toggleLike(id);
    this.renderList();
  },

  toggleFav(id) {
    store.toggleFavorite(id);
    this.renderList();
  },

  addAllToCart(scenarioId) {
    const scenario = CommunityScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    scenario.products.forEach(pid => {
      store.addToCart(pid, 1);
    });
    App.updateCartBadge();
    window.triggerCartAnimation();
    this._showToast(`「${scenario.title}」已加入购物车`);
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
