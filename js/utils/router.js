/**
 * 智家清单 - 简易SPA路由
 * 基于hash的路由系统，支持底部Tab和子页面
 */
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    this._tabRoutes = ['quiz', 'shop', 'recommend', 'square', 'profile'];
    this._subRoutes = ['product-detail', 'compare', 'scene', 'favorites', 'cart', 'owned-products'];
    this._init();
  }

  _init() {
    window.addEventListener('hashchange', () => this._onHashChange());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  beforeEach(hook) {
    this.beforeHooks.push(hook);
  }

  afterEach(hook) {
    this.afterHooks.push(hook);
  }

  navigate(path, params = {}) {
    const hash = path.startsWith('#') ? path : `#${path}`;
    window.location.hash = hash;
    // Store params
    if (Object.keys(params).length > 0) {
      this._currentParams = params;
    }
  }

  getParams() {
    return this._currentParams || {};
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  isTabRoute(path) {
    const route = path || window.location.hash.slice(1) || 'home';
    return this._tabRoutes.includes(route.split('?')[0]);
  }

  isSubRoute(path) {
    const route = path || window.location.hash.slice(1) || 'home';
    return this._subRoutes.includes(route.split('?')[0]);
  }

  _onHashChange() {
    const hash = window.location.hash.slice(1) || 'quiz';
    const [path, queryString] = hash.split('?');
    const params = {};

    // Parse query params
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    // Merge with manually set params
    Object.assign(params, this._currentParams || {});

    // Run before hooks
    for (const hook of this.beforeHooks) {
      if (hook(path, params) === false) return;
    }

    this.currentRoute = path;
    const handler = this.routes[path];
    if (handler) {
      handler(params);
    }

    // Run after hooks
    for (const hook of this.afterHooks) {
      hook(path, params);
    }

    this._currentParams = null;
  }

  start() {
    this._onHashChange();
  }
}

// 全局路由实例
const router = new Router();
