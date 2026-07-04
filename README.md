# 智家清单

> 4道题，找到你的智能家居方案。

**智家清单**是一款面向普通家庭的智能家居决策辅助工具。通过简短的场景化测评，结合居住情况、家庭成员、核心痛点和平台偏好，为用户生成个性化的「场景包 + 产品清单」推荐方案，解决「智能家居从哪开始、该买什么」的入门难题。

---

## 在线体验

[点击打开智家清单](https://niebowen.github.io/zhijia-list/)

---

## 核心功能

### 智能测评（4道题）
| 题目 | 内容 |
|------|------|
| 住房情况 | 毛坯/改造/租房 + 房间结构配置 + 户型图上传（开发中） |
| 家庭成员 | 自住/老人/小孩/宠物，影响设备优先级 |
| 核心痛点 | 日常便利/安防/氛围/家务等场景化多选 |
| 平台偏好 | 米家 / HomeKit / 华为 HiLink |

### 方案推荐
- **场景化 Bundle 推荐**：网关、灯光、窗帘、安防、环境、传感、宠物、家务 8 大场景包
- **智能去重**：登记已有产品后自动剔除重复项，实时更新预算
- **升级/降级**：每个场景包支持多级切换（如灯光基础包 → 氛围包）
- **网关依赖检测**：自动识别方案中哪些设备需要网关

### 辅助工具
- 产品广场浏览与搜索
- 购物车与预算追踪
- 产品横向对比
- 社区攻略与案例分享
- 智能灯光效果预览（iframe 嵌入独立 demo）

---

## 项目截图

| 首页 | 智能测评 |
|------|----------|
| ![首页](assets/gifs/01-homepage.gif) | ![测评](assets/gifs/02-quiz.gif) |

| 方案推荐 | 产品广场 |
|----------|----------|
| ![推荐](assets/gifs/03-recommend.gif) | ![广场](assets/gifs/04-square.gif) |

---

## 快速开始

本项目为纯前端静态页面，无需构建工具，直接打开即可使用。

```bash
# 克隆仓库
git clone https://github.com/niebowen/zhijia-list.git

# 进入目录
cd zhijia-list

# 用浏览器打开 index.html
# 或使用本地服务器
npx serve .
```

---

## 项目结构

```
ju-zhi-checklist/
├── index.html              # 主入口（测评 + 推荐 + 商城）
├── intro.html              # 测评介绍页
├── 智家清单方案介绍.html    # 产品展示页（痛点/方案/故事/商业价值）
├── css/
│   ├── style.css           # 全局样式
│   └── pages.css           # 页面级样式
├── js/
│   ├── app.js              # 应用入口与路由
│   ├── pages/              # 各页面逻辑
│   │   ├── quiz.js         # 智能测评
│   │   ├── recommend.js    # 方案推荐
│   │   ├── shop.js         # 产品广场
│   │   ├── cart.js         # 购物车
│   │   ├── profile.js      # 已有产品
│   │   └── ...
│   ├── engine/             # 推荐引擎
│   │   ├── recommender.js  # 场景包生成逻辑
│   │   └── gateway.js      # 网关依赖计算
│   ├── data/               # 数据层
│   │   ├── products.js     # 产品数据库（120+）
│   │   ├── scenarios.js    # 场景数据
│   │   └── community.js    # 社区内容
│   └── utils/
│       ├── router.js       # 前端路由
│       └── store.js        # localStorage 数据持久化
├── assets/
│   ├── gifs/               # 项目截图 GIF
│   ├── stories/            # 用户故事插画
│   └── lighting-demo/      # 智能灯光效果展示
└── README.md
```

---

## 技术栈

- **纯前端**：HTML5 + CSS3 + Vanilla JavaScript
- **无框架依赖**：零构建步骤，直接运行
- **数据持久化**：localStorage
- **路由**：自定义 Hash Router
- **部署**：GitHub Pages

---

## 迭代计划

- [ ] AI 大模型接入：自然语言描述需求即可生成方案
- [ ] 电商订单导入：自动识别已有智能设备
- [ ] 推荐算法优化：基于用户行为持续学习
- [ ] 场景包动态调整：搬家、装修升级时自动适配

---

## 致谢

本作品由 [TRAE Work](https://trae.ai) 辅助创作完成。

---

## License

MIT
