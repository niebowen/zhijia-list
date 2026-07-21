/**
 * 智家清单 - 场景体验页
 */
const ScenePage = {
  currentSceneId: null,

  render(params) {
    const container = document.getElementById('page-content');
    this.currentSceneId = params ? params.id : Scenarios[0].id;
    const scene = Scenarios.find(s => s.id === this.currentSceneId);

    if (!scene) {
      this.currentSceneId = Scenarios[0].id;
      this.render();
      return;
    }

    container.innerHTML = `
      <div class="page scene-page">
        <!-- 场景选择 -->
        <div class="scene-tabs">
          ${Scenarios.map(s => `
            <div class="scene-tab ${s.id === this.currentSceneId ? 'active' : ''}"
                 style="--tab-color: ${s.color};"
                 onclick="ScenePage.switchScene('${s.id}')">
              ${s.name}
            </div>
          `).join('')}
        </div>

        <!-- 场景详情 -->
        <div class="scene-detail">
          <div class="scene-hero" style="background: linear-gradient(135deg, ${scene.color}15, ${scene.color}30);">
            <h2 style="color: ${scene.color};">${scene.name}</h2>
            <p>${scene.description}</p>
          </div>

          <!-- 改造前后对比 -->
          <div class="scene-compare">
            <h3>智能改造效果</h3>
            <div class="before-after">
              <div class="ba-card before">
                <div class="ba-header">改造前</div>
                <ul class="ba-list">
                  ${scene.beforeItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
              <div class="ba-divider">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#FF8C00" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <div class="ba-card after">
                <div class="ba-header">改造后</div>
                <ul class="ba-list">
                  ${scene.afterItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          ${this._renderEffectDemo(scene)}

          <!-- 所需产品 -->
          <div class="scene-products">
            <h3>所需产品</h3>
            <div class="scene-product-list">
              ${scene.products.map(pid => {
                const p = ProductsDB.find(x => x.id === pid);
                if (!p) return '';
                return `
                  <div class="scene-product-item" onclick="router.navigate('product-detail', {id: '${p.id}'})">
                    <div class="spi-info">
                      <span class="spi-brand">${p.brand}</span>
                      <span class="spi-name">${p.name}</span>
                    </div>
                    <span class="spi-price">${p.priceLabel}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 自动化设置 -->
          <div class="scene-automation">
            <h3>米家自动化设置步骤</h3>
            <div class="automation-steps">
              ${scene.automationSteps.map(s => `
                <div class="auto-step">
                  <div class="step-number">${s.step}</div>
                  <div class="step-content">
                    <div class="step-action">${s.action}</div>
                    <div class="step-desc">${s.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 一键收藏 -->
          <div class="scene-actions">
            <button class="btn ${store.isFavorited(scene.id) ? 'btn-outline-danger' : 'btn-outline'}" onclick="ScenePage.toggleFav('${scene.id}')">
              ${store.isFavorited(scene.id) ? '已收藏' : '收藏场景'}
            </button>
            <a class="btn btn-primary" href="javascript:void(0)" onclick="router.navigate('shop')">查看相关产品</a>
          </div>
        </div>
      </div>
    `;
  },

  switchScene(sceneId) {
    this.currentSceneId = sceneId;
    document.querySelectorAll('.scene-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    // Re-render scene detail
    const scene = Scenarios.find(s => s.id === sceneId);
    const container = document.querySelector('.scene-detail');
    container.innerHTML = `
      <div class="scene-hero" style="background: linear-gradient(135deg, ${scene.color}15, ${scene.color}30);">
        <h2 style="color: ${scene.color};">${scene.name}</h2>
        <p>${scene.description}</p>
      </div>
      <div class="scene-compare">
        <h3>智能改造效果</h3>
        <div class="before-after">
          <div class="ba-card before">
            <div class="ba-header">改造前</div>
            <ul class="ba-list">${scene.beforeItems.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="ba-divider">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#FF8C00" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div class="ba-card after">
            <div class="ba-header">改造后</div>
            <ul class="ba-list">${scene.afterItems.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
      ${this._renderEffectDemo(scene)}
      <div class="scene-products"><h3>所需产品</h3><div class="scene-product-list">${scene.products.map(pid => { const p = ProductsDB.find(x => x.id === pid); return p ? `<div class="scene-product-item" onclick="router.navigate('product-detail', {id: '${p.id}'})"><div class="spi-info"><span class="spi-brand">${p.brand}</span><span class="spi-name">${p.name}</span></div><span class="spi-price">${p.priceLabel}</span></div>` : ''; }).join('')}</div></div>
      <div class="scene-automation"><h3>米家自动化设置步骤</h3><div class="automation-steps">${scene.automationSteps.map(s => `<div class="auto-step"><div class="step-number">${s.step}</div><div class="step-content"><div class="step-action">${s.action}</div><div class="step-desc">${s.desc}</div></div></div>`).join('')}</div></div>
      <div class="scene-actions"><button class="btn ${store.isFavorited(scene.id) ? 'btn-outline-danger' : 'btn-outline'}" onclick="ScenePage.toggleFav('${scene.id}')">${store.isFavorited(scene.id) ? '已收藏' : '收藏场景'}</button><a class="btn btn-primary" href="javascript:void(0)" onclick="router.navigate('shop')">查看相关产品</a></div>
    `;
  },

  _renderEffectDemo(scene) {
    // 安防效果：离家布防
    if (scene.id === 'scene-leave') {
      return `
        <div class="scene-effect-demo">
          <h3>安防效果演示</h3>
          <div class="effect-security-wrap">
            <div class="effect-sec-item">
              <div class="effect-lock">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <span>智能门锁</span>
            </div>
            <div class="effect-sec-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FF8C00" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <div class="effect-sec-item">
              <div class="effect-cam">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <div class="effect-cam-dot"></div>
              </div>
              <span>监控启动</span>
            </div>
            <div class="effect-sec-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FF8C00" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <div class="effect-sec-item">
              <div class="effect-shield">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span>布防完成</span>
            </div>
          </div>
        </div>
      `;
    }
    // 窗帘效果：观影模式 / 晨起模式
    if (scene.id === 'scene-movie' || scene.id === 'scene-morning') {
      const isOpen = scene.id === 'scene-morning';
      return `
        <div class="scene-effect-demo">
          <h3>窗帘效果演示</h3>
          <div class="effect-curtain-wrap">
            <div class="effect-window">
              <div class="effect-curtain-panel ${isOpen ? 'open' : 'closed'}"></div>
              <div class="effect-curtain-panel ${isOpen ? 'open' : 'closed'}"></div>
              <div class="effect-window-bg"></div>
            </div>
            <div class="effect-curtain-label">${isOpen ? '窗帘缓缓打开，迎接阳光' : '窗帘自动关闭，营造沉浸氛围'}</div>
          </div>
        </div>
      `;
    }
    return '';
  },

  toggleFav(sceneId) {
    store.toggleFavorite(sceneId);
    this.switchScene(sceneId);
  }
};
