/**
 * 智家清单 - 首页
 */
const HomePage = {
  render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page home-page">
        <!-- Hero区域 -->
        <section class="hero-section">
          <div class="hero-bg"></div>
          <div class="hero-content">
            <h1 class="brand-name">智家清单</h1>
            <p class="brand-slogan">6道题，找到你的智能家居方案</p>
            <p class="brand-desc">拒绝选择困难，告别踩坑浪费。<br>基于真实京东产品，科学推荐你的智能家居方案。</p>
            <button class="btn btn-primary btn-lg" onclick="router.navigate('quiz')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              开始智能测评
            </button>
          </div>
        </section>

        <!-- 核心数据 -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">32</span>
              <span class="stat-label">评估维度</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${ProductsDB.length}+</span>
              <span class="stat-label">精选产品</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">7</span>
              <span class="stat-label">场景包</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">10</span>
              <span class="stat-label">品类覆盖</span>
            </div>
          </div>
        </section>

        <!-- 四大卖点 -->
        <section class="features-section">
          <h2 class="section-title">为什么选择智家清单</h2>
          <div class="feature-grid">
            <div class="feature-card" onclick="router.navigate('quiz')">
              <div class="feature-icon" style="background: linear-gradient(135deg, #FF8C00, #ff6b00);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>精准匹配</h3>
              <p>6道问卷覆盖居住场景，AI规则引擎科学推荐</p>
            </div>
            <div class="feature-card" onclick="router.navigate('recommend')">
              <div class="feature-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <h3>场景方案</h3>
              <p>网关/灯光/窗帘/安防/宠物等场景包，按需组合</p>
            </div>
            <div class="feature-card" onclick="router.navigate('shop')">
              <div class="feature-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><path d="M12 9v4"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>避坑指南</h3>
              <p>网关依赖检测、安装难度标注，提前规避常见问题</p>
            </div>
            <div class="feature-card" onclick="router.navigate('square')">
              <div class="feature-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>场景广场</h3>
              <p>真实用户方案分享，6个热门场景一键复制</p>
            </div>
          </div>
        </section>

        <!-- 京东背书 -->
        <section class="trust-section">
          <div class="trust-banner">
            <div class="trust-logo">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="trust-text">
              <h3>基于京东真实在售产品</h3>
              <p>所有推荐产品均为京东在售真实商品，点击即可跳转购买</p>
            </div>
          </div>
        </section>

        <!-- 快捷入口 -->
        <section class="quick-section">
          <h2 class="section-title">热门场景</h2>
          <div class="quick-grid">
            ${Scenarios.map(s => `
              <div class="quick-card" onclick="router.navigate('scene', {id: '${s.id}'})">
                <div class="quick-card-icon" style="background: ${s.color}20; color: ${s.color};">
                  <span class="scene-icon-${s.icon}"></span>
                  ${this._getSceneIcon(s.icon)}
                </div>
                <span class="quick-card-label">${s.name}</span>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  },

  _getSceneIcon(icon) {
    const icons = {
      sunrise: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>',
      shield: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      tv: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
      paw: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M8 20c1.5-2 4.5-2 6 0"/><circle cx="7.5" cy="14" r="2.5"/><circle cx="16.5" cy="14" r="2.5"/></svg>'
    };
    return icons[icon] || '';
  }
};
