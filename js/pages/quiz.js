/**
 * 智家清单 - 问卷测评页
 */
const QuizPage = {
  currentStep: 0,
  answers: {},

  questions: [
    {
      id: 'houseType',
      title: '你的住房情况？',
      subtitle: '不同情况影响安装方案，帮助我们计算设备数量和摆放位置',
      type: 'house-and-rooms',
      options: [
        { value: 'new', label: '毛坯装修', icon: 'new', desc: '新装修可预埋，美观一体' },
        { value: 'renovate', label: '改造', icon: 'renovate', desc: '不破坏装修，利用现有家电、灯具、硬装' },
        { value: 'rent', label: '租房', icon: 'rent', desc: '优先免安装、可带走的方案' }
      ],
      roomConfig: [
        { key: 'bedrooms', label: '卧室', min: 1, max: 5, default: 3 },
        { key: 'livingRooms', label: '客厅', min: 1, max: 2, default: 1 }
      ]
    },
    {
      id: 'members',
      title: '家庭成员有哪些？',
      subtitle: '不同成员影响设备选择优先级',
      type: 'multi',
      options: [
        { value: 'self', label: '自住', icon: 'solo', desc: '注重个人便利' },
        { value: 'elderly', label: '有老人', icon: 'elderly', desc: '增加语音和感应' },
        { value: 'child', label: '有小孩', icon: 'child', desc: '增加安防设备' },
        { value: 'pet', label: '有宠物', icon: 'pet', desc: '增加看护设备' }
      ]
    },
    {
      id: 'scenarios',
      title: '你最想解决哪些问题？',
      subtitle: '选择你关心的方向，再选择具体痛点',
      type: 'grouped-multi',
      groups: [
        {
          id: 'home',
          label: '日常便利',
          icon: 'home',
          desc: '自动开关灯/电器',
          options: [
            { value: 'forget-light', label: '经常忘关灯', icon: 'light', desc: '出门总怀疑灯没关' },
            { value: 'auto-entry', label: '进门自动开灯', icon: 'home', desc: '进门自动亮灯换氛围' }
          ]
        },
        {
          id: 'comfort',
          label: '舒适体验',
          icon: 'comfort',
          desc: '氛围灯光/温控',
          options: [
            { value: 'ritual', label: '提升生活仪式感', icon: 'comfort', desc: '灯光氛围、窗帘联动' }
          ]
        },
        {
          id: 'security',
          label: '安全防护',
          icon: 'security',
          desc: '门锁/监控/报警',
          options: [
            { value: 'elderly-safety', label: '担心老人安全', icon: 'elderly', desc: '老人独自在家不放心' },
            { value: 'pet-monitor', label: '远程看宠物', icon: 'pet', desc: '上班想随时看毛孩子' },
            { value: 'child-safety', label: '担心小孩安全', icon: 'child', desc: '小孩在家不放心' }
          ]
        },
        {
          id: 'chores',
          label: '轻松家务',
          icon: 'chores',
          desc: '扫地/洗碗自动化',
          options: [
            { value: 'sweep', label: '不想扫地拖地', icon: 'vacuum', desc: '地面清洁交给机器人' },
            { value: 'dish', label: '不想洗碗', icon: 'dishwasher', desc: '餐后解放双手' }
          ]
        }
      ],
      standaloneOptions: []
    },
    {
      id: 'platform',
      title: '你偏好的智能平台是？',
      subtitle: '选择你偏好或已在用的智能家居平台',
      type: 'single',
      hasDetail: true,
      options: [
        { value: 'mijia', label: '米家', icon: 'mijia', desc: '小米生态，产品丰富性价比高' },
        { value: 'apple', label: '苹果HomeKit', icon: 'apple', desc: '隐私优先，与iPhone深度整合' },
        { value: 'huawei', label: '华为鸿蒙智联', icon: 'huawei', desc: '华为生态，稳定可靠' },
        { value: 'unknown', label: '不太了解，先看看', icon: 'unknown', desc: '先看方案再决定平台' }
      ]
    }
  ],

  init() {
    this.currentStep = 0;
    this.answers = {};
  },

  render() {
    this.init();
    const container = document.getElementById('page-content');

    // 每次进入测评tab都先显示介绍页
    this._renderIntroPage();
  },

  _renderIntroPage() {
    const container = document.getElementById('page-content');
    const quizCompleted = store.isQuizCompleted();

    container.innerHTML = `
      <div class="page quiz-page">
        <div class="quiz-hero">
          <div class="quiz-hero-content">
            <div class="quiz-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
              12,000+ 家庭已获取专属方案
            </div>
            <h1 class="brand-name" style="font-family: Impact, 'Arial Black', sans-serif; font-weight: 900; letter-spacing: 2px;"><span class="brand-name-highlight">智家</span><span class="brand-name-normal">清单</span></h1>
            <p class="brand-slogan">4道题，找到你的智能家居方案</p>
            <p class="brand-desc">拒绝盲目全屋定制，帮你找到真正适合的升级路径</p>
            ${quizCompleted ? `
              <div style="display:flex; gap:12px;">
                <button class="btn btn-primary btn-lg" onclick="QuizPage.startQuiz()">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  重新测评
                </button>
                <button class="btn btn-outline btn-lg" onclick="router.navigate('recommend')">
                  查看方案
                </button>
              </div>
            ` : `
              <button class="btn btn-primary btn-lg" onclick="QuizPage.startQuiz()">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                开始智能测评
              </button>
            `}
          </div>
        </div>

        <div class="quiz-stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">25</span>
              <span class="stat-label">评估维度</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">1000+</span>
              <span class="stat-label">严选产品</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">3</span>
              <span class="stat-label">大平台</span>
            </div>
          </div>
        </div>

        <div class="quiz-features-section">
          <h2 class="section-title">为什么选择智家清单</h2>
          <div class="feature-grid">
            <div class="feature-card" onclick="QuizPage.startQuiz()">
              <div class="feature-icon" style="background: linear-gradient(135deg, #FF8C00, #ff6b00);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>精准匹配</h3>
              <p>4道问卷覆盖居住场景，AI规则引擎科学推荐</p>
            </div>
            <div class="feature-card" onclick="router.navigate('recommend')">
              <div class="feature-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <h3>场景方案</h3>
              <p>网关/灯光/窗帘/安防/宠物等场景包，按需组合</p>
            </div>
            <div class="feature-card" onclick="window.open('智家清单方案介绍.html','_blank')">
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
        </div>
      </div>
    `;
  },

  startQuiz() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page quiz-page">
        <div class="quiz-header">
          <h1>智能测评</h1>
          <p>回答4个问题，获取专属方案</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${100 / this.questions.length}%"></div>
          </div>
          <span class="progress-text">1 / ${this.questions.length}</span>
        </div>
        <div id="quiz-content" class="quiz-content"></div>
      </div>
    `;
    this.renderStep();
  },

  renderStep() {
    const q = this.questions[this.currentStep];
    const content = document.getElementById('quiz-content');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (!q) {
      this.submitResult();
      return;
    }

    const progress = ((this.currentStep + 1) / this.questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${this.currentStep + 1} / ${this.questions.length}`;

    const savedAnswer = this.answers[q.id];

    let optionsHtml = '';
    if (q.type === 'house-and-rooms') {
      const houseAnswer = savedAnswer || null;
      const rooms = (savedAnswer && savedAnswer.rooms) ? savedAnswer.rooms : { bedrooms: 3, livingRooms: 1 };
      optionsHtml = `
        <div class="quiz-options">
          ${q.options.map(opt => `
            <div class="quiz-option ${houseAnswer === opt.value ? 'selected' : ''}"
                 data-value="${opt.value}"
                 onclick="QuizPage.selectHouseAndRooms('${q.id}', '${opt.value}', this)">
              <div class="option-icon">
                ${this._getOptionIcon(opt.icon)}
              </div>
              <div class="option-text">
                <span class="option-label">${opt.label}</span>
                <span class="option-desc">${opt.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border,#333);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <span style="font-size:15px;font-weight:600;color:var(--text-primary,#fff);">房间结构</span>
            <button class="btn btn-primary" style="font-size:12px;padding:6px 14px;height:auto;display:flex;align-items:center;gap:4px;border-radius:8px;" onclick="router.navigate('floorplan')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              编辑户型图
            </button>
          </div>
          <div class="room-config-grid">
            ${q.roomConfig.map(cfg => `
              <div class="room-config-item">
                <div class="room-config-label">${cfg.label}</div>
                <div class="room-config-stepper">
                  <button class="qty-btn" onclick="QuizPage.changeRoom('${cfg.key}', -1, ${cfg.min}, ${cfg.max})">-</button>
                  <span class="qty-value" id="room-${cfg.key}">${rooms[cfg.key] !== undefined ? rooms[cfg.key] : cfg.default}</span>
                  <button class="qty-btn" onclick="QuizPage.changeRoom('${cfg.key}', 1, ${cfg.min}, ${cfg.max})">+</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (q.type === 'rooms') {
      const rooms = savedAnswer || { bedrooms: 3, livingRooms: 1 };
      optionsHtml = `
        <div class="room-config-grid">
          ${q.roomConfig.map(cfg => `
            <div class="room-config-item">
              <div class="room-config-label">${cfg.label}</div>
              <div class="room-config-stepper">
                <button class="qty-btn" onclick="QuizPage.changeRoom('${cfg.key}', -1, ${cfg.min}, ${cfg.max})">-</button>
                <span class="qty-value" id="room-${cfg.key}">${rooms[cfg.key] !== undefined ? rooms[cfg.key] : cfg.default}</span>
                <button class="qty-btn" onclick="QuizPage.changeRoom('${cfg.key}', 1, ${cfg.min}, ${cfg.max})">+</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'grouped-multi') {
      optionsHtml = this._renderGroupedMulti(q);
    } else {
      optionsHtml = `
        <div class="quiz-options">
          ${q.options.map(opt => `
            <div class="quiz-option ${savedAnswer === opt.value || (Array.isArray(savedAnswer) && savedAnswer.includes(opt.value)) ? 'selected' : ''}"
                 data-value="${opt.value}" data-type="${q.type}"
                 onclick="QuizPage.selectOption('${q.id}', '${opt.value}', '${q.type}', this)">
              <div class="option-icon">
                ${this._getOptionIcon(opt.icon)}
              </div>
              <div class="option-text">
                <span class="option-label">${opt.label}</span>
                <span class="option-desc">${opt.desc}</span>
              </div>
              ${q.type === 'multi' ? '<div class="option-check"></div>' : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    const isOptional = q.optional;
    const skipBtn = isOptional
      ? `<button class="btn btn-text skip-btn" onclick="QuizPage.skipStep()">跳过</button>`
      : '';

    const multiTag = q.type === 'multi' || q.type === 'grouped-multi'
      ? `<span style="display:inline-block;font-size:12px;font-weight:500;color:#FF8C00;background:rgba(255,140,0,0.12);border:1px solid rgba(255,140,0,0.3);border-radius:6px;padding:2px 8px;margin-left:8px;vertical-align:middle;">可多选</span>`
      : '';

    content.innerHTML = `
      <div class="quiz-step" style="animation: fadeIn 0.3s ease">
        <h2 class="quiz-question">${q.title}${multiTag}</h2>
        <p class="quiz-subtitle">${q.subtitle}</p>
        ${q.hasDetail ? `
          <div style="text-align:right;margin-bottom:12px;">
            <button class="btn btn-text" style="font-size:12px;padding:4px 8px;height:auto;color:var(--primary);display:inline-flex;align-items:center;gap:4px;" onclick="QuizPage.togglePlatformDetail()">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              平台对比详情
            </button>
          </div>
          <div id="platform-detail-panel" style="display:none;margin-bottom:16px;background:var(--bg-card,#111);border:1px solid var(--border,#333);border-radius:12px;padding:14px;overflow-x:auto;">
            ${this._renderPlatformComparisonTable()}
          </div>
        ` : ''}
        ${optionsHtml}
        ${q.type === 'multi' || q.type === 'rooms' || q.type === 'grouped-multi' || q.type === 'house-and-rooms' ? `
          <div class="quiz-nav">
            ${this.currentStep > 0 ? '<button class="btn btn-outline" onclick="QuizPage.prevStep()">上一步</button>' : ''}
            <button class="btn btn-primary" onclick="QuizPage.nextStep()">下一步</button>
          </div>
        ` : ''}
        <div class="quiz-actions">
          ${this.currentStep > 0 ? `<button class="btn btn-text" onclick="QuizPage.prevStep()">返回修改</button>` : ''}
          ${skipBtn}
        </div>
      </div>
    `;

    // Scroll to quiz header so the new question is always in view
    const quizHeader = document.querySelector('.quiz-header');
    if (quizHeader) {
      quizHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  /**
   * 渲染分组多选题
   */
  _renderGroupedMulti(q) {
    var self = this;
    var members = this.answers.members || [];
    var html = '<div class="quiz-grouped-list">';

    // 渲染每个组
    q.groups.forEach(function(group) {
      // 成员过滤：根据题3的成员选择来决定是否显示特定选项
      var filteredOptions = group.options.filter(function(opt) {
        if (opt.value === 'elderly-safety' && !members.includes('elderly')) return false;
        if (opt.value === 'pet-monitor' && !members.includes('pet')) return false;
        if (opt.value === 'child-safety' && !members.includes('child')) return false;
        return true;
      });

      // 如果过滤后没有选项，不显示该组（除非有独立选项）
      // 但组的标题始终显示（用户可以只选组不选具体选项的场景）
      // 实际上如果过滤后无子选项，整个组也没有意义，跳过
      if (filteredOptions.length === 0) return;

      html += '<div class="quiz-group-card" data-group="' + group.id + '">';
      html += '  <div class="quiz-group-header" onclick="QuizPage.selectGroup(\'' + group.id + '\')">';
      html += '    <div class="quiz-group-icon">' + self._getOptionIcon(group.icon) + '</div>';
      html += '    <div class="quiz-group-info">';
      html += '      <span class="quiz-group-label">' + group.label + '</span>';
      html += '      <span class="quiz-group-desc">' + group.desc + '</span>';
      html += '    </div>';
      html += '    <div class="quiz-group-check"></div>';
      html += '    <div class="quiz-group-arrow"></div>';
      html += '  </div>';
      html += '  <div class="quiz-group-options">';

      filteredOptions.forEach(function(opt) {
        html += '<div class="quiz-group-option" data-value="' + opt.value + '" data-group="' + group.id + '" onclick="QuizPage.toggleGroupOption(\'' + group.id + '\', \'' + opt.value + '\', this)">';
        html += '  <div class="option-icon-sm">' + self._getOptionIcon(opt.icon) + '</div>';
        html += '  <div class="option-text">';
        html += '    <span class="option-label">' + opt.label + '</span>';
        html += '    <span class="option-desc">' + opt.desc + '</span>';
        html += '  </div>';
        html += '  <div class="option-check-sm"></div>';
        html += '</div>';
      });

      html += '  </div>';
      html += '</div>';
    });

    // 渲染独立选项（不属于任何组）
    if (q.standaloneOptions && q.standaloneOptions.length > 0) {
      html += '<div class="quiz-group-standalone">';
      q.standaloneOptions.forEach(function(opt) {
        html += '<div class="quiz-group-option quiz-standalone-option" data-value="' + opt.value + '" onclick="QuizPage.toggleStandaloneOption(\'' + opt.value + '\', this)">';
        html += '  <div class="option-icon-sm">' + self._getOptionIcon(opt.icon) + '</div>';
        html += '  <div class="option-text">';
        html += '    <span class="option-label">' + opt.label + '</span>';
        html += '    <span class="option-desc">' + opt.desc + '</span>';
        html += '  </div>';
        html += '  <div class="option-check-sm"></div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /**
   * 切换整个组的选中状态（全选/全取消）
   */
  selectGroup(groupId) {
    var card = document.querySelector('.quiz-group-card[data-group="' + groupId + '"]');
    if (!card) return;

    var header = card.querySelector('.quiz-group-header');
    var isCurrentlySelected = header.classList.contains('selected');
    var groupOptions = card.querySelectorAll('.quiz-group-option');

    if (isCurrentlySelected) {
      // 取消选中组：取消组标题高亮 + 取消所有子选项
      header.classList.remove('selected');
      card.classList.remove('expanded');
      groupOptions.forEach(function(opt) {
        opt.classList.remove('selected');
      });
    } else {
      // 选中组：高亮组标题 + 展开子选项 + 选中所有子选项
      header.classList.add('selected');
      card.classList.add('expanded');
      groupOptions.forEach(function(opt) {
        opt.classList.add('selected');
      });
    }
  },

  /**
   * 切换组内单个选项
   */
  toggleGroupOption(groupId, optionValue, el) {
    var card = document.querySelector('.quiz-group-card[data-group="' + groupId + '"]');
    if (!card) return;

    var header = card.querySelector('.quiz-group-header');
    var isSelected = el.classList.toggle('selected');

    // 确保组展开
    if (isSelected) {
      card.classList.add('expanded');
    }

    // 检查组内是否所有选项都被选中，同步组标题状态
    var allOptions = card.querySelectorAll('.quiz-group-option');
    var allSelected = true;
    allOptions.forEach(function(opt) {
      if (!opt.classList.contains('selected')) {
        allSelected = false;
      }
    });

    if (allSelected) {
      header.classList.add('selected');
    } else {
      header.classList.remove('selected');
    }
  },

  /**
   * 切换独立选项（不属于任何组）
   */
  toggleStandaloneOption(value, el) {
    el.classList.toggle('selected');
  },

  /**
   * 从 DOM 收集 grouped-multi 题型的答案
   */
  _collectGroupedAnswers() {
    var scenarios = [];
    var painPoints = [];

    // 收集每个组的选中状态
    var groupCards = document.querySelectorAll('.quiz-group-card');
    groupCards.forEach(function(card) {
      var groupId = card.getAttribute('data-group');
      var header = card.querySelector('.quiz-group-header');

      if (header.classList.contains('selected')) {
        scenarios.push(groupId);
      }

      // 收集组内被选中的子选项
      var options = card.querySelectorAll('.quiz-group-option.selected');
      options.forEach(function(opt) {
        var val = opt.getAttribute('data-value');
        if (val) painPoints.push(val);
      });
    });

    // 收集独立选项
    var standaloneOpts = document.querySelectorAll('.quiz-standalone-option.selected');
    standaloneOpts.forEach(function(opt) {
      var val = opt.getAttribute('data-value');
      if (val) painPoints.push(val);
    });

    this.answers.scenarios = scenarios;
    this.answers.painPoints = painPoints;
  },

  togglePlatformDetail() {
    const panel = document.getElementById('platform-detail-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  _renderPlatformComparisonTable() {
    return `
      <table style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.6;">
        <thead>
          <tr style="border-bottom:1px solid var(--border,#333);">
            <th style="text-align:left;padding:6px 8px;color:var(--text-secondary,#999);font-weight:500;">对比维度</th>
            <th style="text-align:center;padding:6px 8px;color:#FF8C00;font-weight:600;">米家</th>
            <th style="text-align:center;padding:6px 8px;color:#007AFF;font-weight:600;">HomeKit</th>
            <th style="text-align:center;padding:6px 8px;color:#CF0A2C;font-weight:600;">华为鸿蒙智联</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">产品丰富度</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">6000+款</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">800+款</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">1000+款</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">价格区间</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">¥29~几百</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">¥100~上千</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">¥50~几百</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">性价比</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">高</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">中</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">中高</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">语音控制</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">小爱同学</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">Siri</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">小艺</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">隐私安全</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">云端为主</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">本地优先</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">云端+本地</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#222);">
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">生态整合</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">小米全家桶</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">Apple全家桶</td>
            <td style="text-align:center;padding:6px 8px;color:#10b981;">华为全家桶</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;color:var(--text-secondary,#999);">适合人群</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">入门首选</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">苹果用户</td>
            <td style="text-align:center;padding:6px 8px;color:var(--text-primary,#fff);">华为用户</td>
          </tr>
        </tbody>
      </table>
    `;
  },

  selectHouseAndRooms(questionId, value, el) {
    this.answers.houseType = value;
    document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    // 不自动跳转，让用户也设置房间结构
  },

  showUploadFloorplan() {
    const overlay = document.createElement('div');
    overlay.id = 'floorplan-upload-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
      <div style="background:var(--bg2,#1a1a1a);border-radius:16px;padding:24px;max-width:320px;width:100%;border:1px solid var(--border,#333);">
        <div style="text-align:center;margin-bottom:16px;">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h3 style="margin:0 0 12px;color:var(--text-primary,#fff);font-size:18px;text-align:center;">编辑户型图</h3>
        <p style="margin:0 0 16px;color:var(--text-secondary,#999);font-size:14px;line-height:1.6;text-align:center;">本功能尚待开发。根据上传图纸，自动识别户型，并标注设备推荐安装位置。</p>
        <button class="btn btn-primary" style="width:100%;" onclick="document.getElementById('floorplan-upload-overlay').remove()">知道了</button>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  changeRoom(key, delta, min, max) {
    if (!this.answers.rooms) {
      this.answers.rooms = { bedrooms: 3, livingRooms: 1 };
    }
    const current = this.answers.rooms[key];
    const newVal = current + delta;
    if (newVal < min || newVal > max) return;
    this.answers.rooms[key] = newVal;
    const el = document.getElementById(`room-${key}`);
    if (el) el.textContent = newVal;
  },

  selectOption(questionId, value, type, el) {
    if (type === 'single') {
      this.answers[questionId] = value;
      // Auto advance for single select
      document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      setTimeout(() => this.nextStep(), 300);
    } else {
      // Multi select toggle
      if (!this.answers[questionId]) {
        this.answers[questionId] = [];
      }
      const idx = this.answers[questionId].indexOf(value);
      if (idx === -1) {
        this.answers[questionId].push(value);
        el.classList.add('selected');
      } else {
        this.answers[questionId].splice(idx, 1);
        el.classList.remove('selected');
      }
    }
  },

  nextStep() {
    try {
      // For rooms question, ensure default values if not set
      const q = this.questions[this.currentStep];
      if (q && q.id === 'rooms' && !this.answers.rooms) {
        this.answers.rooms = { bedrooms: 3, livingRooms: 1 };
      }

      // For house-and-rooms question, save houseType and rooms separately
      if (q && q.type === 'house-and-rooms') {
        if (!this.answers.rooms) this.answers.rooms = { bedrooms: 3, livingRooms: 1 };
        // Read room values from DOM
        q.roomConfig.forEach(cfg => {
          const el = document.getElementById(`room-${cfg.key}`);
          if (el) this.answers.rooms[cfg.key] = parseInt(el.textContent) || cfg.default;
        });
      }

      // For grouped-multi question, collect answers from DOM
      if (q && q.type === 'grouped-multi') {
        this._collectGroupedAnswers();
      }

      if (this.currentStep < this.questions.length - 1) {
        this.currentStep++;
        this.renderStep();
      } else {
        this.submitResult();
      }
    } catch (e) {
      console.error('nextStep 出错:', e);
      App.showToast('操作失败，请重试');
    }
  },

  prevStep() {
    try {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.renderStep();
      }
    } catch (e) {
      console.error('prevStep 出错:', e);
    }
  },

  skipStep() {
    try {
      this.currentStep++;
      if (this.currentStep >= this.questions.length) {
        this.submitResult();
      } else {
        this.renderStep();
      }
    } catch (e) {
      console.error('skipStep 出错:', e);
      App.showToast('操作失败，请重试');
    }
  },

  submitResult() {
    try {
      App.showToast('正在生成方案...');

      // Fill defaults for unanswered questions
      if (!this.answers.platform || this.answers.platform === 'unknown') this.answers.platform = 'mijia';
      if (!this.answers.houseType) this.answers.houseType = 'new';
      if (!this.answers.rooms) this.answers.rooms = { bedrooms: 3, livingRooms: 1 };
      if (!this.answers.members || this.answers.members.length === 0) this.answers.members = ['self'];
      if (!this.answers.scenarios || this.answers.scenarios.length === 0) this.answers.scenarios = ['home', 'comfort'];
      if (!this.answers.painPoints) this.answers.painPoints = [];

      store.saveQuizResult(this.answers);

      // Generate recommendation for all tiers
      try {
        const recommender = new Recommender(ProductsDB);
        const tiers = ['base', 'standard', 'premium'];
        const tierBudgets = {};
        let defaultResult = null;
        tiers.forEach(function(t) {
          var res = recommender.generate(this.answers, t);
          tierBudgets[t] = res.totalCost;
          if (t === (store.getRecommendationTier() || 'premium')) {
            defaultResult = res;
          }
        }.bind(this));
        store.saveTierBudgets(tierBudgets);
        store.saveRecommendation(defaultResult || recommender.generate(this.answers, 'premium'));
      } catch (e) {
        console.error('推荐生成失败:', e);
      }

      // Always navigate to recommend page
      router.navigate('recommend');
    } catch (e) {
      console.error('submitResult 出错:', e);
      App.showToast('提交失败，请重试');
      // Force navigate even if something went wrong
      try { router.navigate('recommend'); } catch (_) {}
    }
  },

  _getOptionIcon(icon) {
    const icons = {
      mijia: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
      apple: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
      huawei: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>',
      new: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      renovate: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      rent: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
      solo: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      elderly: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 3h-2v4"/><path d="M8 3h2v4"/></svg>',
      child: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0113 0"/></svg>',
      pet: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M8 20c1.5-2 4.5-2 6 0"/></svg>',
      home: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      comfort: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
      security: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      light: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>',
      chores: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>',
      vacuum: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/></svg>',
      dishwasher: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>',
      unknown: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    return icons[icon] || '';
  }
};
