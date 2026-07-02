/**
 * 智家清单 - 本地存储管理
 * 封装localStorage操作，管理用户数据
 */
class Store {
  constructor(prefix = 'zhijia_') {
    this.prefix = prefix;
    this._memoryCache = {};
  }

  set(key, value) {
    const fullKey = this.prefix + key;
    const data = JSON.stringify(value);
    try {
      localStorage.setItem(fullKey, data);
      this._memoryCache[fullKey] = data;
    } catch (e) {
      console.warn('Store.set failed:', e);
    }
  }

  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    if (this._memoryCache[fullKey]) {
      try {
        return JSON.parse(this._memoryCache[fullKey]);
      } catch (e) {
        // fall through to localStorage
      }
    }
    try {
      const data = localStorage.getItem(fullKey);
      if (data === null) return defaultValue;
      this._memoryCache[fullKey] = data;
      return JSON.parse(data);
    } catch (e) {
      return defaultValue;
    }
  }

  remove(key) {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
    delete this._memoryCache[fullKey];
  }

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
    this._memoryCache = {};
  }

  // === 业务方法 ===

  // 问卷结果
  getQuizResult() {
    return this.get('quiz_result', null);
  }

  saveQuizResult(result) {
    this.set('quiz_result', result);
    this.set('quiz_completed', true);
  }

  isQuizCompleted() {
    return this.get('quiz_completed', false);
  }

  // 推荐方案
  getRecommendation() {
    return this.get('recommendation', null);
  }

  saveRecommendation(data) {
    this.set('recommendation', data);
  }

  // 产品对比列表
  getCompareList() {
    return this.get('compare_list', []);
  }

  addToCompare(productId) {
    const list = this.getCompareList();
    if (list.length >= 3) return false;
    if (list.includes(productId)) return false;
    list.push(productId);
    this.set('compare_list', list);
    return true;
  }

  removeFromCompare(productId) {
    const list = this.getCompareList().filter(id => id !== productId);
    this.set('compare_list', list);
  }

  isInCompare(productId) {
    return this.getCompareList().includes(productId);
  }

  // 场景收藏
  getFavorites() {
    return this.get('favorites', []);
  }

  toggleFavorite(sceneId) {
    const list = this.getFavorites();
    const index = list.indexOf(sceneId);
    if (index === -1) {
      list.push(sceneId);
    } else {
      list.splice(index, 1);
    }
    this.set('favorites', list);
    return list;
  }

  isFavorited(sceneId) {
    return this.getFavorites().includes(sceneId);
  }

  // 社区点赞
  getLikes() {
    return this.get('likes', []);
  }

  toggleLike(sceneId) {
    const list = this.getLikes();
    const index = list.indexOf(sceneId);
    if (index === -1) {
      list.push(sceneId);
    } else {
      list.splice(index, 1);
    }
    this.set('likes', list);
    return list;
  }

  isLiked(sceneId) {
    return this.getLikes().includes(sceneId);
  }

  // === 购物车方法 ===

  getCart() {
    return this.get('cart', []);
  }

  saveCart(cart) {
    this.set('cart', cart);
  }

  addToCart(productId, quantity = 1, scenePackageId = null) {
    const cart = this.getCart();
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity, scenePackageId });
    }
    this.set('cart', cart);
    return cart;
  }

  removeFromCart(productId) {
    const cart = this.getCart().filter(item => item.productId !== productId);
    this.set('cart', cart);
    return cart;
  }

  clearCart() {
    this.set('cart', []);
    return [];
  }

  getCartTotal() {
    const cart = this.getCart();
    if (!cart.length || typeof ProductsDB === 'undefined') return 0;
    return cart.reduce((sum, item) => {
      const product = ProductsDB.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  // === 我家已有产品 (品类 + 数量) ===

  getOwnedProducts() {
    return this.get('owned_products_v2', {});
  }

  setOwnedQuantity(categoryKey, quantity) {
    const map = this.getOwnedProducts();
    if (quantity > 0) {
      map[categoryKey] = quantity;
    } else {
      delete map[categoryKey];
    }
    this.set('owned_products_v2', map);
    return map;
  }

  getOwnedQuantity(categoryKey) {
    return this.getOwnedProducts()[categoryKey] || 0;
  }

  // === 场景包品类选中产品和数量 ===

  getBundleSelections() {
    return this.get('bundle_selections', {});
  }

  getBundleCategorySelection(bundleId, catKey) {
    const all = this.getBundleSelections();
    return all[bundleId]?.[catKey] || null;
  }

  setBundleCategorySelection(bundleId, catKey, productId, quantity) {
    const all = this.getBundleSelections();
    if (!all[bundleId]) all[bundleId] = {};
    all[bundleId][catKey] = { productId, quantity };
    this.set('bundle_selections', all);
    return all;
  }

  removeBundleCategorySelection(bundleId, catKey) {
    const all = this.getBundleSelections();
    if (all[bundleId]) {
      delete all[bundleId][catKey];
      if (Object.keys(all[bundleId]).length === 0) {
        delete all[bundleId];
      }
    }
    this.set('bundle_selections', all);
    return all;
  }

  // Bundle 升级级别
  getBundleLevel(bundleId) {
    const levels = this.get('bundle_levels', {});
    return levels[bundleId] !== undefined ? levels[bundleId] : null;
  }

  setBundleLevel(bundleId, level) {
    const levels = this.get('bundle_levels', {});
    levels[bundleId] = level;
    this.set('bundle_levels', levels);
    return levels;
  }

  removeBundleLevel(bundleId) {
    const levels = this.get('bundle_levels', {});
    delete levels[bundleId];
    this.set('bundle_levels', levels);
    return levels;
  }

  // 用户档案
  getProfile() {
    return this.get('profile', { favorites: [] });
  }

  saveProfile(profile) {
    this.set('profile', profile);
  }

  // 户型图
  saveFloorplanImage(imageData) {
    this.set('floorplan_image', imageData);
  }

  getFloorplanImage() {
    return this.get('floorplan_image', null);
  }

  clearFloorplanImage() {
    this.set('floorplan_image', null);
  }
}

// 全局存储实例
const store = new Store();
