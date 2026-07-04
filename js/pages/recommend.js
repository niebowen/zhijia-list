/**
 * 智家清单 - 推荐方案页 (场景包模式)
 */
const RecommendPage = {
  data: null,
  budgetLimit: 5000,
  showAllBundles: false,

  // 品类显示名映射
  _categoryNames: {
    light_bulb: '智能灯泡',
    light_strip: '智能灯带',
    downlight: '筒射灯',
    ceiling_light: '智能主灯',
    atmosphere_light: '氛围灯',
    switch_wall: '智能墙壁开关',
    switch_wireless: '无线开关',
    smart_panel: '智能面板',
    sensor_door: '门窗传感器',
    sensor_body: '人体传感器',
    sensor_presence: '人在传感器',
    sensor_smoke: '烟雾报警器',
    sensor_temp: '温湿度传感器',
    sensor_gas: '天然气报警器',
    lock: '智能门锁',
    camera: '智能摄像头',
    curtain_motor: '智能窗帘电机',
    gateway: '智能网关',
    speaker: '智能音箱',
    ac_controller: '空调伴侣',
    air_purifier: '空气净化器',
    vacuum: '扫拖机器人',
    dishwasher: '洗碗机',
    humidifier: '加湿器',
    water_purifier: '净水器',
    fresh_air: '新风机'
  },

  // 需要备注的品类
  _categoryNotes: {
    curtain_motor: '按窗户数量选择',
    light_strip: '按需选米数',
    sensor_door: '按门窗数量选择',
    switch_wall: '按开关点位选择'
  },

  init() {
    this.data = store.getRecommendation();
    if (!this.data) {
      const quizResult = store.getQuizResult();
      if (quizResult) {
        try {
          const recommender = new Recommender(ProductsDB);
          this.data = recommender.generate(quizResult);
          store.saveRecommendation(this.data);
        } catch (e) {
          console.error('重新生成推荐失败:', e);
          App.showToast('方案生成失败，请重新测评');
          router.navigate('quiz');
          return;
        }
      } else {
        router.navigate('quiz');
        return;
      }
    }
    // 保存原始 bundle 名称，用于升级/降级系统
    this._originalBundleNames = {};
    this.data.bundles.forEach(b => {
      this._originalBundleNames[b.id] = b.name;
    });
    this.budgetLimit = this.data.totalCost;
  },

  render() {
    try {
      if (!this.data) this.init();
      if (!this.data) return;

      const container = document.getElementById('page-content');
      const userAnswers = store.getQuizResult() || this.data?.userAnswers || {};
      const profile = store.getProfile();
      const cartItems = store.getCart();
      const ownedMap = store.getOwnedProducts();

      // 应用用户保存的 bundle 升级级别
      this._applyBundleUpgradeLevels();

      const platformName = userAnswers.platform === 'apple' ? '苹果HomeKit' : userAnswers.platform === 'huawei' ? '华为HiLink' : '米家';
      const houseTypeText = userAnswers.houseType === 'new' ? '毛坯装修' : userAnswers.houseType === 'renovate' ? '改造' : '租房';
      const roomText = userAnswers.rooms
        ? `${userAnswers.rooms.bedrooms || 3}室${userAnswers.rooms.livingRooms || 1}厅`
        : '';

      // 总预算只计算未拥有品类的价格（使用用户选中的产品和数量）
      const totalCost = this.data.bundles.reduce((sum, bundle) => {
        const catMap = this._bundleToCategoryMap(bundle);
        let bundleCost = 0;
        for (const [catKey, catInfo] of Object.entries(catMap)) {
          const sel = this._getCategorySelection(bundle, catKey, catInfo);
          if (sel.qty <= 0) continue;
          const ownedQty = ownedMap[catKey] || 0;
          if (ownedQty < sel.qty) {
            bundleCost += sel.product.price * (sel.qty - ownedQty);
          }
        }
        return sum + bundleCost;
      }, 0);

      container.innerHTML = `
        <div class="page recommend-page">
          <div class="recommend-header">
            <h1>你的智能家居方案</h1>
            <div class="user-tags">
              <span class="tag tag-primary">${platformName}</span>
              <span class="tag tag-primary">${houseTypeText}</span>
              ${roomText ? `<span class="tag tag-primary">${roomText}</span>` : ''}
              ${(userAnswers.members || []).map(m => `<span class="tag">${this._memberText(m)}</span>`).join('')}
              ${(userAnswers.scenarios || []).map(s => `<span class="tag">${this._scenarioText(s)}</span>`).join('')}
            </div>
          </div>

          <div class="budget-bar">
            <div class="budget-info">
              <span class="budget-label">方案总预算</span>
              <span class="budget-current">¥${totalCost.toLocaleString()}</span>
            </div>
          </div>

          ${this._renderRoomLayout()}

          ${userAnswers.houseType === 'new' ? this._renderRenovationTips() : ''}

          <div class="scene-packages" id="scene-packages">
            ${this.data.bundles.map(bundle => this._renderBundle(bundle, profile, cartItems)).join('')}
          </div>

          ${this._renderAddAllRequiredButton(cartItems)}

          <div class="recommend-share-bar" style="margin:8px 16px 0;display:flex;gap:10px;">
            <button class="btn btn-outline" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;font-size:13px;" onclick="RecommendPage.sharePlan()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              分享方案
            </button>
            <button class="btn btn-outline" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;font-size:13px;" onclick="RecommendPage.copyPlanText()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              复制清单
            </button>
          </div>

          <div class="recommend-shortcuts">
            <h3>更多操作</h3>
            <div class="shortcut-grid">
              <div class="shortcut-card" onclick="router.navigate('shop')">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>选品商城</span>
              </div>
              <div class="shortcut-card" onclick="router.navigate('compare')">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M16 3h3v3h-3zM8 3h3v3H8zM5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8zM12 12v4"/></svg>
                <span>产品对比</span>
              </div>
              <div class="shortcut-card" onclick="router.navigate('scene')">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span>场景体验</span>
              </div>
              <div class="shortcut-card" onclick="router.navigate('square')">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>场景广场</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // 自动展开灯光氛围包，展示灯光效果
      setTimeout(() => {
        const lightingBundle = document.getElementById('bundle-lighting');
        if (lightingBundle) {
          const body = lightingBundle.querySelector('.scene-package-body');
          const toggle = lightingBundle.querySelector('.scene-package-toggle');
          if (body && body.style.display !== 'block') {
            body.style.display = 'block';
            if (toggle) toggle.style.transform = 'rotate(180deg)';
          }
        }
      }, 100);
    } catch (e) {
      console.error('推荐页面渲染失败:', e);
      App.showToast('页面渲染出错，请刷新重试');
    }
  },

  // 将场景包的产品聚合为品类映射
  _bundleToCategoryMap(bundle) {
    const catMap = {};
    bundle.products.forEach(p => {
      const key = this._getProductCategoryKey(p);
      if (!key) return;
      if (!catMap[key]) {
        catMap[key] = { qty: 0, minPrice: Infinity, products: [] };
      }
      catMap[key].qty += (p.quantity || 1);
      catMap[key].minPrice = Math.min(catMap[key].minPrice, p.price);
      catMap[key].products.push(p);
    });
    return catMap;
  },

  // 获取某个bundle下某个品类的用户选择（产品+数量），若无则返回默认
  _getCategorySelection(bundle, catKey, info) {
    const saved = store.getBundleCategorySelection(bundle.id, catKey);
    const qty = saved ? saved.quantity : info.qty;
    const defaultProduct = info.products.reduce((min, p) => p.price < min.price ? p : min, info.products[0]);
    const productId = saved ? saved.productId : defaultProduct.id;
    // 先从 bundle 内的产品找，找不到再从全局 ProductsDB 找
    let product = info.products.find(p => p.id === productId);
    if (!product) {
      product = ProductsDB.find(p => p.id === productId) || defaultProduct;
    }
    return { productId: product.id, product, qty };
  },

  _getProductCategoryKey(product) {
    const cat = product.category;
    const name = product.name || '';
    if (cat === 'gateway') return 'gateway';
    if (cat === 'speaker') return 'speaker';
    if (cat === 'lock') return 'lock';
    if (cat === 'camera') return 'camera';
    if (cat === 'curtain') return 'curtain_motor';
    if (cat === 'light') {
      if (name.includes('灯带')) return 'light_strip';
      if (name.includes('筒灯') || name.includes('射灯')) return 'downlight';
      if (name.includes('吸顶灯') || name.includes('主灯')) return 'ceiling_light';
      if (name.includes('氛围') || name.includes('星空')) return 'atmosphere_light';
      return 'light_bulb';
    }
    if (cat === 'switch') {
      if (name.includes('无线') || name.includes('随意贴')) return 'switch_wireless';
      if (name.includes('面板')) return 'smart_panel';
      return 'switch_wall';
    }
    if (cat === 'sensor') {
      if (name.includes('门窗')) return 'sensor_door';
      if (name.includes('人在')) return 'sensor_presence';
      if (name.includes('人体') || name.includes('雷达')) return 'sensor_body';
      if (name.includes('烟雾')) return 'sensor_smoke';
      if (name.includes('温湿度')) return 'sensor_temp';
      if (name.includes('天然气')) return 'sensor_gas';
      if (name.includes('水浸')) return 'sensor_water';
      return 'sensor_body';
    }
    if (cat === 'appliance') {
      if (name.includes('空调') || name.includes('伴侣')) return 'ac_controller';
      if (name.includes('净化')) return 'air_purifier';
      if (name.includes('机器人') || name.includes('扫地') || name.includes('扫拖')) return 'vacuum';
      if (name.includes('洗碗机')) return 'dishwasher';
      if (name.includes('加湿')) return 'humidifier';
      if (name.includes('净水')) return 'water_purifier';
      if (name.includes('新风')) return 'fresh_air';
    }
    return null;
  },

  // 品类到推荐房间的映射
  _categoryToRoomMap: {
    gateway: '客厅',
    speaker: '客厅',
    lock: '玄关',
    camera: '客厅',
    curtain_motor: '卧室',
    light_bulb: '卧室',
    light_strip: '客厅',
    downlight: '客厅',
    ceiling_light: '客厅',
    atmosphere_light: '客厅',
    switch_wall: '客厅',
    switch_wireless: '卧室',
    smart_panel: '客厅',
    sensor_door: '玄关',
    sensor_body: '玄关',
    sensor_presence: '卫生间',
    sensor_smoke: '厨房',
    sensor_temp: '客厅',
    sensor_gas: '厨房',
    sensor_water: '厨房',
    ac_controller: '客厅',
    air_purifier: '客厅',
    vacuum: '客厅',
    dishwasher: '厨房',
    humidifier: '卧室',
    water_purifier: '厨房',
    fresh_air: '客厅'
  },

  // 渲染房间布局图
  _renderRoomLayout() {
    const userAnswers = store.getQuizResult() || {};
    const rooms = userAnswers.rooms || { bedrooms: 3, livingRooms: 1 };
    const bedroomCount = Math.max(1, Math.min(5, rooms.bedrooms || 3));

    // 收集所有场景包中的推荐品类及总数量
    const categoryMap = {};
    this.data.bundles.forEach(bundle => {
      const catMap = this._bundleToCategoryMap(bundle);
      Object.entries(catMap).forEach(([catKey, info]) => {
        const sel = this._getCategorySelection(bundle, catKey, info);
        if (sel.qty > 0) {
          categoryMap[catKey] = (categoryMap[catKey] || 0) + sel.qty;
        }
      });
    });

    // 按房间聚合品类
    const roomItems = { '客厅': [], '卧室': [], '厨房': [], '卫生间': [], '玄关': [] };
    Object.entries(categoryMap).forEach(([catKey, qty]) => {
      const room = this._categoryToRoomMap[catKey] || '客厅';
      const catName = this._categoryNames[catKey] || catKey;
      if (roomItems[room]) {
        const existing = roomItems[room].find(r => r.name === catName);
        if (existing) {
          existing.qty += qty;
        } else {
          roomItems[room].push({ name: catName, qty });
        }
      }
    });

    const roomStyle = 'background:var(--bg,#0a0a0a);border:1px solid var(--border,#333);border-radius:8px;padding:6px 8px;display:flex;flex-direction:column;flex:1;';
    const tagStyle = 'display:inline-block;font-size:10px;color:var(--text-secondary);background:var(--bg2,#1a1a1a);border-radius:3px;padding:1px 5px;margin:1px;white-space:nowrap;';
    const roomTitleStyle = 'font-size:11px;font-weight:600;color:var(--primary,#FF8C00);margin-bottom:3px;';

    const renderRoomTags = items => items.map(item =>
      `<span style="${tagStyle}">${item.name}${item.qty > 1 ? '×' + item.qty : ''}</span>`
    ).join('');

    // 右侧一列排列所有房间，最多显示2个卧室
    const displayBedrooms = Math.min(bedroomCount, 2);
    const roomsHtml = `
      <!-- 客厅 -->
      <div style="${roomStyle}">
        <div style="${roomTitleStyle}">客厅</div>
        <div style="display:flex;flex-wrap:wrap;">${renderRoomTags(roomItems['客厅'])}</div>
      </div>
      ${Array.from({ length: displayBedrooms }, (_, i) => `
        <div style="${roomStyle}">
          <div style="${roomTitleStyle}">卧室${i + 1}</div>
          <div style="display:flex;flex-wrap:wrap;">${renderRoomTags(roomItems['卧室'])}</div>
        </div>
      `).join('')}
      <!-- 厨房 -->
      <div style="${roomStyle}">
        <div style="${roomTitleStyle}">厨房</div>
        <div style="display:flex;flex-wrap:wrap;">${renderRoomTags(roomItems['厨房'])}</div>
      </div>
      <!-- 卫生间 -->
      <div style="${roomStyle}">
        <div style="${roomTitleStyle}">卫生间</div>
        <div style="display:flex;flex-wrap:wrap;">${renderRoomTags(roomItems['卫生间'])}</div>
      </div>
      <!-- 玄关 -->
      <div style="${roomStyle}">
        <div style="${roomTitleStyle}">玄关</div>
        <div style="display:flex;flex-wrap:wrap;">${renderRoomTags(roomItems['玄关'])}</div>
      </div>
    `;

    return `
      <div style="padding:0 16px 8px;">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:4px;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            推荐布置
          </div>
          <button class="btn btn-text" style="font-size:11px;padding:1px 4px;height:auto;" onclick="RecommendPage.showRoomLayoutDetail()">上传户型图</button>
        </div>
        <div style="display:flex;gap:8px;align-items:stretch;">
          <div style="flex:2;min-width:0;border-radius:8px;overflow:hidden;border:1px solid var(--border,#333);display:flex;align-items:center;justify-content:center;background:var(--bg2,#1a1a1a);">
            <img src="assets/floorplan-ref.png" alt="户型图参考" style="width:100%;height:auto;object-fit:contain;display:block;">
          </div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">
            ${roomsHtml}
          </div>
        </div>
      </div>
    `;
  },

  showRoomLayoutDetail() {
    const overlay = document.createElement('div');
    overlay.id = 'room-layout-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
      <div style="background:var(--bg2,#1a1a1a);border-radius:16px;padding:24px;max-width:360px;width:100%;border:1px solid var(--border,#333);text-align:center;">
        <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,140,0,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h3 style="margin:0 0 16px;color:var(--text-primary,#fff);font-size:18px;">上传户型图</h3>
        <p style="margin:0 0 16px;color:var(--text-secondary,#999);font-size:14px;line-height:1.6;">本功能尚待开发。<br>根据上传图纸，自动识别户型，并标注设备推荐安装位置。</p>
        <div style="border-radius:12px;overflow:hidden;border:1px solid var(--border,#333);margin-bottom:16px;">
          <img src="assets/floorplan-ref.png" alt="户型图示意" style="width:100%;display:block;">
        </div>
        <p style="margin:0 0 16px;color:var(--text-secondary,#666);font-size:12px;line-height:1.5;">示意图：红色=网关，橙色=灯光/开关，蓝色=传感器，绿色=摄像头</p>
        <button class="btn btn-primary" style="width:100%;" onclick="document.getElementById('room-layout-overlay').remove()">知道了</button>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  /**
   * 应用用户保存的 bundle 升级级别
   */
  _applyBundleUpgradeLevels() {
    if (!this.data || !this.data.bundles) return;
    this.data.bundles.forEach(bundle => {
      const paths = this._bundleUpgradePaths[bundle.id];
      if (!paths) return;
      const savedLevel = store.getBundleLevel(bundle.id);
      if (savedLevel === null || savedLevel === undefined) return;
      const level = Math.max(0, Math.min(savedLevel, paths.length - 1));
      const path = paths[level];
      if (!path) return;
      // 更新 bundle 名称和产品列表
      bundle.name = path.name;
      // 根据产品ID从ProductsDB中查找对应产品
      const newProducts = [];
      path.products.forEach(pid => {
        const p = ProductsDB.find(prod => this._getProductCategoryKey(prod) === pid);
        if (p) newProducts.push(p);
      });
      if (newProducts.length > 0) {
        bundle.products = newProducts;
      }
    });
  },

  /**
   * 升级 bundle 到下一级别
   */
  upgradeBundle(bundleId) {
    const paths = this._bundleUpgradePaths[bundleId];
    if (!paths) return;
    const currentLevel = store.getBundleLevel(bundleId);
    const defaultLevel = paths.findIndex(p => p.name === this._getOriginalBundleName(bundleId));
    let level = currentLevel !== null ? currentLevel : defaultLevel;
    if (level < 0) level = defaultLevel;
    if (level < paths.length - 1) {
      store.setBundleLevel(bundleId, level + 1);
      this.render();
      App.showToast(`已升级至「${paths[level + 1].name}」`);
    } else {
      App.showToast('已经是最高级别');
    }
  },

  /**
   * 降级 bundle 到上一级别
   */
  downgradeBundle(bundleId) {
    const paths = this._bundleUpgradePaths[bundleId];
    if (!paths) return;
    const currentLevel = store.getBundleLevel(bundleId);
    const defaultLevel = paths.findIndex(p => p.name === this._getOriginalBundleName(bundleId));
    let level = currentLevel !== null ? currentLevel : defaultLevel;
    if (level < 0) level = defaultLevel;
    if (level > 0) {
      store.setBundleLevel(bundleId, level - 1);
      this.render();
      App.showToast(`已降级至「${paths[level - 1].name}」`);
    } else {
      App.showToast('已经是最低级别');
    }
  },

  /**
   * 一键加入所有必需包按钮
   */
  _renderAddAllRequiredButton(cartItems) {
    const requiredBundles = this.data.bundles.filter(b => b.priority === 'required');
    const ownedMap = store.getOwnedProducts();
    let totalCost = 0;
    let hasUnowned = false;

    for (const bundle of requiredBundles) {
      const catMap = this._bundleToCategoryMap(bundle);
      for (const [catKey, info] of Object.entries(catMap)) {
        const sel = this._getCategorySelection(bundle, catKey, info);
        if (sel.qty <= 0) continue;
        const ownedQty = ownedMap[catKey] || 0;
        if (ownedQty < sel.qty) {
          totalCost += sel.product.price * (sel.qty - ownedQty);
          hasUnowned = true;
        }
      }
    }

    if (!hasUnowned) return '';

    const allInCart = requiredBundles.every(bundle =>
      cartItems.some(item => item.bundleId === bundle.id)
    );

    return `
      <div style="margin:16px 0;display:flex;justify-content:center;">
        <button class="btn btn-primary" style="padding:12px 28px;font-size:15px;display:flex;align-items:center;gap:8px;"
                onclick="RecommendPage.addAllRequiredToCart()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          ${allInCart ? '必需包已加入购物车' : `一键加入所有必需包（¥${totalCost.toLocaleString()}）`}
        </button>
      </div>
    `;
  },

  /**
   * 毛坯装修预埋建议卡片
   */
  _renderRenovationTips() {
    return `
      <div class="renovation-tips-card" style="margin:16px 16px 0;background:var(--surface,#1a1a1a);border:1px solid rgba(255,140,0,0.3);border-radius:14px;padding:18px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;right:0;background:var(--primary);color:#000;padding:3px 12px;border-radius:0 14px 0 14px;font-size:11px;font-weight:600;">装修必看</div>
        <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;color:var(--text-primary,#fff);">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          装修预埋建议
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;line-height:1.6;">
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">灯具</span>
            <span style="color:var(--text-secondary,#999);">吊顶预留灯带/筒灯/射灯布线点位，多回路实现分层氛围灯光</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">水电</span>
            <span style="color:var(--text-secondary,#999);">卫生间吊顶预留智能水阀位置，扫拖机器人预留上下水+电源</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">网络</span>
            <span style="color:var(--text-secondary,#999);">提前规划网关/WiFi路由点位，覆盖全屋无信号死角</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">收纳</span>
            <span style="color:var(--text-secondary,#999);">预留隐藏空间收纳路由器/网关/传感器/电源线，保持整洁</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">交互</span>
            <span style="color:var(--text-secondary,#999);">场景面板/智能音箱安装在随手可触位置，兼顾日常操作</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="color:var(--primary);font-weight:700;flex-shrink:0;">关键</span>
            <span style="color:var(--text-secondary,#999);">水电阶段务必预留零线！智能开关需要零线供电</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 灯光效果预览展开/收起
   */
  toggleLightingDemo() {
    const frame = document.getElementById('lighting-demo-frame');
    const arrow = document.getElementById('lighting-demo-arrow');
    if (frame) {
      const isHidden = frame.style.display === 'none';
      frame.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  },

  /**
   * 获取 bundle 的原始名称（来自推荐引擎）
   */
  _getOriginalBundleName(bundleId) {
    return this._originalBundleNames?.[bundleId] || '';
  },

  /**
   * 渲染 bundle 的升级/降级按钮
   */
  _renderUpgradeButtons(bundleId) {
    const paths = this._bundleUpgradePaths[bundleId];
    if (!paths || paths.length <= 1) return '';
    const currentLevel = store.getBundleLevel(bundleId);
    const defaultLevel = paths.findIndex(p => p.name === this._getOriginalBundleName(bundleId));
    let level = currentLevel !== null ? currentLevel : defaultLevel;
    if (level < 0) level = defaultLevel;
    const canUpgrade = level < paths.length - 1;
    const canDowngrade = level > 0;
    return `
      <div class="bundle-upgrade-controls" onclick="event.stopPropagation();" style="display:flex;flex-direction:row;align-items:center;gap:3px;margin-right:4px;">
        <button class="bundle-upgrade-btn ${canDowngrade ? '' : 'disabled'}" style="width:20px;height:20px;border-radius:4px;border:1px solid ${canDowngrade ? 'var(--primary)' : '#444'};background:${canDowngrade ? 'var(--primary)' : 'transparent'};color:${canDowngrade ? '#fff' : '#666'};display:flex;align-items:center;justify-content:center;padding:0;cursor:${canDowngrade ? 'pointer' : 'not-allowed'};font-size:8px;" ${canDowngrade ? `onclick="RecommendPage.downgradeBundle('${bundleId}')"` : ''} title="降低预算/降级">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 2v7M3 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="bundle-upgrade-btn ${canUpgrade ? '' : 'disabled'}" style="width:20px;height:20px;border-radius:4px;border:1px solid ${canUpgrade ? 'var(--primary)' : '#444'};background:${canUpgrade ? 'var(--primary)' : 'transparent'};color:${canUpgrade ? '#fff' : '#666'};display:flex;align-items:center;justify-content:center;padding:0;cursor:${canUpgrade ? 'pointer' : 'not-allowed'};font-size:8px;" ${canUpgrade ? `onclick="RecommendPage.upgradeBundle('${bundleId}')"` : ''} title="增加预算/升级">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 10V3M3 5l3-3 3 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
  },

  _renderBundle(bundle, profile, cartItems) {
    const priorityTag = bundle.priority === 'required'
      ? '<span class="priority-tag required">必需</span>'
      : bundle.priority === 'recommended'
      ? '<span class="priority-tag recommended">强烈推荐</span>'
      : '<span class="priority-tag optional">可选</span>';

    const isGateway = bundle.id === 'gateway';
    const ownedMap = store.getOwnedProducts();
    const catMap = this._bundleToCategoryMap(bundle);

    // 计算未拥有品类费用（使用用户选中的产品和数量）
    let unownedCost = 0;
    let allOwned = true;
    for (const [catKey, info] of Object.entries(catMap)) {
      const sel = this._getCategorySelection(bundle, catKey, info);
      if (sel.qty <= 0) continue;
      const ownedQty = ownedMap[catKey] || 0;
      if (ownedQty < sel.qty) {
        unownedCost += sel.product.price * (sel.qty - ownedQty);
        allOwned = false;
      }
    }

    // 计算bundle综合安装难度
    const installDiff = this._getBundleInstallDifficulty(bundle);
    const diffTag = installDiff === 'professional' ? '<span style="color:#e74c3c;font-size:11px;margin-left:6px;">需电工</span>'
      : installDiff === 'replace' ? '<span style="color:#f39c12;font-size:11px;margin-left:6px;">需动手</span>'
      : '<span style="color:#27ae60;font-size:11px;margin-left:6px;">即插即用</span>';

    const bundleInCart = cartItems.some(item => item.bundleId === bundle.id);
    const explanation = this.data.explanations && this.data.explanations[bundle.id]
      ? `<div class="bundle-explanation">${this.data.explanations[bundle.id]}</div>`
      : '';

    // 灯光包嵌入智能照明效果展示
    const lightingDemo = bundle.id === 'lighting'
      ? `<div class="lighting-demo-wrapper" style="margin:12px 0;border:1px solid var(--border,#333);border-radius:12px;overflow:hidden;background:#0a0a10;">
           <div style="height:600px;">
             <iframe src="assets/lighting-demo/smart-lighting-demo.html" style="width:100%;height:100%;border:none;" scrolling="no"></iframe>
           </div>
         </div>`
      : '';

    // 默认展开必需包
    const isExpanded = bundle.priority === 'required' ? 'expanded' : '';

    return `
      <div class="scene-package ${isGateway ? 'gateway-package' : ''} ${isExpanded}"
           id="bundle-${bundle.id}">
        <div class="scene-package-header" onclick="RecommendPage.toggleBundle('${bundle.id}')">
          <div class="scene-package-icon">${this._getBundleIcon(bundle.id)}</div>
          <div class="scene-package-info">
            <div class="scene-package-name">${bundle.name}${priorityTag}</div>
            <div class="scene-package-meta">
              ${Object.keys(catMap).length}个品类 ${bundle.tags.length > 0 ? '· ' + bundle.tags.join(' · ') : ''}
              ${diffTag}
              ${allOwned ? '· <span style="color:var(--success)">已全拥有</span>' : ''}
            </div>
          </div>
          <div class="scene-package-price">¥${unownedCost.toLocaleString()}</div>
          ${this._renderUpgradeButtons(bundle.id)}
          <svg class="scene-package-toggle" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        ${explanation}
        <div class="scene-package-body">
          ${lightingDemo}
          <div class="scene-package-products">
            ${Object.entries(catMap).map(([catKey, info]) => {
              const sel = this._getCategorySelection(bundle, catKey, info);
              const ownedQty = ownedMap[catKey] || 0;
              const needQty = sel.qty;
              const isOwned = ownedQty >= needQty;
              const partialOwned = ownedQty > 0 && ownedQty < needQty;
              const buyQty = Math.max(0, needQty - ownedQty);
              const catName = this._categoryNames[catKey] || catKey;
              const note = this._categoryNotes[catKey];
              const priceStyle = isOwned || needQty === 0 ? 'style="color:#666; text-decoration:line-through;"' : '';
              const itemStyle = isOwned ? 'sp-product-owned' : (needQty === 0 ? 'sp-product-owned' : '');
              return `
                <div class="sp-product ${itemStyle}" onclick="RecommendPage.viewCategoryProducts('${bundle.id}', '${catKey}')">
                  <div class="sp-product-info">
                    <div class="sp-product-name">
                      ${catName}
                      ${needQty === 0 ? '<span class="owned-tag" style="background:#666">已移除</span>' : isOwned ? '<span class="owned-tag">已拥有</span>' : partialOwned ? `<span class="owned-tag" style="background:#b8860b">已有${ownedQty}个</span>` : ''}
                    </div>
                    <div class="sp-product-desc">
                      ${needQty > 0 ? `${sel.product.name} · ¥${sel.product.price}/个` : '点击选择产品'}
                      ${note ? ` · ${note}` : ''}
                      ${partialOwned && needQty > 0 ? ` · 还需购买${buyQty}个` : ''}
                    </div>
                  </div>
                  <div class="sp-product-actions" style="display:flex; align-items:center; gap:10px;" onclick="event.stopPropagation();">
                    ${needQty > 0 ? `
                    <div class="qty-stepper" style="display:flex;align-items:center;gap:4px;">
                      <button class="btn btn-sm" style="width:26px;height:26px;border-radius:50%;padding:0;font-size:16px;line-height:1;"
                              onclick="RecommendPage.updateCategoryQty('${bundle.id}', '${catKey}', -1, event)">-</button>
                      <span style="min-width:20px;text-align:center;font-size:14px;">${needQty}</span>
                      <button class="btn btn-sm" style="width:26px;height:26px;border-radius:50%;padding:0;font-size:16px;line-height:1;"
                              onclick="RecommendPage.updateCategoryQty('${bundle.id}', '${catKey}', 1, event)">+</button>
                    </div>
                    ` : `
                    <button class="btn btn-sm" style="width:26px;height:26px;border-radius:50%;padding:0;font-size:16px;line-height:1;"
                            onclick="RecommendPage.updateCategoryQty('${bundle.id}', '${catKey}', 1, event)">+</button>
                    `}
                    <div class="sp-product-price" ${priceStyle} style="min-width:50px;text-align:right;">
                      ${needQty === 0 ? '¥0' : isOwned ? '¥0' : `¥${(sel.product.price * buyQty).toLocaleString()}`}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="scene-package-actions">
            ${allOwned ? `
              <button class="btn btn-outline" disabled>已全拥有</button>
            ` : `
              <button class="btn btn-primary"
                      onclick="event.stopPropagation(); RecommendPage.addBundleToCart('${bundle.id}')">
                ${bundleInCart ? '已加入购物车' : '加入购物车'}
              </button>
            `}
            <button class="btn btn-outline"
                    onclick="event.stopPropagation(); RecommendPage.viewBundleDetail('${bundle.id}')">
              查看详情
            </button>
          </div>
        </div>
      </div>
    `;
  },

  _getBundleIcon(id) {
    const icons = {
      gateway: '🔌',
      lighting: '💡',
      curtain: '🪟',
      security: '🔒',
      sensor: '📡',
      climate: '🌡️',
      pet: '🐾',
      chores: '🧹'
    };
    return icons[id] || '📦';
  },

  /**
   * 计算bundle的综合安装难度
   */
  _getBundleInstallDifficulty(bundle) {
    const ownedMap = store.getOwnedProducts();
    const catMap = this._bundleToCategoryMap(bundle);
    let maxDiff = 'stick'; // stick < replace < professional
    const diffOrder = { stick: 0, replace: 1, professional: 2 };

    for (const [catKey, info] of Object.entries(catMap)) {
      const sel = this._getCategorySelection(bundle, catKey, info);
      if (sel.qty <= 0) continue;
      const ownedQty = ownedMap[catKey] || 0;
      if (ownedQty >= sel.qty) continue; // 已拥有的不算
      const diff = sel.product.installDifficulty || 'stick';
      if (diffOrder[diff] > diffOrder[maxDiff]) {
        maxDiff = diff;
      }
    }
    return maxDiff;
  },

  _memberText(m) {
    const map = { self: '自住', elderly: '有老人', child: '有小孩', pet: '有宠物' };
    return map[m] || m;
  },

  // Bundle 升级路径定义
  _bundleUpgradePaths: {
    lighting: [
      { name: '灯光基础包', products: ['light_bulb', 'switch_wall'] },
      { name: '灯光氛围包', products: ['ceiling_light', 'switch_wall'] },
      { name: '灯光氛围包', products: ['downlight', 'light_strip', 'switch_wall'] }
    ],
    security: [
      { name: '安防基础包', products: ['sensor_door'] },
      { name: '安防安心包', products: ['lock', 'camera', 'sensor_door'] }
    ],
    curtain: [
      { name: '窗帘基础包', products: ['curtain_motor'] },
      { name: '窗帘升级包', products: ['curtain_motor', 'smart_panel'] }
    ],
    climate: [
      { name: '环境基础包', products: ['ac_controller'] },
      { name: '环境舒适包', products: ['ac_controller', 'air_purifier'] }
    ],
    sensor: [
      { name: '传感基础包', products: ['sensor_body'] },
      { name: '传感安防包', products: ['sensor_body', 'sensor_door', 'sensor_smoke', 'sensor_temp'] },
      { name: '传感智能包', products: ['sensor_presence', 'sensor_door', 'sensor_smoke', 'sensor_temp'] }
    ],
    pet: [
      { name: '宠物基础包', products: ['pet_feeder'] },
      { name: '宠物看护包', products: ['pet_feeder', 'camera'] }
    ]
  },

  // Bundle ID -> 场景描述
  _scenarioText(s) {
    const map = { home: '日常便利', comfort: '舒适体验', security: '安全防护', chores: '轻松家务' };
    return map[s] || s;
  },

  toggleBundle(id) {
    const el = document.getElementById(`bundle-${id}`);
    if (!el) return;
    el.classList.toggle('expanded');
  },

  // 点击品类 → 显示该品类下可选的具体产品
  viewCategoryProducts(bundleId, catKey) {
    const bundle = this.data.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const catName = this._categoryNames[catKey] || catKey;
    const note = this._categoryNotes[catKey];
    const ownedMap = store.getOwnedProducts();
    const ownedQty = ownedMap[catKey] || 0;
    const catMap = this._bundleToCategoryMap(bundle);
    const info = catMap[catKey];
    const sel = info ? this._getCategorySelection(bundle, catKey, info) : { productId: null, qty: 1 };

    // 找到该品类下的所有产品（从ProductsDB按品类筛选）
    const catProducts = ProductsDB.filter(p => {
      const pKey = this._getProductCategoryKey(p);
      return pKey === catKey;
    });

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page">
        <div class="recommend-header">
          <button class="btn btn-text" onclick="RecommendPage.render()" style="margin-bottom: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            返回方案
          </button>
          <h1>${catName}</h1>
          <div class="user-tags">
            <span class="tag">${bundle.name}</span>
            ${ownedQty > 0 ? `<span class="tag">已拥有${ownedQty}个</span>` : ''}
            ${note ? `<span class="tag tag-primary">${note}</span>` : ''}
          </div>
        </div>
        <div style="padding: 0 16px;">
          <div class="scene-package-products">
            ${catProducts.map(p => {
              const isSelected = sel.productId === p.id;
              return `
              <div class="sp-product ${isSelected ? 'sp-product-selected' : ''}"
                   style="${isSelected ? 'border:1px solid var(--primary); background:rgba(255,140,0,0.08);' : ''}">
                <div class="sp-product-info" onclick="ProductDetailPage.render({id:'${p.id}', fromBundleId:'${bundleId}', fromCatKey:'${catKey}'})">
                  <div class="sp-product-name">
                    ${p.name}
                    ${isSelected ? '<span class="owned-tag" style="background:var(--primary)">已选</span>' : ''}
                  </div>
                  <div class="sp-product-desc">${p.description || p.desc || ''}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="sp-product-price" style="font-weight:600;">¥${p.price.toLocaleString()}</div>
                  ${!isSelected ? `<button class="btn btn-sm btn-outline"
                          style="font-size:12px; padding:4px 10px; border-radius:6px; white-space:nowrap;"
                          onclick="RecommendPage.selectCategoryProduct('${bundleId}', '${catKey}', '${p.id}', ${sel.qty || (info ? info.qty : 1)})">替换</button>` : ''}
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  selectCategoryProduct(bundleId, catKey, productId, qty) {
    store.setBundleCategorySelection(bundleId, catKey, productId, qty);
    App.showToast('已切换产品，预算已更新');
    this.render();
  },

  updateCategoryQty(bundleId, catKey, delta, event) {
    if (event) event.stopPropagation();
    const bundle = this.data.bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    const catMap = this._bundleToCategoryMap(bundle);
    const info = catMap[catKey];
    if (!info) return;

    const sel = this._getCategorySelection(bundle, catKey, info);
    const newQty = Math.max(0, sel.qty + delta);

    // 记录当前展开的 bundle，避免重新渲染后收起
    const expandedIds = Array.from(document.querySelectorAll('.scene-package.expanded')).map(el => el.id.replace('bundle-', ''));

    store.setBundleCategorySelection(bundleId, catKey, sel.productId, newQty);
    this.render();

    // 恢复展开状态
    expandedIds.forEach(id => {
      const el = document.getElementById(`bundle-${id}`);
      if (el) el.classList.add('expanded');
    });
    // 确保当前操作的 bundle 也展开
    const currentEl = document.getElementById(`bundle-${bundleId}`);
    if (currentEl) currentEl.classList.add('expanded');
  },

  _filterByBudget(bundles, budget) {
    return bundles;
  },

  addBundleToCart(bundleId) {
    const bundle = this.data.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const ownedMap = store.getOwnedProducts();
    const catMap = this._bundleToCategoryMap(bundle);

    // 对每个品类，使用用户选中的产品加入购物车
    for (const [catKey, info] of Object.entries(catMap)) {
      const sel = this._getCategorySelection(bundle, catKey, info);
      if (sel.qty <= 0) continue;
      const ownedQty = ownedMap[catKey] || 0;
      const buyQty = sel.qty - ownedQty;
      if (buyQty <= 0) continue;
      store.addToCart(sel.productId, buyQty, bundle.id);
    }

    App.showToast(`已将「${bundle.name}」加入购物车`);
    App.updateCartBadge();
    window.triggerCartAnimation && window.triggerCartAnimation();
    this.render();
  },

  /**
   * 分享方案（调用浏览器原生分享）
   */
  sharePlan() {
    const text = this._buildShareText();
    if (navigator.share) {
      navigator.share({
        title: '我的智能家居方案 - 智家清单',
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      this.copyPlanText();
    }
  },

  /**
   * 复制方案清单到剪贴板
   */
  copyPlanText() {
    const text = this._buildShareText();
    navigator.clipboard.writeText(text).then(() => {
      App.showToast('方案清单已复制到剪贴板');
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.showToast('方案清单已复制到剪贴板');
    });
  },

  /**
   * 构建分享文案
   */
  _buildShareText() {
    const userAnswers = store.getQuizResult() || {};
    const ownedMap = store.getOwnedProducts();
    const platformName = userAnswers.platform === 'apple' ? '苹果HomeKit' : userAnswers.platform === 'huawei' ? '华为HiLink' : '米家';
    const houseTypeText = userAnswers.houseType === 'new' ? '毛坯装修' : userAnswers.houseType === 'renovate' ? '改造' : '租房';
    const roomText = userAnswers.rooms ? `${userAnswers.rooms.bedrooms || 3}室${userAnswers.rooms.livingRooms || 1}厅` : '';

    let text = `🏠 我的智能家居方案 | 智家清单\n`;
    text += `━━━━━━━━━━━━━━━━\n`;
    text += `平台：${platformName} | 类型：${houseTypeText}${roomText ? ' | ' + roomText : ''}\n\n`;

    let totalCost = 0;
    for (const bundle of this.data.bundles) {
      const catMap = this._bundleToCategoryMap(bundle);
      let bundleCost = 0;
      let items = [];

      for (const [catKey, info] of Object.entries(catMap)) {
        const sel = this._getCategorySelection(bundle, catKey, info);
        if (sel.qty <= 0) continue;
        const ownedQty = ownedMap[catKey] || 0;
        const buyQty = sel.qty - ownedQty;
        if (buyQty > 0) {
          bundleCost += sel.product.price * buyQty;
          items.push(`${sel.product.name} ×${buyQty} ¥${(sel.product.price * buyQty).toLocaleString()}`);
        }
      }

      if (items.length > 0) {
        totalCost += bundleCost;
        const priority = bundle.priority === 'required' ? '[必需]' : bundle.priority === 'recommended' ? '[推荐]' : '[可选]';
        text += `${this._getBundleIcon(bundle.id)} ${priority} ${bundle.name}\n`;
        items.forEach(i => { text += `  · ${i}\n`; });
        text += `  小计：¥${bundleCost.toLocaleString()}\n\n`;
      }
    }

    text += `━━━━━━━━━━━━━━━━\n`;
    text += `💰 方案总预算：¥${totalCost.toLocaleString()}\n`;
    text += `🔗 来智家清单生成你的方案：${window.location.href}`;

    return text;
  },

  /**
   * 一键加入所有必需包到购物车
   */
  addAllRequiredToCart() {
    const requiredBundles = this.data.bundles.filter(b => b.priority === 'required');
    const ownedMap = store.getOwnedProducts();
    let addedCount = 0;

    for (const bundle of requiredBundles) {
      const catMap = this._bundleToCategoryMap(bundle);
      for (const [catKey, info] of Object.entries(catMap)) {
        const sel = this._getCategorySelection(bundle, catKey, info);
        if (sel.qty <= 0) continue;
        const ownedQty = ownedMap[catKey] || 0;
        const buyQty = sel.qty - ownedQty;
        if (buyQty <= 0) continue;
        store.addToCart(sel.productId, buyQty, bundle.id);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      App.showToast(`已将所有必需包加入购物车`);
      App.updateCartBadge();
      window.triggerCartAnimation && window.triggerCartAnimation();
      this.render();
    }
  },

  _getSceneDescription(bundleId) {
    const scenes = {
      gateway: [
        { name: '全屋中枢', desc: '网关统一管理所有智能设备，实现跨品牌互联互通' },
        { name: '断网可控', desc: '本地执行自动化场景，网络异常时设备依然正常工作' }
      ],
      lighting: [
        { name: '回家模式', desc: '开门自动开灯，灯光渐亮至舒适亮度' },
        { name: '观影模式', desc: '一键调暗灯光，营造影院氛围' },
        { name: '起床唤醒', desc: '模拟日出光线，温柔唤醒每一天' },
        { name: '离家关灯', desc: '出门一键关闭全屋灯光，节能省心' }
      ],
      curtain: [
        { name: '日出开合', desc: '定时自动打开窗帘，自然光唤醒' },
        { name: '睡眠模式', desc: '夜晚自动闭合窗帘，保护隐私' },
        { name: '观影联动', desc: '打开电视自动关窗帘，沉浸体验' }
      ],
      security: [
        { name: '离家布防', desc: '出门自动开启安防模式，异常即时报警' },
        { name: '访客记录', desc: '门锁联动摄像头，每次开门都有记录' },
        { name: '夜间巡逻', desc: '红外感应异常移动，自动录像推送' }
      ],
      sensor: [
        { name: '人来灯亮', desc: '感应到人体移动自动亮灯，离开自动关闭' },
        { name: '门窗未关提醒', desc: '睡前检测门窗状态，未关及时提醒' },
        { name: '燃气泄漏报警', desc: '检测到燃气泄漏立即报警并通知手机' }
      ],
      climate: [
        { name: '回家即舒适', desc: '离家自动关闭空调，回家前提前开启' },
        { name: '睡眠温控', desc: '夜间自动调节温度，整晚舒适' },
        { name: '空气管家', desc: '空气质量差时自动开启净化器' }
      ],
      pet: [
        { name: '远程看宠', desc: '随时随地查看宠物动态，双向语音互动' },
        { name: '自动喂食', desc: '定时定量自动喂食，外出无担忧' },
        { name: '宠物安防', desc: '宠物异常行为检测，及时推送提醒' }
      ],
      chores: [
        { name: '定时清扫', desc: '每天定时自动扫地拖地，回家就是干净地面' },
        { name: '餐后解放', desc: '吃完饭后把碗交给洗碗机，把时间还给生活' },
        { name: '语音控制', desc: '小爱同学，开始扫地/开始洗碗，一句话搞定' }
      ]
    };
    return scenes[bundleId] || [];
  },

  viewBundleDetail(bundleId) {
    const bundle = this.data.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    const scenes = this._getSceneDescription(bundleId);
    const ownedMap = store.getOwnedProducts();
    const catMap = this._bundleToCategoryMap(bundle);

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page">
        <div class="recommend-header">
          <button class="btn btn-text" onclick="RecommendPage.render()" style="margin-bottom: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            返回方案
          </button>
          <h1>${bundle.name}</h1>
          <div class="user-tags">
            ${bundle.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
        <div style="padding: 0 16px;">
          <p style="color: var(--text-secondary); margin-bottom: 16px;">${bundle.description}</p>

          ${scenes.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 12px;">智能场景展示</h3>
              <div class="scene-cards">
                ${scenes.map(s => `
                  <div class="scene-card" style="background: var(--bg2); border-radius: 12px; padding: 14px; margin-bottom: 10px; border: 1px solid var(--border);">
                    <div style="font-weight: 600; color: var(--primary); margin-bottom: 6px;">${s.name}</div>
                    <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">${s.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 12px;">包含品类</h3>
          <div class="scene-package-products">
            ${Object.entries(catMap).map(([catKey, info]) => {
              const sel = this._getCategorySelection(bundle, catKey, info);
              const ownedQty = ownedMap[catKey] || 0;
              const needQty = sel.qty;
              const isOwned = ownedQty >= needQty;
              const catName = this._categoryNames[catKey] || catKey;
              const note = this._categoryNotes[catKey];
              const priceStyle = isOwned || needQty === 0 ? 'style="color:#666; text-decoration:line-through;"' : '';
              return `
                <div class="sp-product ${isOwned || needQty === 0 ? 'sp-product-owned' : ''}" onclick="RecommendPage.viewCategoryProducts('${bundle.id}', '${catKey}')">
                  <div class="sp-product-info">
                    <div class="sp-product-name">
                      ${catName}${needQty > 0 ? ` x${needQty}` : ''}
                      ${needQty === 0 ? '<span class="owned-tag" style="background:#666">已移除</span>' : isOwned ? '<span class="owned-tag">已拥有</span>' : ''}
                    </div>
                    <div class="sp-product-desc">
                      ${needQty > 0 ? `${sel.product.name} · ¥${sel.product.price}/个` : '已从此方案中移除'}
                      ${note ? ` · ${note}` : ''}
                    </div>
                  </div>
                  <div class="sp-product-price" ${priceStyle}>
                    ${needQty === 0 ? '¥0' : isOwned ? '¥0' : `¥${(sel.product.price * (needQty - ownedQty)).toLocaleString()}`}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
};
