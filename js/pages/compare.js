/**
 * 智家清单 - 产品对比页
 */
const ComparePage = {
  render() {
    const container = document.getElementById('page-content');
    const compareIds = store.getCompareList();

    if (compareIds.length === 0) {
      container.innerHTML = `
        <div class="page compare-page">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <h2>对比列表为空</h2>
            <p>在产品详情页点击"加入对比"，最多选3款产品</p>
            <button class="btn btn-primary" onclick="router.navigate('shop')">去选品</button>
          </div>
        </div>
      `;
      return;
    }

    const products = compareIds.map(id => ProductsDB.find(p => p.id === id)).filter(Boolean);
    const firstCategory = products[0]?.category;
    const similarProducts = firstCategory && products.length < 3
      ? ProductsDB.filter(p => p.category === firstCategory && !compareIds.includes(p.id)).slice(0, 4)
      : [];

    container.innerHTML = `
      <div class="page compare-page">
        <div class="compare-header">
          <h1>产品对比</h1>
          <div class="compare-header-actions">
            <span class="compare-count">${products.length}/3</span>
            <button class="btn btn-outline btn-sm" onclick="ComparePage.newCompare()">新建对比</button>
          </div>
        </div>

        ${similarProducts.length > 0 ? `
          <div class="compare-similar">
            <h3>添加同品类产品</h3>
            <div class="product-grid compare-similar-grid">
              ${similarProducts.map(p => `
                <div class="product-card">
                  <div class="product-card-header">
                    <span class="product-card-brand">${p.brand}</span>
                    <span class="product-card-rating">${'★'.repeat(Math.floor(p.rating))}${p.rating}</span>
                  </div>
                  <h3 class="product-card-name">${p.name}</h3>
                  <p class="product-card-desc">${p.description}</p>
                  <div class="product-card-bottom">
                    <span class="product-card-price">${p.priceLabel}</span>
                    <button class="btn btn-primary btn-sm" onclick="ComparePage.addSimilar('${p.id}')">加入对比</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 对比表格 -->
        <div class="compare-table">
          <!-- 产品名称行 -->
          <div class="compare-row compare-header-row">
            <div class="compare-label"></div>
            ${products.map(p => `
              <div class="compare-cell product-cell">
                <div class="compare-product-name">${p.name}</div>
                <div class="compare-product-brand">${p.brand}</div>
                <button class="btn btn-sm btn-text" onclick="ComparePage.remove('${p.id}')">移除</button>
              </div>
            `).join('')}
          </div>

          <!-- 价格 -->
          <div class="compare-row">
            <div class="compare-label">价格</div>
            ${products.map(p => {
              const isBest = p.price === Math.min(...products.map(x => x.price));
              return `<div class="compare-cell ${isBest ? 'best' : ''}">${p.priceLabel}</div>`;
            }).join('')}
          </div>

          <!-- 评分 -->
          <div class="compare-row">
            <div class="compare-label">评分</div>
            ${products.map(p => {
              const isBest = p.rating === Math.max(...products.map(x => x.rating));
              return `<div class="compare-cell ${isBest ? 'best' : ''}">${p.rating}</div>`;
            }).join('')}
          </div>

          <!-- 安装难度 -->
          <div class="compare-row">
            <div class="compare-label">安装难度</div>
            ${products.map(p => {
              const diffMap = { plug: '即插即用', stick: '粘贴安装', switch: '替换安装', rewire: '布线安装' };
              const scoreMap = { plug: 1, stick: 2, switch: 3, rewire: 4 };
              const isBest = scoreMap[p.installDifficulty] === Math.min(...products.map(x => scoreMap[x.installDifficulty]));
              return `<div class="compare-cell ${isBest ? 'best' : ''}">${diffMap[p.installDifficulty]}</div>`;
            }).join('')}
          </div>

          <!-- 租房友好 -->
          <div class="compare-row">
            <div class="compare-label">租房友好</div>
            ${products.map(p => `
              <div class="compare-cell">${p.rentFriendly ? '<span class="text-green">Yes</span>' : '<span class="text-gray">No</span>'}</div>
            `).join('')}
          </div>

          <!-- 网关需求 -->
          <div class="compare-row">
            <div class="compare-label">网关需求</div>
            ${products.map(p => `
              <div class="compare-cell">${p.needGateway ? p.gatewayType : '无需'}</div>
            `).join('')}
          </div>

          <!-- 协议 -->
          <div class="compare-row">
            <div class="compare-label">通信协议</div>
            ${products.map(p => `
              <div class="compare-cell">${p.protocols.join(' / ')}</div>
            `).join('')}
          </div>
        </div>

        <!-- 评分对比图表 -->
        <div class="compare-chart-section">
          <h3>评分对比</h3>
          <div class="compare-bars">
            ${['stability', 'response', 'noise', 'quality', 'app', 'install'].map(key => {
              const labelMap = { stability: '稳定性', response: '响应速度', noise: '静音', quality: '做工质量', app: 'App体验', install: '安装便捷' };
              const maxScore = Math.max(...products.map(p => p.scores[key]));
              return `
                <div class="compare-bar-row">
                  <span class="bar-label">${labelMap[key]}</span>
                  <div class="bar-group">
                    ${products.map(p => {
                      const isBest = p.scores[key] === maxScore;
                      return `<div class="bar-item ${isBest ? 'bar-best' : ''}" style="--width: ${p.scores[key]}%; --color: ${isBest ? '#FF8C00' : '#e2e8f0'}">
                        <span class="bar-value">${p.scores[key]}</span>
                      </div>`;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="compare-legend">
            ${products.map(p => `<span class="legend-dot" style="background: ${p === products.find(x => true) ? '#FF8C00' : '#e2e8f0'}"></span><span>${p.name}</span>`).join('')}
          </div>
        </div>

        ${products.length < 3 ? `
          <div class="compare-add">
            <button class="btn btn-outline" onclick="router.navigate('shop')">继续添加产品</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  addSimilar(productId) {
    const result = store.addToCompare(productId);
    if (!result) {
      this._showToast('对比列表已满或已存在');
      return;
    }
    this.render();
  },

  remove(productId) {
    store.removeFromCompare(productId);
    this.render();
  },

  newCompare() {
    store.set('compare_list', []);
    router.navigate('shop');
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
