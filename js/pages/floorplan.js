/**
 * 智家清单 - 户型编辑器页面
 * 基于 Canvas 的户型绘制 + 智能家居设备布局建议
 */
const FloorplanPage = {
  // ========== 常量 ==========
  SCALE: 50,
  GRID_STEP: 0.5,
  SNAP_THRESHOLD: 0.3,
  WALL_THICKNESS: 0.1,
  DOORWAY_WIDTH: 0.8,
  MIN_ZOOM: 0.3,
  MAX_ZOOM: 3.0,
  HANDLE_SIZE: 5,
  PLACE_GRID: 0.5,

  ROOM_STYLES: {
    '客厅': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '主卧': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '次卧': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '厨房': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '卫生间': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '阳台': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '书房': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' },
    '玄关': { fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.5)', text: '#fff' }
  },
  ROOM_ORDER: ['客厅','主卧','次卧','厨房','卫生间','阳台','书房','玄关'],
  HANDLE_NAMES: ['nw','n','ne','e','se','s','sw','w'],

  SMART_PRESETS: {
    A: { name: '基础智能', devices: [
      { type: 'smartLock', count: 1, note: '入户门' },
      { type: 'smartSpeaker', count: 1, note: '客厅' },
      { type: 'smartSwitch', count: 3, note: '客厅/主卧/次卧' },
      { type: 'gateway', count: 1, note: '中心位置' }
    ]},
    B: { name: '舒适生活', devices: [
      { type: 'smartLock', count: 1, note: '入户门' },
      { type: 'smartSpeaker', count: 1, note: '客厅' },
      { type: 'smartSwitch', count: 3, note: '客厅/主卧/次卧' },
      { type: 'gateway', count: 1, note: '中心位置' },
      { type: 'robotVacuum', count: 1, note: '客厅/玄关' },
      { type: 'smartCurtain', count: 1, note: '主卧' },
      { type: 'camera', count: 1, note: '玄关' },
      { type: 'tempSensor', count: 2, note: '客厅/主卧' },
      { type: 'motionSensor', count: 2, note: '走廊交汇处' }
    ]},
    C: { name: '全屋智能', devices: [
      { type: 'smartLock', count: 1, note: '入户门' },
      { type: 'smartSpeaker', count: 3, note: '客厅/主卧/书房' },
      { type: 'smartSwitch', count: 3, note: '客厅/主卧/次卧' },
      { type: 'gateway', count: 1, note: '中心位置' },
      { type: 'robotVacuum', count: 1, note: '客厅/玄关' },
      { type: 'smartCurtain', count: 3, note: '客厅/主卧/次卧' },
      { type: 'camera', count: 1, note: '玄关' },
      { type: 'tempSensor', count: 2, note: '客厅/主卧' },
      { type: 'motionSensor', count: 2, note: '走廊交汇处' },
      { type: 'airPurifier', count: 1, note: '客厅中心' },
      { type: 'smartBathHeater', count: 1, note: '卫生间' },
      { type: 'smokeAlarm', count: 2, note: '厨房/卫生间' }
    ]}
  },

  // ========== 状态 ==========
  _rooms: [],
  _doorways: [],
  _selectedId: null,
  _dragState: null,
  _resizeState: null,
  _hoverHandle: null,
  _hoverDoorwayIdx: -1,
  _viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
  _panState: null,
  _spaceHeld: false,
  _entranceDoor: { roomId: '', wall: '', offset: 0 },
  _placementMode: 'none',
  _smartDevices: [],
  _currentPreset: null,
  _currentTool: 'select',
  _touches: [],
  _lastTouchDist: 0,
  _touchStartTime: 0,
  _touchStartPos: null,
  _longPressTimer: null,
  _isLongPress: false,
  _touchMoved: false,
  _sheetState: 'hidden',
  _sheetDetailExpanded: false,

  // ========== 渲染入口 ==========
  render() {
    const container = document.getElementById('page-content');
    container.innerHTML = this._getHTML();
    this._initDOM();
    this._bindEvents();
    this._resizeCanvas();
    this._loadDemo();
    this._draw();
  },

  _getHTML() {
    return `
    <div class="floorplan-page">
      <div class="fp-topbar">
        <span class="fp-title">户型编辑器</span>
        <div class="fp-topbar-actions">
          <button class="fp-btn fp-btn-sm" id="fp-undo-btn" title="撤销 (Ctrl+Z)">↩ 撤销</button>
          <button class="fp-btn fp-btn-sm" id="fp-help-btn" title="使用说明">?</button>
          <button class="fp-btn fp-btn-sm" id="fp-preset-btn">一键布局</button>
          <button class="fp-btn fp-btn-sm" id="fp-export-btn">导出 ▾</button>
          <div class="fp-export-menu" id="fp-export-menu" style="display:none;">
            <button data-export="jpg">导出图片 (JPG)</button>
            <button data-export="json">导出数据 (JSON)</button>
            <button data-export="copy">复制户型信息</button>
          </div>
        </div>
      </div>
      <div class="fp-canvas-wrap" id="fp-canvas-wrap">
        <canvas id="fp-canvas"></canvas>
        <div class="fp-legend" id="fp-legend">
          <div class="fp-legend-title">图例</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:#fbbf24;border-radius:50%;"></span>插座</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:#4ade80;border-radius:50%;"></span>开关</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:#60a5fa;border-radius:50%;"></span>网口</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:transparent;border:1.5px solid rgba(255,255,255,0.6);border-radius:2px;position:relative;"><span style="position:absolute;left:0;top:50%;width:100%;height:1px;background:rgba(255,255,255,0.4);transform:rotate(45deg);transform-origin:center;"></span></span>门</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:rgba(100,180,255,0.5);border-radius:1px;"></span>窗户</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:#ff6b35;border-radius:2px;"></span>入户门</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:#ff8c00;border-radius:50%;"></span>智能设备</div>
          <div class="fp-legend-row"><span class="fp-legend-icon" style="background:rgba(139,90,43,0.4);border:1px solid rgba(180,130,80,0.5);border-radius:1px;"></span>家具</div>
        </div>
        <div class="fp-scale" id="fp-scale">1m</div>
        <div class="fp-zoombar" id="fp-zoombar">
          <button id="fp-zoom-in">+</button>
          <span id="fp-zoom-label">100%</span>
          <button id="fp-zoom-out">-</button>
          <button id="fp-zoom-reset">⊡</button>
        </div>
      </div>

      <!-- 右键菜单 -->
      <div class="fp-context-menu" id="fp-context-menu" style="display:none;">
        <button data-action="flip">翻转家具</button>
        <button data-action="duplicate">复制房间</button>
        <button data-action="delete" class="fp-context-danger">删除房间</button>
      </div>

      <!-- 帮助弹窗 -->
      <div class="fp-overlay" id="fp-help-overlay" style="display:none;">
        <div class="fp-overlay-card">
          <h3>使用说明</h3>
          <div style="text-align:left;font-size:13px;line-height:1.8;color:var(--text-secondary,#bbb);">
            <p><b>基础操作</b></p>
            <p>· 点击房间选中，拖拽移动位置</p>
            <p>· 选中后拖拽边角可调整尺寸</p>
            <p>· 滚轮缩放，空格+拖拽平移画布</p>
            <p>· 右键房间弹出快捷菜单</p>
            <p><b>标记说明</b></p>
            <p>· 插座/开关/网口：新房装修可跳过，由水电工统一预留</p>
            <p>· 弱电箱/路由器：网络中枢位置</p>
            <p>· 门洞：两房间共享墙体的通行位置</p>
            <p>· 一键布局：根据房间类型自动生成智能家居方案</p>
          </div>
          <button class="fp-btn fp-btn-outline" id="fp-help-close" style="width:100%;margin-top:12px;">知道了</button>
        </div>
      </div>

      <!-- 底部工作表 -->
      <div class="fp-sheet" id="fp-sheet">
        <div class="fp-sheet-header" id="fp-sheet-header">
          <div class="fp-sheet-grip"></div>
          <span id="fp-sheet-title">房间编辑</span>
          <button class="fp-sheet-close" id="fp-sheet-close">✕</button>
        </div>
        <div class="fp-sheet-body" id="fp-sheet-body"></div>
      </div>

      <!-- FAB按钮组 -->
      <div class="fp-fab-group" id="fp-fab-group">
        <button class="fp-fab fp-fab-sub" id="fp-fab-place" title="放置标记">📌</button>
        <button class="fp-fab fp-fab-main" id="fp-fab-add" title="添加房间">＋</button>
      </div>
      <div class="fp-fab-popup" id="fp-place-popup">
        <div class="fp-fab-popup-inner">
          <button class="fp-place-btn" data-type="socket">🔌 插座</button>
          <button class="fp-place-btn" data-type="switch">🔘 开关</button>
          <button class="fp-place-btn" data-type="network">🌐 网口</button>
          <button class="fp-place-btn" data-type="weakbox">📦 弱电箱</button>
          <button class="fp-place-btn" data-type="router">📡 路由器</button>
          <button class="fp-place-btn" data-type="ac_outlet">❄️ 空调口</button>
          <button class="fp-place-btn" data-type="water">💧 用水点</button>
          <button class="fp-place-btn" data-type="toilet">🚽 马桶</button>
        </div>
      </div>
      <div class="fp-fab-popup" id="fp-add-popup">
        <div class="fp-fab-popup-inner">
          <div class="fp-add-grid">
            ${this.ROOM_ORDER.map(t => '<button class="fp-add-room-btn" data-type="' + t + '">' + t + '</button>').join('')}
          </div>
        </div>
      </div>

      <!-- 方案选择弹窗 -->
      <div class="fp-overlay" id="fp-preset-overlay">
        <div class="fp-overlay-card">
          <h3>选择智能方案</h3>
          ${Object.entries(this.SMART_PRESETS).map(([k,v]) => `
            <button class="fp-preset-btn" data-preset="${k}">
              <span class="fp-preset-name">${v.name}</span>
              <span class="fp-preset-count">${v.devices.length}类设备</span>
            </button>
          `).join('')}
          <button class="fp-btn fp-btn-outline" id="fp-preset-cancel" style="width:100%;margin-top:8px;">取消</button>
        </div>
      </div>

      <!-- Toast -->
      <div class="fp-toast" id="fp-toast"></div>
    </div>`;
  },

  // ========== DOM 初始化 ==========
  _initDOM() {
    this.canvas = document.getElementById('fp-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap = document.getElementById('fp-canvas-wrap');
    this.sheet = document.getElementById('fp-sheet');
    this.sheetHeader = document.getElementById('fp-sheet-header');
    this.sheetBody = document.getElementById('fp-sheet-body');
    this.sheetTitle = document.getElementById('fp-sheet-title');
    this._lastSheetH = 0;
    this._sheetDragActive = false;
    this._history = [];
    this._historyIdx = -1;
  },

  // ========== 事件绑定 ==========
  _bindEvents() {
    const self = this;

    // Canvas 事件
    this.canvas.addEventListener('mousedown', e => self._onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => self._onMouseMove(e));
    this.canvas.addEventListener('mouseup', e => self._onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => self._onMouseUp({}));
    this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); self._showContextMenu(e); });
    this.canvas.addEventListener('wheel', e => { e.preventDefault(); self._onWheel(e); });

    // 触摸事件
    this.canvas.addEventListener('touchstart', e => { e.preventDefault(); self._onTouchStart(e); }, {passive: false});
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); self._onTouchMove(e); }, {passive: false});
    this.canvas.addEventListener('touchend', e => self._onTouchEnd(e));
    this.canvas.addEventListener('touchcancel', e => self._onTouchEnd(e));

    // 窗口大小
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    this._resizeHandler = () => self._resizeCanvas();
    window.addEventListener('resize', this._resizeHandler);

    // 工作表拖拽
    this.sheetHeader.addEventListener('mousedown', e => self._onSheetDragStart(e));
    this.sheetHeader.addEventListener('touchstart', e => { self._onSheetDragStart(e.touches[0]); }, {passive: false});
    window.addEventListener('mousemove', e => self._onSheetDragMove(e));
    window.addEventListener('touchmove', e => { if (self._sheetDragActive) self._onSheetDragMove(e.touches[0]); }, {passive: false});
    window.addEventListener('mouseup', () => self._onSheetDragEnd());
    window.addEventListener('touchend', () => self._onSheetDragEnd());

    // 按钮事件
    document.getElementById('fp-sheet-close').addEventListener('click', () => self._closeSheet());
    document.getElementById('fp-fab-add').addEventListener('click', () => self._toggleFab('add'));
    document.getElementById('fp-fab-place').addEventListener('click', () => self._toggleFab('place'));
    document.getElementById('fp-preset-btn').addEventListener('click', () => self._showPresetOverlay());
    document.getElementById('fp-export-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('fp-export-menu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelectorAll('#fp-export-menu button').forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.dataset.export;
        document.getElementById('fp-export-menu').style.display = 'none';
        if (type === 'jpg') self._exportJPG();
        else if (type === 'json') self._exportJSON();
        else if (type === 'copy') self._copyInfo();
      });
    });
    document.addEventListener('click', () => { document.getElementById('fp-export-menu').style.display = 'none'; });
    document.getElementById('fp-undo-btn').addEventListener('click', () => self._undo());
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); self._undo(); } });
    document.getElementById('fp-help-btn').addEventListener('click', () => { document.getElementById('fp-help-overlay').style.display = 'flex'; });
    document.getElementById('fp-help-close').addEventListener('click', () => { document.getElementById('fp-help-overlay').style.display = 'none'; });
    document.getElementById('fp-help-overlay').addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    document.getElementById('fp-preset-cancel').addEventListener('click', () => self._hidePresetOverlay());
    document.getElementById('fp-zoom-in').addEventListener('click', () => { self._viewport.zoom = Math.min(self.MAX_ZOOM, self._viewport.zoom * 1.2); self._draw(); });
    document.getElementById('fp-zoom-out').addEventListener('click', () => { self._viewport.zoom = Math.max(self.MIN_ZOOM, self._viewport.zoom / 1.2); self._draw(); });
    document.getElementById('fp-zoom-reset').addEventListener('click', () => self._resetView());
    document.querySelectorAll('#fp-context-menu button').forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.dataset.action;
        const menu = document.getElementById('fp-context-menu');
        const roomId = menu.dataset.roomId;
        menu.style.display = 'none';
        if (action === 'flip' && roomId) { self._flipRoomFurniture(roomId); }
        else if (action === 'delete' && roomId) { self._pushHistory(); self._rooms = self._rooms.filter(r => r.id !== roomId); self._selectedId = null; self._updateDoorways(); self._hideSheet(); self._draw(); }
        else if (action === 'duplicate' && roomId) {
          self._pushHistory();
          const orig = self._rooms.find(r => r.id === roomId);
          if (orig) {
            const copy = JSON.parse(JSON.stringify(orig));
            copy.id = 'r' + Date.now();
            copy.x = (orig.x || 0) + 1;
            copy.y = (orig.y || 0) + 1;
            copy.furniture = [];
            copy.flipped = false;
            self._rooms.push(copy);
            self._updateDoorways();
            self._selectRoom(copy.id);
            self._draw();
          }
        }
      });
    });

    // 方案选择
    document.querySelectorAll('.fp-preset-btn').forEach(btn => {
      btn.addEventListener('click', function() { self._applyPreset(this.dataset.preset); });
    });

    // 放置按钮
    document.querySelectorAll('.fp-place-btn').forEach(btn => {
      btn.addEventListener('click', function() { self._startPlacement(this.dataset.type); });
    });

    // 添加房间按钮
    document.querySelectorAll('.fp-add-room-btn').forEach(btn => {
      btn.addEventListener('click', function() { self._addRoom(this.dataset.type, 4, 3); });
    });

    // 点击外部关闭弹窗
    document.getElementById('fp-preset-overlay').addEventListener('click', function(e) {
      if (e.target === this) self._hidePresetOverlay();
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.fp-fab-popup') && !e.target.closest('.fp-fab')) {
        self._closeFabPopups();
      }
    });
  },

  // ========== 坐标转换 ==========
  _screenToWorld(sx, sy) {
    return {
      x: sx / this.SCALE / this._viewport.zoom - this._viewport.offsetX,
      y: sy / this.SCALE / this._viewport.zoom - this._viewport.offsetY
    };
  },
  _worldToScreen(wx, wy) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (wx + this._viewport.offsetX) * this.SCALE * this._viewport.zoom + rect.left,
      y: (wy + this._viewport.offsetY) * this.SCALE * this._viewport.zoom + rect.top
    };
  },
  _getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  },
  _getTouchPos(t) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  },
  _findRoomAtScreen(sx, sy) {
    const w = this._screenToWorld(sx, sy);
    for (let i = this._rooms.length - 1; i >= 0; i--) {
      const r = this._rooms[i];
      if (w.x >= r.x && w.x <= r.x + r.width && w.y >= r.y && w.y <= r.y + r.length) return r;
    }
    return null;
  },
  _roomsOverlap(a, b) {
    return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.length <= b.y || b.y + b.length <= a.y);
  },
  _getSharedWall(a, b) {
    const hOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const vOverlap = Math.max(0, Math.min(a.y + a.length, b.y + b.length) - Math.max(a.y, b.y));
    if (hOverlap > 0.01 && Math.abs(a.y + a.length - b.y) < 0.05) return { wall: 'bottom', roomA: a, roomB: b, start: Math.max(a.x, b.x), end: Math.min(a.x + a.width, b.x + b.width) };
    if (hOverlap > 0.01 && Math.abs(b.y + b.length - a.y) < 0.05) return { wall: 'top', roomA: a, roomB: b, start: Math.max(a.x, b.x), end: Math.min(a.x + a.width, b.x + b.width) };
    if (vOverlap > 0.01 && Math.abs(a.x + a.width - b.x) < 0.05) return { wall: 'right', roomA: a, roomB: b, start: Math.max(a.y, b.y), end: Math.min(a.y + a.length, b.y + b.length) };
    if (vOverlap > 0.01 && Math.abs(b.x + b.width - a.x) < 0.05) return { wall: 'left', roomA: a, roomB: b, start: Math.max(a.y, b.y), end: Math.min(a.y + a.length, b.y + b.length) };
    return null;
  },

  // ========== 房间操作 ==========
  _addRoom(type, width, length) {
    this._pushHistory();
    const id = 'r' + Date.now();
    const room = { id, type, x: 0, y: 0, width, length, windows: [], waterPoints: [], infrastructure: [], furniture: [], toilet: null, weakBox: null, router: null, ac: null };
    // 找空位放置
    let placed = false;
    for (let tryX = 0; tryX < 20 && !placed; tryX += 1) {
      for (let tryY = 0; tryY < 15 && !placed; tryY += 1) {
        room.x = tryX; room.y = tryY;
        const overlap = this._rooms.some(r => this._roomsOverlap(r, room));
        if (!overlap) placed = true;
      }
    }
    this._rooms.push(room);
    this._selectRoom(id);
    this._updateDoorways();
    this._autoDetectEntrance();
    this._closeFabPopups();
    this._draw();
  },
  _selectRoom(id) {
    this._selectedId = id;
    this._showSheet();
    this._updateSheet();
  },
  _snapRoom(room) {
    const t = this.SNAP_THRESHOLD;
    this._rooms.forEach(other => {
      if (other.id === room.id) return;
      if (Math.abs(room.x + room.width - other.x) < t) room.x = other.x - room.width;
      if (Math.abs(other.x + other.width - room.x) < t) room.x = other.x + other.width;
      if (Math.abs(room.y + room.length - other.y) < t) room.y = other.y - room.length;
      if (Math.abs(other.y + other.length - room.y) < t) room.y = other.y + other.length;
    });
    room.x = Math.round(room.x * 2) / 2;
    room.y = Math.round(room.y * 2) / 2;
  },

  // ========== 门洞检测 ==========
  // 只向客厅开门，互相之间不开门；门偏移不在正中间
  _updateDoorways() {
    this._doorways = [];
    const livingRoom = this._rooms.find(r => r.type === '客厅');
    for (let i = 0; i < this._rooms.length; i++) {
      for (let j = i + 1; j < this._rooms.length; j++) {
        const a = this._rooms[i], b = this._rooms[j];
        // 只在与客厅相邻的墙上开门
        const isLivingA = a.type === '客厅', isLivingB = b.type === '客厅';
        if (!isLivingA && !isLivingB) continue;
        const sw = this._getSharedWall(a, b);
        if (sw) {
          const wallLen = sw.end - sw.start;
          // 门统一宽度0.9m，墙太短则不开门洞
          const doorWidth = 0.9;
          if (wallLen < doorWidth + 0.2) continue;
          // 门偏移到约1/3处，避免正中
          const doorStart = sw.start + (wallLen - doorWidth) * 0.3;
          this._doorways.push({
            roomA: sw.roomA.id, roomB: sw.roomB.id,
            start: sw.start, end: sw.end,
            doorStart: doorStart, doorEnd: doorStart + doorWidth,
            isHoriz: sw.wall === 'top' || sw.wall === 'bottom',
            sideA: sw.wall === 'bottom' || sw.wall === 'right' ? sw.wall : (sw.wall === 'top' ? 'top' : 'left'),
            sideB: sw.wall === 'bottom' ? 'top' : sw.wall === 'top' ? 'bottom' : sw.wall === 'right' ? 'left' : 'right'
          });
        }
      }
    }
    this._pruneSharedWallWindows();
  },

  // 自动取消共享墙体的窗户（窗户只应面向户外）
  _pruneSharedWallWindows() {
    // 收集每个房间哪些墙是共享墙
    const sharedWalls = {};
    this._rooms.forEach(r => { sharedWalls[r.id] = new Set(); });
    for (let i = 0; i < this._rooms.length; i++) {
      for (let j = i + 1; j < this._rooms.length; j++) {
        const sw = this._getSharedWall(this._rooms[i], this._rooms[j]);
        if (sw) {
          const sideA = sw.wall === 'bottom' || sw.wall === 'right' ? sw.wall : (sw.wall === 'top' ? 'top' : 'left');
          const sideB = sw.wall === 'bottom' ? 'top' : sw.wall === 'top' ? 'bottom' : sw.wall === 'right' ? 'left' : 'right';
          const mapSide = s => s === 'top' ? '上' : s === 'bottom' ? '下' : s === 'left' ? '左' : '右';
          sharedWalls[sw.roomA.id].add(mapSide(sideA));
          sharedWalls[sw.roomB.id].add(mapSide(sideB));
        }
      }
    }
    this._rooms.forEach(r => {
      if (r.windows && r.windows.length > 0) {
        r.windows = r.windows.filter(w => !sharedWalls[r.id].has(w.wall));
      }
    });
  },
  _autoDetectEntrance() {
    if (this._entranceDoor.roomId) return;
    const candidates = this._rooms.filter(r => r.type === '玄关' || r.type === '客厅');
    if (candidates.length === 0) return;
    const room = candidates[0];
    const edges = [];
    edges.push({ wall: '上', shared: false, len: room.width });
    edges.push({ wall: '下', shared: false, len: room.width });
    edges.push({ wall: '左', shared: false, len: room.length });
    edges.push({ wall: '右', shared: false, len: room.length });
    this._doorways.forEach(dw => {
      if (dw.roomA === room.id || dw.roomB === room.id) {
        const side = dw.roomA === room.id ? dw.sideA : dw.sideB;
        edges.forEach(e => { if (e.wall === side) e.shared = true; });
      }
    });
    const free = edges.filter(e => !e.shared);
    if (free.length > 0) {
      const best = free[0];
      this._entranceDoor = { roomId: room.id, wall: best.wall, offset: 0 };
    }
  },

  // ========== 撤销功能 ==========
  _pushHistory() {
    // 保存当前房间状态的深拷贝
    const snapshot = JSON.parse(JSON.stringify(this._rooms));
    // 截断未来历史（如果当前不在末尾）
    if (this._historyIdx < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIdx + 1);
    }
    this._history.push(snapshot);
    this._historyIdx++;
    // 限制历史记录数量
    if (this._history.length > 30) {
      this._history.shift();
      this._historyIdx--;
    }
  },

  _undo() {
    if (this._historyIdx <= 0) {
      this._showToast('没有可撤销的操作');
      return;
    }
    this._historyIdx--;
    const snapshot = JSON.parse(JSON.stringify(this._history[this._historyIdx]));
    this._rooms = snapshot;
    this._selectedId = null;
    this._hideSheet();
    this._updateDoorways();
    this._autoDetectEntrance();
    this._draw();
    this._showToast('已撤销');
  },

  // ========== 设施点击检测 ==========
  _findInfrastructureAt(wx, wy) {
    const hitRadius = 0.4; // 检测半径（米）
    for (const r of this._rooms) {
      if (!r.infrastructure) continue;
      for (let i = 0; i < r.infrastructure.length; i++) {
        const item = r.infrastructure[i];
        const ix = r.x + item.x, iy = r.y + item.y;
        if (Math.abs(wx - ix) < hitRadius && Math.abs(wy - iy) < hitRadius) {
          return { room: r, index: i, item: item, type: 'infrastructure' };
        }
      }
    }
    return null;
  },

  _deleteInfrastructure(room, index) {
    this._pushHistory();
    room.infrastructure.splice(index, 1);
    this._draw();
    if (this._selectedId === room.id) this._updateSheet();
    this._showToast('已删除设施');
  },

  // ========== 缩放手柄 ==========
  _getResizeHandles(r) {
    const h = this.HANDLE_SIZE / this.SCALE / this._viewport.zoom;
    return [
      { name: 'nw', x: r.x - h/2, y: r.y - h/2 },
      { name: 'n', x: r.x + r.width/2 - h/2, y: r.y - h/2 },
      { name: 'ne', x: r.x + r.width - h/2, y: r.y - h/2 },
      { name: 'e', x: r.x + r.width - h/2, y: r.y + r.length/2 - h/2 },
      { name: 'se', x: r.x + r.width - h/2, y: r.y + r.length - h/2 },
      { name: 's', x: r.x + r.width/2 - h/2, y: r.y + r.length - h/2 },
      { name: 'sw', x: r.x - h/2, y: r.y + r.length - h/2 },
      { name: 'w', x: r.x - h/2, y: r.y + r.length/2 - h/2 }
    ];
  },
  _findResizeHandle(sx, sy) {
    const w = this._screenToWorld(sx, sy);
    const r = this._rooms.find(r => r.id === this._selectedId);
    if (!r) return null;
    const hSize = this.HANDLE_SIZE / this.SCALE / this._viewport.zoom;
    const handles = this._getResizeHandles(r);
    return handles.find(h => w.x >= h.x && w.x <= h.x + hSize && w.y >= h.y && w.y <= h.y + hSize) || null;
  },

  // ========== 鼠标事件 ==========
  _onMouseDown(e) {
    if (e.button !== 0) return;
    const pos = this._getMousePos(e);
    const w = this._screenToWorld(pos.x, pos.y);

    if (this._placementMode !== 'none') {
      this._pushHistory();
      this._placeItemAtPoint(w.x, w.y);
      return;
    }

    // 检测设施点击（在房间和手柄之前）
    const infra = this._findInfrastructureAt(w.x, w.y);
    if (infra) {
      this._deleteInfrastructure(infra.room, infra.index);
      return;
    }

    // 检测缩放手柄
    if (this._selectedId) {
      const handle = this._findResizeHandle(pos.x, pos.y);
      if (handle) {
        this._pushHistory();
        this._resizeState = { active: true, roomId: this._selectedId, handle: handle.name, startX: w.x, startY: w.y, origRoom: null };
        const r = this._rooms.find(r => r.id === this._selectedId);
        if (r) this._resizeState.origRoom = { x: r.x, y: r.y, width: r.width, length: r.length };
        return;
      }
    }

    // 检测房间点击
    const room = this._findRoomAtScreen(pos.x, pos.y);
    if (room) {
      this._selectRoom(room.id);
      this._dragState = { active: true, roomId: room.id, startX: w.x - room.x, startY: w.y - room.y };
    } else {
      this._selectedId = null;
      this._hideSheet();
      // 开始平移
      this._panState = { startX: pos.x, startY: pos.y, origOX: this._viewport.offsetX, origOY: this._viewport.offsetY };
    }
    this._draw();
  },
  _onMouseMove(e) {
    const pos = this._getMousePos(e);
    const w = this._screenToWorld(pos.x, pos.y);

    if (this._placementMode !== 'none') {
      this._draw();
      return;
    }

    if (this._dragState && this._dragState.active) {
      const room = this._rooms.find(r => r.id === this._dragState.roomId);
      if (room) {
        room.x = w.x - this._dragState.startX;
        room.y = w.y - this._dragState.startY;
      }
      this._draw();
      return;
    }

    if (this._resizeState && this._resizeState.active) {
      this._applyResize(w.x, w.y);
      this._draw();
      return;
    }

    if (this._panState) {
      this._viewport.offsetX = this._panState.origOX + (pos.x - this._panState.startX) / this.SCALE / this._viewport.zoom;
      this._viewport.offsetY = this._panState.origOY + (pos.y - this._panState.startY) / this.SCALE / this._viewport.zoom;
      this._draw();
      return;
    }

    // 悬停检测
    if (this._selectedId) {
      const handle = this._findResizeHandle(pos.x, pos.y);
      this._hoverHandle = handle ? handle.name : null;
      if (this._hoverHandle) this.canvas.style.cursor = handle.name.includes('n') && handle.name.includes('w') ? 'nwse-resize' : handle.name.includes('n') && handle.name.includes('e') ? 'nesw-resize' : handle.name.includes('n') ? 'ns-resize' : handle.name.includes('s') ? 'ns-resize' : handle.name.includes('e') ? 'ew-resize' : handle.name.includes('w') ? 'ew-resize' : 'default';
      else this.canvas.style.cursor = 'default';
      this._draw();
    }
  },
  _onMouseUp(e) {
    if (this._dragState && this._dragState.active) {
      const room = this._rooms.find(r => r.id === this._dragState.roomId);
      if (room) {
        this._snapRoom(room);
        this._pushHistory();
      }
      this._updateDoorways();
      this._autoDetectEntrance();
      if (this._selectedId) this._updateSheet();
    }
    if (this._resizeState && this._resizeState.active) {
      this._pushHistory();
      this._updateDoorways();
      this._autoDetectEntrance();
      if (this._selectedId) this._updateSheet();
    }
    this._dragState = null;
    this._resizeState = null;
    this._panState = null;
    this._draw();
  },
  _onWheel(e) {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this._viewport.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this._viewport.zoom * delta));
    this._draw();
  },
  _applyResize(wx, wy) {
    const r = this._rooms.find(r => r.id === this._resizeState.roomId);
    if (!r || !this._resizeState.origRoom) return;
    const o = this._resizeState.origRoom;
    const h = this._resizeState.handle;
    if (h.includes('w')) { r.x = Math.min(wx, o.x + o.width - 1); r.width = Math.max(1, o.x + o.width - r.x); }
    if (h.includes('e')) { r.width = Math.max(1, wx - o.x); }
    if (h.includes('n')) { r.y = Math.min(wy, o.y + o.length - 1); r.length = Math.max(1, o.y + o.length - r.y); }
    if (h.includes('s')) { r.length = Math.max(1, wy - o.y); }
    r.x = Math.round(r.x * 2) / 2;
    r.y = Math.round(r.y * 2) / 2;
    r.width = Math.round(r.width * 2) / 2;
    r.length = Math.round(r.length * 2) / 2;
  },

  // ========== 触摸事件 ==========
  _onTouchStart(e) {
    this._touches = Array.from(e.touches);
    this._lastTouchDist = 0;
    this._touchStartTime = Date.now();
    this._isLongPress = false;
    this._touchMoved = false;

    if (e.touches.length === 1) {
      const pos = this._getTouchPos(e.touches[0]);
      this._touchStartPos = pos;
      this._longPressTimer = setTimeout(() => {
        this._isLongPress = true;
        const w = this._screenToWorld(pos.x, pos.y);
        const room = this._findRoomAtScreen(pos.x, pos.y);
        if (room) {
          this._selectRoom(room.id);
          this._dragState = { active: true, roomId: room.id, startX: w.x - room.x, startY: w.y - room.y };
        }
      }, 500);
    } else if (e.touches.length === 2) {
      clearTimeout(this._longPressTimer);
      this._lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }

    // 模拟 mousedown
    if (e.touches.length === 1) {
      const p = this._getTouchPos(e.touches[0]);
      this._onMouseDown({ button: 0, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  },
  _onTouchMove(e) {
    this._touchMoved = true;
    clearTimeout(this._longPressTimer);
    this._touches = Array.from(e.touches);

    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (this._lastTouchDist > 0) {
        this._viewport.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this._viewport.zoom * dist / this._lastTouchDist));
      }
      this._lastTouchDist = dist;
      this._draw();
    } else if (e.touches.length === 1) {
      this._onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  },
  _onTouchEnd(e) {
    clearTimeout(this._longPressTimer);
    this._onMouseUp({});
    this._touches = [];
  },

  // ========== 工作表 ==========
  _onSheetDragStart(e) {
    this._sheetDragActive = true;
    this._sheetDragStartY = e.clientY;
    this._sheetDragStartH = this.sheet.offsetHeight;
  },
  _onSheetDragMove(e) {
    if (!this._sheetDragActive) return;
    const dy = this._sheetDragStartY - e.clientY;
    const newH = Math.max(100, Math.min(500, this._sheetDragStartH + dy));
    this.sheet.style.height = newH + 'px';
  },
  _onSheetDragEnd() {
    this._sheetDragActive = false;
  },
  _showSheet() {
    this.sheet.classList.add('fp-sheet-open');
    this._sheetState = 'open';
  },
  _hideSheet() {
    this.sheet.classList.remove('fp-sheet-open');
    this._sheetState = 'hidden';
    this._selectedId = null;
    this._cancelPlacement();
  },
  _closeSheet() {
    this._hideSheet();
    this._draw();
  },
  _updateSheet() {
    const r = this._rooms.find(r => r.id === this._selectedId);
    if (!r) return;
    this.sheetTitle.textContent = r.type + ' 编辑';
    const style = this.ROOM_STYLES[r.type] || this.ROOM_STYLES['客厅'];
    const expanded = this._sheetDetailExpanded;
    this.sheetBody.innerHTML = `
      <div class="fp-sheet-section">
        <div class="fp-form-row">
          <label>类型</label>
          <select id="fp-room-type">${this.ROOM_ORDER.map(t => '<option value="' + t + '"' + (r.type === t ? ' selected' : '') + '>' + t + '</option>').join('')}</select>
        </div>
        <div class="fp-form-row">
          <label>宽 (m)</label><input type="number" id="fp-room-w" value="${r.width}" step="0.5" min="1" max="20">
        </div>
        <div class="fp-form-row">
          <label>长 (m)</label><input type="number" id="fp-room-l" value="${r.length}" step="0.5" min="1" max="20">
        </div>
      </div>
      <div class="fp-sheet-section">
        <button class="fp-btn" id="fp-flip-furniture" style="width:100%;">${r.flipped ? '↻ 恢复家具方向' : '↻ 翻转家具方向'}</button>
        <button class="fp-btn fp-btn-sm" id="fp-toggle-detail" style="width:100%;margin-top:6px;">${expanded ? '收起详细编辑 ▲' : '展开详细编辑 ▼'}</button>
      </div>
      ${expanded ? `
      ${r.windows ? `
      <div class="fp-sheet-section">
        <div class="fp-section-title">窗户 <button class="fp-btn-sm" id="fp-add-window">+ 添加</button></div>
        ${r.windows.map((w, i) => `
          <div class="fp-compact-card">
            <span>${w.wall}墙 · 偏移${w.offset || 0}m · 宽${w.width || 0.8}m</span>
            <button class="fp-btn-sm fp-btn-danger" data-del-win="${i}">删除</button>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="fp-sheet-section">
        <button class="fp-btn fp-btn-danger" id="fp-delete-room" style="width:100%;">删除房间</button>
      </div>
      ` : ''}
    `;
    // 绑定事件
    const self = this;
    document.getElementById('fp-room-type').addEventListener('change', function() { self._pushHistory(); r.type = this.value; self._draw(); });
    document.getElementById('fp-room-w').addEventListener('change', function() { self._pushHistory(); r.width = parseFloat(this.value) || 4; self._updateDoorways(); self._draw(); });
    document.getElementById('fp-room-l').addEventListener('change', function() { self._pushHistory(); r.length = parseFloat(this.value) || 3; self._updateDoorways(); self._draw(); });
    const flipBtn = document.getElementById('fp-flip-furniture');
    if (flipBtn) flipBtn.addEventListener('click', function() { self._flipRoomFurniture(r.id); });
    const toggleBtn = document.getElementById('fp-toggle-detail');
    if (toggleBtn) toggleBtn.addEventListener('click', function() { self._sheetDetailExpanded = !self._sheetDetailExpanded; self._updateSheet(); });
    const delBtn = document.getElementById('fp-delete-room');
    if (delBtn) delBtn.addEventListener('click', function() { self._pushHistory(); self._rooms = self._rooms.filter(rr => rr.id !== self._selectedId); self._selectedId = null; self._updateDoorways(); self._hideSheet(); self._draw(); });
    const addWin = document.getElementById('fp-add-window');
    if (addWin) addWin.addEventListener('click', function() { self._pushHistory(); if (!r.windows) r.windows = []; r.windows.push({ wall: '上', offset: 0, width: 0.8 }); self._updateSheet(); self._draw(); });
    document.querySelectorAll('[data-del-win]').forEach(btn => {
      btn.addEventListener('click', function() { self._pushHistory(); r.windows.splice(parseInt(this.dataset.delWin), 1); self._updateSheet(); self._draw(); });
    });
  },

  // ========== FAB 弹窗 ==========
  _toggleFab(type) {
    const popup = document.getElementById('fp-' + type + '-popup');
    const other = type === 'add' ? 'place' : 'add';
    document.getElementById('fp-' + other + '-popup').classList.remove('fp-fab-popup-show');
    popup.classList.toggle('fp-fab-popup-show');
  },
  _closeFabPopups() {
    document.querySelectorAll('.fp-fab-popup').forEach(p => p.classList.remove('fp-fab-popup-show'));
  },

  // ========== 放置模式 ==========
  _startPlacement(type) {
    this._placementMode = type;
    this._closeFabPopups();
    this._showToast('点击房间放置' + ({socket:'插座',switch:'开关',network:'网口',weakbox:'弱电箱',router:'路由器',ac_outlet:'空调口',water:'用水点',toilet:'马桶'}[type] || type));
    this._draw();
  },
  _cancelPlacement() {
    this._placementMode = 'none';
    this._draw();
  },
  _placeItemAtPoint(wx, wy) {
    const room = this._rooms.find(r => wx >= r.x && wx <= r.x + r.width && wy >= r.y && wy <= r.y + r.length);
    if (!room) { this._showToast('请点击房间内部'); return; }
    const rx = wx - room.x, ry = wy - room.y;
    if (!room.infrastructure) room.infrastructure = [];
    if (this._placementMode === 'socket' || this._placementMode === 'switch' || this._placementMode === 'network') {
      // 吸附到最近的棋盘点位（1米网格）
      let sx = Math.max(1, Math.min(Math.round(rx), Math.floor(room.width)));
      let sy = Math.max(1, Math.min(Math.round(ry), Math.floor(room.length)));
      if (sx >= room.width) sx = Math.max(1, Math.floor(room.width) - 1);
      if (sy >= room.length) sy = Math.max(1, Math.floor(room.length) - 1);
      room.infrastructure.push({ type: this._placementMode, x: sx, y: sy });
    } else if (this._placementMode === 'weakbox') {
      room.weakBox = { x: 0.3, y: 0.3 };
    } else if (this._placementMode === 'router') {
      room.router = { x: 0.3, y: 1.5 };
    } else if (this._placementMode === 'ac_outlet') {
      room.ac = { x: room.width / 2, y: 0 };
    } else if (this._placementMode === 'water') {
      if (!room.waterPoints) room.waterPoints = [];
      if (room.type === '卫生间') {
        room.waterPoints.push({ x: rx, y: room.length });
      } else if (room.type === '厨房') {
        room.waterPoints.push({ x: room.width, y: ry });
      } else {
        room.waterPoints.push({ x: rx, y: ry });
      }
    } else if (this._placementMode === 'toilet') {
      room.toilet = { x: room.width / 2, y: room.length };
    }
    this._placementMode = 'none';
    this._showToast('已放置');
    this._draw();
  },

  // ========== 方案弹窗 ==========
  _showPresetOverlay() {
    document.getElementById('fp-preset-overlay').style.display = 'flex';
  },
  _hidePresetOverlay() {
    document.getElementById('fp-preset-overlay').style.display = 'none';
  },
  _applyPreset(presetName) {
    this._generateFurniture();
    const preset = this.SMART_PRESETS[presetName];
    if (!preset) return;
    this._currentPreset = presetName;
    this._smartDevices = [];
    let cid = 1;
    const nextId = () => 'sd' + cid++;
    const self = this;

    function findCenterRoom() {
      if (self._rooms.length === 0) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      self._rooms.forEach(r => { minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + r.width); maxY = Math.max(maxY, r.y + r.length); });
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      let best = null, bestDist = Infinity;
      self._rooms.forEach(r => {
        const rcx = r.x + r.width/2, rcy = r.y + r.length/2;
        const d = Math.hypot(rcx - cx, rcy - cy);
        const hasNet = (r.infrastructure || []).some(i => i.type === 'network');
        if (d - (hasNet ? 5 : 0) < bestDist) { bestDist = d - (hasNet ? 5 : 0); best = r; }
      });
      return best;
    }

    function findRoom(type) { return self._rooms.find(r => r.type === type) || self._rooms[0]; }
    function findRoomsWithWindow() { return self._rooms.filter(r => r.windows && r.windows.length > 0); }

    preset.devices.forEach(devSpec => {
      for (let i = 0; i < devSpec.count; i++) {
        const sd = { id: nextId(), type: devSpec.type, roomId: '', x: 0, y: 0, note: devSpec.note, productName: '' };
        function placeDevice(room, wall, off) {
          const o = off || 0.25;
          if (wall === '上') { sd.x = room.x + o; sd.y = room.y; }
          else if (wall === '下') { sd.x = room.x + o; sd.y = room.y + room.length; }
          else if (wall === '左') { sd.x = room.x; sd.y = room.y + o; }
          else { sd.x = room.x + room.width; sd.y = room.y + o; }
        }
        if (devSpec.type === 'gateway' || devSpec.type === 'router') {
          const room = findCenterRoom();
          if (room) { sd.roomId = room.id; placeDevice(room, '左', 0.3); sd.productName = devSpec.type === 'gateway' ? '智能网关' : '路由器'; }
        } else if (devSpec.type === 'smartLock') {
          if (self._entranceDoor.roomId) {
            const room = self._rooms.find(r => r.id === self._entranceDoor.roomId);
            if (room) {
              sd.roomId = room.id;
              placeDevice(room, self._entranceDoor.wall === '上' ? '上' : self._entranceDoor.wall === '下' ? '下' : self._entranceDoor.wall === '左' ? '左' : '右', 0.3);
              sd.productName = '智能门锁';
            }
          }
        } else if (devSpec.type === 'smartSpeaker') {
          const room = findRoom('客厅') || self._rooms[0];
          if (room) { sd.roomId = room.id; placeDevice(room, '左', 0.3); sd.productName = '智能音箱'; }
        } else if (devSpec.type === 'smartSwitch') {
          const room = self._rooms[i] || self._rooms[0];
          if (room) { sd.roomId = room.id; placeDevice(room, '左', 0.8 + i * 0.3); sd.productName = '智能开关'; }
        } else if (devSpec.type === 'robotVacuum') {
          const room = findRoom('客厅') || self._rooms[0];
          if (room) { sd.roomId = room.id; placeDevice(room, '下', 0.5); sd.productName = '扫地机器人'; }
        } else if (devSpec.type === 'smartCurtain') {
          const rw = findRoomsWithWindow();
          const room = rw[i] || self._rooms[0];
          if (room && room.windows && room.windows[i % room.windows.length]) {
            sd.roomId = room.id;
            const win = room.windows[i % room.windows.length];
            placeDevice(room, win.wall === '上' ? '上' : win.wall === '下' ? '下' : win.wall === '左' ? '左' : '右', 0.3);
            sd.productName = '智能窗帘';
          }
        } else if (devSpec.type === 'camera') {
          const room = findRoom('玄关') || findRoom('客厅') || self._rooms[0];
          if (room) { sd.roomId = room.id; placeDevice(room, '上', room.width - 0.4); sd.productName = '智能摄像头'; }
        } else {
          const room = findRoom('客厅') || self._rooms[0];
          if (room) { sd.roomId = room.id; placeDevice(room, '左', 0.3); }
          sd.productName = {tempSensor:'温湿度传感器',motionSensor:'人体传感器',airPurifier:'空气净化器',smartBathHeater:'智能浴霸',smokeAlarm:'烟雾报警器'}[devSpec.type] || devSpec.type;
        }
        if (sd.roomId || (sd.x !== 0 && sd.y !== 0)) self._smartDevices.push(sd);
      }
    });

    this._hidePresetOverlay();
    this._draw();
    this._showToast('已生成 "' + preset.name + '" 智能布局');
  },

  // ========== 家具生成 ==========
  _getRoomWallInfo(room) {
    const walls = [
      { wall: '上', hasWindow: false, hasDoor: false, free: 0, start: 0, end: room.width },
      { wall: '下', hasWindow: false, hasDoor: false, free: 0, start: 0, end: room.width },
      { wall: '左', hasWindow: false, hasDoor: false, free: 0, start: 0, end: room.length },
      { wall: '右', hasWindow: false, hasDoor: false, free: 0, start: 0, end: room.length }
    ];
    (room.windows || []).forEach(w => {
      const idx = walls.findIndex(x => x.wall === w.wall);
      if (idx >= 0) walls[idx].hasWindow = true;
    });
    this._doorways.forEach(dw => {
      if (dw.roomA === room.id) {
        const idx = walls.findIndex(x => x.wall === dw.sideA);
        if (idx >= 0) walls[idx].hasDoor = true;
      } else if (dw.roomB === room.id) {
        const idx = walls.findIndex(x => x.wall === dw.sideB);
        if (idx >= 0) walls[idx].hasDoor = true;
      }
    });
    walls.forEach(w => { w.free = (w.hasWindow || w.hasDoor) ? 0 : 1; });
    return walls;
  },
  _pickBestWall(room, preferred) {
    const walls = this._getRoomWallInfo(room);
    const flipped = room.flipped;
    const order = [];
    if (preferred === 'sofa') {
      order.push(flipped ? '上' : '下', flipped ? '下' : '上', '左', '右');
    } else if (preferred === 'tv') {
      order.push(flipped ? '下' : '上', flipped ? '上' : '下', '右', '左');
    } else if (preferred === 'bed') {
      order.push(flipped ? '上' : '下', flipped ? '下' : '上', '左', '右');
    } else if (preferred === 'dining') {
      order.push('左', '右', flipped ? '上' : '下', flipped ? '下' : '上');
    } else {
      order.push('上', '下', '左', '右');
    }
    for (const w of order) {
      const info = walls.find(x => x.wall === w);
      if (info && info.free) return w;
    }
    return order[0];
  },
  _generateFurniture() {
    const self = this;
    this._rooms.forEach(room => {
      if (room.furniture && room.furniture.length > 0 && !room.flipped) return;
      room.furniture = [];
      const flipped = room.flipped;

      function oppositeWall(wall) {
        return wall === '上' ? '下' : wall === '下' ? '上' : wall === '左' ? '右' : '左';
      }
      function placeAgainstWall(type, wall, w, h, dist) {
        let fx, fy;
        if (wall === '上') { fx = room.width/2 - w/2 + (dist || 0); fy = 0.1; }
        else if (wall === '下') { fx = room.width/2 - w/2 + (dist || 0); fy = room.length - h - 0.1; }
        else if (wall === '左') { fx = 0.1; fy = room.length/2 - h/2 + (dist || 0); }
        else { fx = room.width - w - 0.1; fy = room.length/2 - h/2 + (dist || 0); }
        const isHoriz = wall === '上' || wall === '下';
        const item = { type, x: fx, y: fy, w: isHoriz ? w : h, h: isHoriz ? h : w, rotation: 0 };
        // 简单重叠检测：如果与已有家具重叠，偏移0.5m再试一次
        for (const existing of room.furniture) {
          if (self._furnitureOverlap(item, existing)) {
            if (wall === '上' || wall === '下') item.x += 0.5;
            else item.y += 0.5;
            break;
          }
        }
        room.furniture.push(item);
      }

      if (room.type === '客厅') {
        // 沙发和电视必须在对墙
        const sofaWall = self._pickBestWall(room, 'sofa');
        const tvWall = oppositeWall(sofaWall);
        placeAgainstWall('sofa', sofaWall, 2.4, 0.9);
        placeAgainstWall('tv', tvWall, 1.6, 0.4);
        // 餐桌放侧面墙，避开沙发电视墙
        const diningWall = self._pickBestWall(room, 'dining') || '左';
        if (diningWall === sofaWall || diningWall === tvWall) {
          placeAgainstWall('dining', oppositeWall(diningWall) === sofaWall || oppositeWall(diningWall) === tvWall ? '左' : oppositeWall(diningWall), 1.4, 0.9);
        } else {
          placeAgainstWall('dining', diningWall, 1.4, 0.9);
        }
      } else if (room.type === '主卧' || room.type === '次卧') {
        const bedWall = self._pickBestWall(room, 'bed');
        // 标准双人床 1.8m宽 × 2.0m长
        const bedW = 1.8, bedL = 2.0;
        placeAgainstWall('bed', bedWall, bedW, bedL, 0);
        // 床头柜在床的两侧
        const nsWall = bedWall === '上' || bedWall === '下' ? '左' : '上';
        placeAgainstWall('nightstand', bedWall, 0.5, 0.4, -bedW/2 + 0.3);
        placeAgainstWall('nightstand', bedWall, 0.5, 0.4, bedW/2 - 0.3);
        // 衣柜放床对面墙
        placeAgainstWall('wardrobe', oppositeWall(bedWall), 1.5, 0.55);
      } else if (room.type === '厨房') {
        placeAgainstWall('cabinet', '左', 0.6, room.length - 0.4);
        placeAgainstWall('cabinet', '下', room.width - 0.2, 0.6);
      } else if (room.type === '卫生间') {
        placeAgainstWall('sink', '左', 0.6, 0.5);
        if (!room.toilet) room.toilet = { x: room.width/2, y: room.length/2 + 0.5 };
      } else if (room.type === '书房') {
        placeAgainstWall('desk', '左', 1.2, 0.6);
        placeAgainstWall('bookshelf', '右', 0.4, 2);
      }
      // 阳台不再放洗衣机
    });
  },

  _furnitureOverlap(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  },
  _flipRoomFurniture(roomId) {
    const room = this._rooms.find(r => r.id === roomId);
    if (!room) return;
    this._pushHistory();
    room.flipped = !room.flipped;
    const prevFurniture = room.furniture;
    room.furniture = [];
    this._generateFurniture();
    if (room.furniture.length === 0) room.furniture = prevFurniture;
    this._draw();
    this._updateSheet();
    this._showToast(room.flipped ? '已翻转家具方向' : '已恢复家具方向');
  },

  // ========== 绘制 ==========
  _draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    ctx.save();
    ctx.translate(this._viewport.offsetX * this.SCALE * this._viewport.zoom, this._viewport.offsetY * this.SCALE * this._viewport.zoom);
    ctx.scale(this._viewport.zoom, this._viewport.zoom);

    this._drawGrid();
    this._drawRooms();
    this._drawFurniture();
    this._drawDoorways();
    this._drawSelection();
    this._drawWindows();
    this._drawInfrastructure();
    this._drawSmartDevices();
    this._drawSpecialItems();
    this._drawEntranceDoor();

    ctx.restore();

    // 更新缩放标签
    document.getElementById('fp-zoom-label').textContent = Math.round(this._viewport.zoom * 100) + '%';
  },

  _drawGrid() {
    const ctx = this.ctx;
    const s = this.SCALE, gs = this.GRID_STEP * s;
    const vw = this.canvas.width / (window.devicePixelRatio || 1) / this._viewport.zoom;
    const vh = this.canvas.height / (window.devicePixelRatio || 1) / this._viewport.zoom;
    const ox = -this._viewport.offsetX * s, oy = -this._viewport.offsetY * s;

    const x0 = Math.floor((ox - s) / gs) * gs;
    const y0 = Math.floor((oy - s) / gs) * gs;
    const x1 = ox + vw + s, y1 = oy + vh + s;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += gs) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
    for (let y = y0; y <= y1; y += gs) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    ctx.stroke();

    // 1m 网格加粗
    const gs1 = 1 * s;
    const x1m = Math.floor((ox - s) / gs1) * gs1;
    const y1m = Math.floor((oy - s) / gs1) * gs1;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x1m; x <= x1; x += gs1) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
    for (let y = y1m; y <= y1; y += gs1) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    ctx.stroke();
  },

  _drawRooms() {
    const ctx = this.ctx, s = this.SCALE;
    this._rooms.forEach((r, idx) => {
      const isSelected = r.id === this._selectedId;
      const style = this.ROOM_STYLES[r.type] || this.ROOM_STYLES['客厅'];
      const rx = r.x * s, ry = r.y * s, rw = r.width * s, rl = r.length * s;

      // 填充：选中时橙色底色
      ctx.fillStyle = isSelected ? 'rgba(255, 140, 0, 0.12)' : style.fill;
      ctx.fillRect(rx, ry, rw, rl);

      // 边框
      ctx.strokeStyle = isSelected ? '#FF8C00' : style.border;
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.strokeRect(rx, ry, rw, rl);

      // 文字
      ctx.fillStyle = isSelected ? '#FF8C00' : style.text;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.type, rx + rw/2, ry + rl/2 - 4);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = isSelected ? 'rgba(255,140,0,0.8)' : 'rgba(255,255,255,0.5)';
      ctx.fillText(r.width + '×' + r.length + 'm', rx + rw/2, ry + rl/2 + 10);

      // 棋盘点位（1米间距）
      ctx.fillStyle = isSelected ? 'rgba(255, 200, 50, 0.5)' : 'rgba(255, 200, 50, 0.3)';
      for (let gx = 1; gx < r.width; gx += 1) {
        for (let gy = 1; gy < r.length; gy += 1) {
          ctx.beginPath();
          ctx.arc(rx + gx * s, ry + gy * s, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  },

  _drawDoorways() {
    const ctx = this.ctx, s = this.SCALE;
    this._doorways.forEach(dw => {
      const roomA = this._rooms.find(r => r.id === dw.roomA);
      if (!roomA) return;
      const doorWidth = dw.doorEnd - dw.doorStart;
      const ds = dw.doorStart * s, de = dw.doorEnd * s;
      const rPx = (de - ds); // 弧线半径 = 门宽像素

      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1.5;

      if (dw.isHoriz) {
        const y = (dw.sideA === 'top' ? roomA.y : roomA.y + roomA.length) * s;
        const isTop = dw.sideA === 'top';
        // 先画门洞缺口（用房间底色覆盖墙线）
        ctx.strokeStyle = isTop
          ? (this.ROOM_STYLES[roomA.type]?.fill || 'rgba(255,255,255,0.06)')
          : (this.ROOM_STYLES[roomA.type]?.fill || 'rgba(255,255,255,0.06)');
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(ds, y); ctx.lineTo(de, y);
        ctx.stroke();
        // 画门开启弧线（向房间内展开的四分之一圆）
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isTop) {
          // 上墙：房间在下方，弧线向下展开（右下象限）
          ctx.arc(ds, y, rPx, Math.PI / 2, 0, false);
        } else {
          // 下墙：房间在上方，弧线向上展开（右上象限）
          ctx.arc(ds, y, rPx, -Math.PI / 2, 0, false);
        }
        ctx.stroke();
      } else {
        const x = (dw.sideA === 'left' ? roomA.x : roomA.x + roomA.width) * s;
        const isLeft = dw.sideA === 'left';
        // 门洞缺口
        ctx.strokeStyle = this.ROOM_STYLES[roomA.type]?.fill || 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, ds); ctx.lineTo(x, de);
        ctx.stroke();
        // 画门开启弧线
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isLeft) {
          // 左墙：房间在右侧，弧线向右展开（右下象限）
          ctx.arc(x, ds, rPx, 0, Math.PI / 2, false);
        } else {
          // 右墙：房间在左侧，弧线向左展开（左下象限）
          ctx.arc(x, ds, rPx, Math.PI, Math.PI / 2, true);
        }
        ctx.stroke();
      }
    });
  },

  _drawSelection() {
    if (!this._selectedId) return;
    const r = this._rooms.find(r => r.id === this._selectedId);
    if (!r) return;
    const ctx = this.ctx, s = this.SCALE;
    const rx = r.x * s, ry = r.y * s, rw = r.width * s, rl = r.length * s;

    // 尺寸标签
    ctx.fillStyle = 'rgba(255,140,0,0.9)';
    ctx.fillRect(rx + rw/2 - 32, ry - 22, 64, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.width + '×' + r.length + 'm', rx + rw/2, ry - 8);

    // 缩放手柄：更大、更突出、橙色
    const hs = this.HANDLE_SIZE + 2;
    this._getResizeHandles(r).forEach(h => {
      const hx = h.x * s, hy = h.y * s;
      const isHover = this._hoverHandle === h.name;
      // 外圈
      ctx.fillStyle = isHover ? '#FF8C00' : 'rgba(255,140,0,0.6)';
      ctx.fillRect(hx - 1, hy - 1, hs + 2, hs + 2);
      // 内芯
      ctx.fillStyle = isHover ? '#fff' : '#FF8C00';
      ctx.fillRect(hx, hy, hs, hs);
    });
  },

  _drawWindows() {
    const ctx = this.ctx, s = this.SCALE;
    this._rooms.forEach(r => {
      if (!r.windows) return;
      r.windows.forEach(win => {
        const rx = r.x * s, ry = r.y * s, rw = r.width * s, rl = r.length * s;
        let wx, wy, ww;
        if (win.wall === '上') { wx = rx + rw/2 + (win.offset || 0) * s - (win.width || 0.8) * s / 2; wy = ry - 3; ww = (win.width || 0.8) * s; }
        else if (win.wall === '下') { wx = rx + rw/2 + (win.offset || 0) * s - (win.width || 0.8) * s / 2; wy = ry + rl - 3; ww = (win.width || 0.8) * s; }
        else if (win.wall === '左') { wx = rx - 3; wy = ry + rl/2 + (win.offset || 0) * s - (win.width || 0.8) * s / 2; ww = (win.width || 0.8) * s; }
        else { wx = rx + rw - 3; wy = ry + rl/2 + (win.offset || 0) * s - (win.width || 0.8) * s / 2; ww = (win.width || 0.8) * s; }

        ctx.fillStyle = 'rgba(100,180,255,0.5)';
        if (win.wall === '上' || win.wall === '下') ctx.fillRect(wx, wy, ww, 6);
        else ctx.fillRect(wx, wy, 6, ww);
      });
    });
  },

  _drawInfrastructure() {
    const ctx = this.ctx, s = this.SCALE;
    this._rooms.forEach(r => {
      if (!r.infrastructure) return;
      r.infrastructure.forEach(item => {
        const ix = (r.x + item.x) * s, iy = (r.y + item.y) * s;
        const size = 6;
        if (item.type === 'socket') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(ix - size, iy - size, size * 2, size * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(ix - 2, iy - size + 2, 4, size * 2 - 4);
        } else if (item.type === 'switch') {
          ctx.fillStyle = '#4ade80';
          ctx.beginPath(); ctx.arc(ix, iy, size, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(ix - 2, iy - size + 2, 4, size * 2 - 4);
        } else {
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.moveTo(ix, iy - size); ctx.lineTo(ix + size, iy + size - 2); ctx.lineTo(ix - size, iy + size - 2);
          ctx.closePath(); ctx.fill();
        }
      });
    });
  },

  _drawFurniture() {
    const ctx = this.ctx, s = this.SCALE;
    const colors = {
      sofa: { fill: 'rgba(139,90,43,0.35)', stroke: 'rgba(180,130,80,0.6)' },
      tv: { fill: 'rgba(30,30,30,0.5)', stroke: 'rgba(100,100,100,0.6)' },
      bed: { fill: 'rgba(70,100,140,0.35)', stroke: 'rgba(100,140,200,0.5)' },
      nightstand: { fill: 'rgba(139,90,43,0.3)', stroke: 'rgba(180,130,80,0.5)' },
      wardrobe: { fill: 'rgba(100,70,50,0.3)', stroke: 'rgba(150,110,80,0.5)' },
      desk: { fill: 'rgba(139,90,43,0.3)', stroke: 'rgba(180,130,80,0.5)' },
      dining: { fill: 'rgba(139,90,43,0.35)', stroke: 'rgba(180,130,80,0.6)' },
      cabinet: { fill: 'rgba(100,70,50,0.3)', stroke: 'rgba(150,110,80,0.5)' },
      sink: { fill: 'rgba(80,120,140,0.3)', stroke: 'rgba(100,160,180,0.5)' },
      bookshelf: { fill: 'rgba(100,70,50,0.3)', stroke: 'rgba(150,110,80,0.5)' }
    };
    this._rooms.forEach(r => {
      if (!r.furniture) return;
      r.furniture.forEach(f => {
        const fx = (r.x + f.x) * s, fy = (r.y + f.y) * s, fw = f.w * s, fh = f.h * s;
        const c = colors[f.type] || colors.sofa;
        ctx.fillStyle = c.fill;
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 1;
        ctx.fillRect(fx, fy, fw, fh);
        ctx.strokeRect(fx, fy, fw, fh);
        // 图形化内部细节
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 0.8;
        if (f.type === 'sofa') {
          // 画靠背和扶手
          const padding = Math.min(fw, fh) * 0.15;
          if (fw > fh) {
            ctx.strokeRect(fx + padding, fy + padding, fw - padding*2, fh - padding);
          } else {
            ctx.strokeRect(fx + padding, fy + padding, fw - padding, fh - padding*2);
          }
        } else if (f.type === 'bed') {
          // 画枕头区域
          const pad = Math.min(fw, fh) * 0.2;
          if (fw > fh) {
            ctx.strokeRect(fx + pad, fy + pad*0.5, fw - pad*2, pad);
          } else {
            ctx.strokeRect(fx + pad*0.5, fy + pad, pad, fh - pad*2);
          }
        } else if (f.type === 'tv') {
          // 画屏幕
          const pad = Math.min(fw, fh) * 0.1;
          ctx.fillStyle = 'rgba(20,20,20,0.6)';
          ctx.fillRect(fx + pad, fy + pad, fw - pad*2, fh - pad*2);
        } else if (f.type === 'dining') {
          // 画桌面中心
          ctx.beginPath();
          ctx.arc(fx + fw/2, fy + fh/2, Math.min(fw, fh)*0.25, 0, Math.PI*2);
          ctx.stroke();
        }
      });
    });
  },

  _drawSmartDevices() {
    const ctx = this.ctx, s = this.SCALE;
    const icons = {gateway:'G',smartSpeaker:'S',smartLock:'L',smartSwitch:'K',robotVacuum:'V',smartCurtain:'C',camera:'M',tempSensor:'T',motionSensor:'P',airPurifier:'A',smartBathHeater:'B',smokeAlarm:'F'};
    this._smartDevices.forEach(sd => {
      const sx = sd.x * s, sy = sd.y * s;
      ctx.fillStyle = 'rgba(255,140,0,0.8)';
      ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[sd.type] || '?', sx, sy);
    });
  },

  _drawSpecialItems() {
    const ctx = this.ctx, s = this.SCALE;
    this._rooms.forEach(r => {
      if (r.weakBox) {
        const x = (r.x + r.weakBox.x) * s, y = (r.y + r.weakBox.y) * s;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.fillRect(x - 8, y - 7, 16, 14);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('弱电', x, y);
      }
      if (r.router) {
        const x = (r.x + r.router.x) * s, y = (r.y + r.router.y) * s;
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y + 1, i * 4.5, -Math.PI * 0.8, -Math.PI * 0.2, false);
          ctx.stroke();
        }
      }
      if (r.toilet) {
        const x = (r.x + r.toilet.x) * s, y = (r.y + r.toilet.y) * s;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, y, 7, 10, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (r.ac) {
        const x = (r.x + r.ac.x) * s, y = (r.y + r.ac.y) * s;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x - 8, y - 6, 16, 12);
        ctx.strokeRect(x - 8, y - 6, 16, 12);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('AC', x, y);
      }
      if (r.waterPoints) {
        r.waterPoints.forEach(wp => {
          const x = (r.x + wp.x) * s, y = (r.y + wp.y) * s;
          // 蓝色水滴：圆形+三角尾巴
          ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
          ctx.beginPath();
          ctx.arc(x, y - 3, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - 4, y + 2);
          ctx.lineTo(x + 4, y + 2);
          ctx.lineTo(x, y + 8);
          ctx.closePath();
          ctx.fill();
        });
      }
    });
  },

  _drawEntranceDoor() {
    if (!this._entranceDoor.roomId) return;
    const room = this._rooms.find(r => r.id === this._entranceDoor.roomId);
    if (!room) return;
    const ctx = this.ctx, s = this.SCALE;
    let x, y;
    const wall = this._entranceDoor.wall;
    if (wall === '上') { x = room.x * s + room.width * s / 2; y = room.y * s; }
    else if (wall === '下') { x = room.x * s + room.width * s / 2; y = (room.y + room.length) * s; }
    else if (wall === '左') { x = room.x * s; y = (room.y + room.length / 2) * s; }
    else { x = (room.x + room.width) * s; y = (room.y + room.length / 2) * s; }

    ctx.fillStyle = 'rgba(255,100,100,0.6)';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('门', x, y);
  },

  // ========== 画布尺寸 ==========
  _resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.wrap.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this._draw();
  },

  // ========== 视图 ==========
  _resetView() {
    if (this._rooms.length === 0) {
      this._viewport = { offsetX: 0, offsetY: 0, zoom: 1 };
    } else {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      this._rooms.forEach(r => { minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + r.width); maxY = Math.max(maxY, r.y + r.length); });
      const cw = (maxX + minX) / 2, ch = (maxY + minY) / 2;
      const rect = this.wrap.getBoundingClientRect();
      const vw = rect.width / this.SCALE, vh = rect.height / this.SCALE;
      const zoom = Math.min(vw / (maxX - minX + 2), vh / (maxY - minY + 2), 1.5);
      this._viewport = { offsetX: vw / 2 / zoom - cw, offsetY: vh / 2 / zoom - ch, zoom };
    }
    this._draw();
  },

  // ========== 导出 ==========
  _exportJPG() {
    const link = document.createElement('a');
    link.download = '户型布局_' + new Date().toISOString().slice(0, 10) + '.jpg';
    link.href = this.canvas.toDataURL('image/jpeg', 0.9);
    link.click();
    this._showToast('已导出图片');
  },
  _buildLayoutData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      rooms: this._rooms.map(r => ({
        id: r.id, type: r.type, x: r.x, y: r.y,
        width: r.width, length: r.length,
        windows: r.windows || [], infrastructure: r.infrastructure || [],
        waterPoints: r.waterPoints || [],
        furniture: r.furniture || [],
        flipped: r.flipped || false,
        weakBox: r.weakBox || null, router: r.router || null,
        toilet: r.toilet || null, ac: r.ac || null
      })),
      doorways: this._doorways,
      entranceDoor: this._entranceDoor,
      smartDevices: this._smartDevices,
      currentPreset: this._currentPreset
    };
  },
  _exportJSON() {
    const data = this._buildLayoutData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = '户型数据_' + new Date().toISOString().slice(0, 10) + '.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    this._showToast('已导出 JSON 数据');
  },
  _copyInfo() {
    const data = this._buildLayoutData();
    const json = JSON.stringify(data, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => {
        this._showToast('户型信息已复制到剪贴板');
      }).catch(() => {
        this._fallbackCopy(json);
      });
    } else {
      this._fallbackCopy(json);
    }
  },
  _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); this._showToast('户型信息已复制'); }
    catch (e) { this._showToast('复制失败，请手动选择'); }
    document.body.removeChild(ta);
  },
  _showContextMenu(e) {
    const pos = this._getMousePos(e);
    const room = this._findRoomAtScreen(pos.x, pos.y);
    const menu = document.getElementById('fp-context-menu');
    if (!room) { menu.style.display = 'none'; return; }
    menu.dataset.roomId = room.id;
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
  },

  // ========== 示例加载 ==========
  _loadDemo() {
    if (this._rooms.length > 0) return;
    const rooms = [
      { type: '阳台', x: -2, y: 0, width: 2, length: 4, windows: [], infrastructure: [], waterPoints: [], furniture: [] },
      { type: '客厅', x: 0, y: 0, width: 5, length: 4, windows: [{wall:'下',offset:0,width:2}], infrastructure: [], waterPoints: [], furniture: [] },
      { type: '主卧', x: 5, y: 0, width: 4, length: 3.5, windows: [{wall:'下',offset:0,width:1.5}], infrastructure: [], waterPoints: [], furniture: [] },
      { type: '次卧', x: 0, y: 4, width: 3.5, length: 3, windows: [{wall:'上',offset:0,width:1.5}], infrastructure: [], waterPoints: [], furniture: [] },
      { type: '卫生间', x: 3.5, y: 4, width: 1.5, length: 2, windows: [], infrastructure: [], waterPoints: [], furniture: [] },
      { type: '厨房', x: 5, y: 3.5, width: 3, length: 2.5, windows: [{wall:'右',offset:0,width:0.8}], infrastructure: [], waterPoints: [], furniture: [] },
    ];
    this._rooms = rooms.map((r, i) => ({ id: 'r' + (i + 1), ...r }));
    // 客厅
    this._rooms[1].weakBox = { x: 0.3, y: 0.3 };
    this._rooms[1].router = { x: 0.3, y: 1.5 };
    this._rooms[1].ac = { x: 2.5, y: 0 };
    this._rooms[1].infrastructure.push({ type: 'socket', x: 1, y: 1 }, { type: 'socket', x: 3, y: 1 });
    // 主卧
    this._rooms[2].ac = { x: 2, y: 0 };
    this._rooms[2].infrastructure.push({ type: 'socket', x: 1, y: 1 });
    // 次卧
    this._rooms[3].infrastructure.push({ type: 'socket', x: 1, y: 1 });
    // 厨房
    this._rooms[5].waterPoints.push({ x: 3, y: 1.5 });
    this._rooms[5].infrastructure.push({ type: 'socket', x: 1, y: 1 });
    // 卫生间
    this._rooms[4].toilet = { x: 0.75, y: 2 };
    this._rooms[4].waterPoints.push({ x: 0.3, y: 2 });
    this._rooms[4].infrastructure.push({ type: 'socket', x: 1, y: 1 });
    this._updateDoorways();
    this._autoDetectEntrance();
    this._resetView();
  },

  // ========== Toast ==========
  _showToast(msg) {
    const toast = document.getElementById('fp-toast');
    toast.textContent = msg;
    toast.classList.add('fp-toast-show');
    setTimeout(() => toast.classList.remove('fp-toast-show'), 2000);
  },

  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
  }
};