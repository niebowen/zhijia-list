/**
 * 智家清单 - 产品详情页
 */
const ProductDetailPage = {
  lastParams: null,

  render(params) {
    this.lastParams = params;
    const container = document.getElementById('page-content');
    const product = ProductsDB.find(p => p.id === params.id);

    if (!product) {
      container.innerHTML = '<div class="page"><div class="empty-state"><h2>产品未找到</h2></div></div>';
      return;
    }

    const gatewayChecker = new GatewayChecker(ProductsDB);
    const gatewayDesc = gatewayChecker.getGatewayDescription(product);
    const isInCompare = store.isInCompare(product.id);

    container.innerHTML = `
      <div class="page detail-page">
        <!-- 返回导航 -->
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <button class="btn btn-text" onclick="ProductDetailPage.goBack()" style="padding:6px 0; font-size:14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            返回方案
          </button>
        </div>
        <!-- 头部 -->
        <div class="detail-header">
          <span class="detail-brand">${product.brand}</span>
          <span class="detail-category">${product.categoryLabel}</span>
        </div>
        <h1 class="detail-name">${product.name}</h1>
        <p class="detail-desc">${product.description}</p>

        <!-- 价格和评分 -->
        <div class="detail-price-row">
          <span class="detail-price">${product.priceLabel}</span>
          <span class="detail-rating">${'★'.repeat(Math.floor(product.rating))} ${product.rating}分 | ${product.sales > 10000 ? (product.sales / 10000).toFixed(1) + '万' : product.sales}人付款</span>
        </div>

        <!-- 标签 -->
        <div class="detail-tags">
          ${product.tags.map(t => `<span class="mini-tag">${t}</span>`).join('')}
          ${product.rentFriendly ? '<span class="mini-tag tag-green">租房友好</span>' : ''}
        </div>

        <!-- 网关信息 -->
        <div class="detail-gateway ${product.needGateway ? 'need-gateway' : 'no-gateway'}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="22" height="12" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          <span>${gatewayDesc}</span>
        </div>

        <!-- 6维度评分雷达图 -->
        <div class="detail-section">
          <h3>评分详情</h3>
          <div class="radar-chart">
            <div class="radar-container">
              <div class="radar-bg">
                ${[20, 40, 60, 80, 100].map(v => `<div class="radar-ring" style="--size: ${v}%"></div>`).join('')}
              </div>
              <div class="radar-shape" style="--stability: ${product.scores.stability}%; --response: ${product.scores.response}%; --noise: ${product.scores.noise}%; --quality: ${product.scores.quality}%; --app: ${product.scores.app}%; --install: ${product.scores.install}%;"></div>
              <div class="radar-labels">
                <span class="radar-label" style="left:100px;top:8px">稳定性 ${product.scores.stability}</span>
                <span class="radar-label" style="left:179.7px;top:54px">响应速度 ${product.scores.response}</span>
                <span class="radar-label" style="left:179.7px;top:146px">静音 ${product.scores.noise}</span>
                <span class="radar-label" style="left:100px;top:192px">做工质量 ${product.scores.quality}</span>
                <span class="radar-label" style="left:20.3px;top:146px">App体验 ${product.scores.app}</span>
                <span class="radar-label" style="left:20.3px;top:54px">安装便捷 ${product.scores.install}</span>
              </div>
            </div>
            <div class="radar-scores">
              <div class="score-item"><span>稳定性</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.stability}%"></div></div><span>${product.scores.stability}</span></div>
              <div class="score-item"><span>响应速度</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.response}%"></div></div><span>${product.scores.response}</span></div>
              <div class="score-item"><span>静音</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.noise}%"></div></div><span>${product.scores.noise}</span></div>
              <div class="score-item"><span>做工质量</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.quality}%"></div></div><span>${product.scores.quality}</span></div>
              <div class="score-item"><span>App体验</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.app}%"></div></div><span>${product.scores.app}</span></div>
              <div class="score-item"><span>安装便捷</span><div class="score-bar"><div class="score-fill" style="width:${product.scores.install}%"></div></div><span>${product.scores.install}</span></div>
            </div>
          </div>
        </div>

        <!-- 安装建议 -->
        <div class="detail-section">
          <h3>安装建议</h3>
          <div class="install-tips">
            <div class="tip-item">
              <span class="tip-label">安装位置</span>
              <span class="tip-value">${product.installTips.position}</span>
            </div>
            <div class="tip-item">
              <span class="tip-label">覆盖范围</span>
              <span class="tip-value">${product.installTips.coverage}</span>
            </div>
            <div class="tip-item">
              <span class="tip-label">安装高度</span>
              <span class="tip-value">${product.installTips.height}</span>
            </div>
            <div class="tip-item tip-note">
              <span class="tip-label">注意事项</span>
              <span class="tip-value">${product.installTips.notes}</span>
            </div>
          </div>
          ${this._getInstallDiagram(product.category)}
        </div>

        <!-- 智能联动 -->
        <div class="detail-section">
          <h3>智能联动设置</h3>
          <div class="automation-guide">
            <p class="guide-text">${product.automationGuide}</p>
          </div>
        </div>

        <!-- 产品特点 -->
        <div class="detail-section">
          <h3>产品特点</h3>
          <div class="feature-list">
            ${product.features.map(f => `
              <div class="feature-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${f}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 规格参数 -->
        <div class="detail-section">
          <h3>规格参数</h3>
          <div class="specs-table">
            ${product.specs.map(s => `
              <div class="spec-row">
                <span class="spec-key">${s.key}</span>
                <span class="spec-value">${s.value}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="detail-bottom-bar">
          <button class="btn ${isInCompare ? 'btn-outline-danger' : 'btn-outline'}" id="btn-compare" onclick="ProductDetailPage.toggleCompare('${product.id}')">
            ${isInCompare ? '移出对比' : '加入对比'}
          </button>
          <button class="btn btn-primary" onclick="ProductDetailPage.addToCart('${product.id}')">
            加入购物车
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    `;
  },

  toggleCompare(productId) {
    const added = store.addToCompare(productId);
    const btn = document.getElementById('btn-compare');
    if (added) {
      btn.textContent = '移出对比';
      btn.className = 'btn btn-outline-danger';
      // Navigate to compare page after adding
      router.navigate('compare');
    } else {
      const removed = !store.isInCompare(productId);
      store.removeFromCompare(productId);
      btn.textContent = '加入对比';
      btn.className = 'btn btn-outline';
    }
  },

  addToCart(productId) {
    store.addToCart(productId, 1);
    App.showToast('已加入购物车');
    App.updateCartBadge();
    window.triggerCartAnimation();
  },

  goBack() {
    const params = this.lastParams || {};
    if (params.fromBundleId && params.fromCatKey) {
      RecommendPage.viewCategoryProducts(params.fromBundleId, params.fromCatKey);
    } else {
      router.navigate('recommend');
    }
  },

  _getInstallDiagram(category) {
    const style = 'width:100%;max-width:260px;margin:12px auto;display:block;';
    const stroke = '#FF8C00';
    const fill = 'none';
    const sw = '1.5';

    const diagrams = {
      gateway: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <rect x="20" y="20" width="160" height="100" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <circle cx="100" cy="70" r="12" fill="${stroke}" opacity="0.2"/>
          <circle cx="100" cy="70" r="6" fill="${stroke}"/>
          <line x1="100" y1="20" x2="100" y2="35" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="4"/>
          <text x="100" y="15" text-anchor="middle" fill="#ccc" font-size="10">天花板</text>
          <text x="100" y="95" text-anchor="middle" fill="#ccc" font-size="10">放在房间中央高处</text>
          <text x="100" y="110" text-anchor="middle" fill="#ccc" font-size="10">远离金属遮挡</text>
        </svg>`,
      light: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <path d="M80 20 L120 20 L110 40 L90 40 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <circle cx="100" cy="65" r="20" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="100" y1="40" x2="100" y2="45" stroke="${stroke}" stroke-width="${sw}"/>
          <path d="M85 75 Q100 90 115 75" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <text x="100" y="105" text-anchor="middle" fill="#ccc" font-size="10">旋入灯座即可</text>
          <text x="100" y="120" text-anchor="middle" fill="#ccc" font-size="10">注意断电操作</text>
        </svg>`,
      switch: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <rect x="70" y="30" width="60" height="80" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="85" y1="50" x2="115" y2="50" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="85" y1="70" x2="115" y2="70" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="85" y1="90" x2="115" y2="90" stroke="${stroke}" stroke-width="${sw}"/>
          <text x="100" y="125" text-anchor="middle" fill="#ccc" font-size="10">关闭总闸后替换</text>
          <text x="100" y="138" text-anchor="middle" fill="#ccc" font-size="10">注意火线零线</text>
        </svg>`,
      sensor: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <rect x="40" y="20" width="120" height="80" rx="2" fill="${fill}" stroke="#444" stroke-width="1"/>
          <circle cx="100" cy="50" r="8" fill="${stroke}"/>
          <path d="M85 70 L100 55 L115 70" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="60" y1="110" x2="140" y2="110" stroke="#444" stroke-width="1" stroke-dasharray="3"/>
          <text x="100" y="105" text-anchor="middle" fill="#ccc" font-size="10">1.2 - 2.2米</text>
          <text x="100" y="128" text-anchor="middle" fill="#ccc" font-size="10">面向检测区域</text>
        </svg>`,
      lock: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <rect x="60" y="10" width="80" height="100" rx="2" fill="${fill}" stroke="#444" stroke-width="1"/>
          <circle cx="100" cy="50" r="16" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <rect x="94" y="50" width="12" height="20" rx="1" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <text x="100" y="125" text-anchor="middle" fill="#ccc" font-size="10">主副体间距小于18mm</text>
          <text x="100" y="138" text-anchor="middle" fill="#ccc" font-size="10">分别贴在门框和门扇</text>
        </svg>`,
      camera: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <circle cx="100" cy="70" r="30" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <circle cx="100" cy="70" r="8" fill="${stroke}"/>
          <path d="M70 70 Q100 40 130 70" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <line x1="40" y1="110" x2="160" y2="110" stroke="#444" stroke-width="1"/>
          <text x="100" y="105" text-anchor="middle" fill="#ccc" font-size="10">安装高度2-3米</text>
          <text x="100" y="128" text-anchor="middle" fill="#ccc" font-size="10">俯视角度30-60度</text>
        </svg>`,
      plug: `
        <svg class="install-diagram" viewBox="0 0 200 140" style="${style}">
          <rect x="75" y="30" width="50" height="50" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <circle cx="92" cy="50" r="3" fill="${stroke}"/>
          <circle cx="108" cy="50" r="3" fill="${stroke}"/>
          <line x1="100" y1="80" x2="100" y2="105" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="3"/>
          <text x="100" y="122" text-anchor="middle" fill="#ccc" font-size="10">替换原有插座</text>
          <text x="100" y="135" text-anchor="middle" fill="#ccc" font-size="10">注意断电</text>
        </svg>`
    };

    // Map similar categories
    const catMap = { outlet: 'plug', speaker: 'gateway' };
    return diagrams[category] || diagrams[catMap[category]] || '';
  }
};
