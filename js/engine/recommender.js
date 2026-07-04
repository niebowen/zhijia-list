/**
 * 智家清单 - 推荐规则引擎 (场景包模式)
 * 根据用户问卷结果匹配产品，生成场景化方案
 */

const RecommendRuleConfig = {
  // 场景包配置
  bundles: [
    {
      id: 'gateway',
      name: '网关基础包',
      description: '智能设备的中枢，所有方案的基础',
      weight: 100,
      basePriority: 'required',
      // 用户选择时加分项
      boost: { any: 100 },
      products: ['gateway']
    },
    {
      id: 'lighting',
      name: '灯光氛围包',
      description: '筒射灯+灯带组合消除暗区，色温亮度分段调节，一键切换阅读/观影/夜间模式',
      weight: 80,
      basePriority: 'recommended',
      boost: { scenarios: { home: 30, comfort: 20 }, members: { self: 10 } },
      products: ['light_bulb', 'light_strip', 'downlight', 'switch_wall']
    },
    {
      id: 'curtain',
      name: '窗帘智能包',
      description: '定时开合，语音控制',
      weight: 50,
      basePriority: 'optional',
      boost: { scenarios: { comfort: 30 }, members: { pet: 10 } },
      products: ['curtain_motor']
    },
    {
      id: 'security',
      name: '安防安心包',
      description: '门锁、监控、报警，守护安全',
      weight: 70,
      basePriority: 'recommended',
      boost: { scenarios: { security: 40 }, members: { child: 20, elderly: 15 }, houseType: { rent: 10 } },
      products: ['lock', 'camera', 'sensor_door']
    },
    {
      id: 'sensor',
      name: '感应自动化包',
      description: '人来灯亮人走灯灭，毫米波人在传感器精准检测，卫生间走廊自动感应',
      weight: 60,
      basePriority: 'recommended',
      boost: { scenarios: { home: 25, comfort: 15 }, members: { elderly: 10, self: 10 } },
      products: ['sensor_body', 'sensor_door', 'sensor_smoke']
    },
    {
      id: 'climate',
      name: '环境舒适包',
      description: '恒温恒湿，空气优化',
      weight: 40,
      basePriority: 'optional',
      boost: { scenarios: { comfort: 35 } },
      products: ['ac_controller', 'air_purifier']
    },
    {
      id: 'pet',
      name: '宠物看护包',
      description: '远程投喂，实时查看',
      weight: 30,
      basePriority: 'optional',
      boost: { members: { pet: 50 } },
      products: ['pet_feeder', 'camera']
    },
    {
      id: 'chores',
      name: '轻松家务包',
      description: '扫地洗碗自动化，解放双手',
      weight: 35,
      basePriority: 'optional',
      boost: { scenarios: { chores: 40 } },
      products: ['vacuum', 'dishwasher']
    }
  ],

  // 品类标签映射
  categoryTags: {
    gateway: ['zigbee', 'wifi', 'bluetooth'],
    light: ['e27', 'gu10', 'strip', 'panel', 'bedside'],
    switch: ['single', 'dual', 'scene', 'wireless'],
    sensor: ['body', 'door', 'smoke', 'gas', 'water', 'presence'],
    lock: ['fingerprint', 'face', 'password'],
    camera: ['indoor', 'outdoor', 'doorbell'],
    climate: ['ac', 'purifier', 'heater', 'dehumidifier'],
    curtain: ['motor', 'track'],
    appliance: ['vacuum', 'washer', 'dryer', 'dishwasher'],
    pet: ['feeder', 'water', 'litter', 'camera']
  }
};

// 产品ID -> 品类映射
const ProductCategoryMap = {
  gateway: '网关',
  light_bulb: '灯光',
  light_strip: '灯光',
  downlight: '灯光',
  switch_wall: '开关',
  switch_wireless: '开关',
  curtain_motor: '窗帘',
  sensor_body: '传感器',
  sensor_door: '传感器',
  sensor_smoke: '传感器',
  sensor_gas: '传感器',
  sensor_water: '传感器',
  sensor_presence: '传感器',
  lock: '门锁',
  camera: '摄像头',
  camera_outdoor: '摄像头',
  doorbell: '摄像头',
  ac_controller: '家电',
  air_purifier: '家电',
  heater: '家电',
  dehumidifier: '家电',
  humidifier: '家电',
  water_purifier: '家电',
  fresh_air: '家电',
  smart_plug: '家电',
  pet_feeder: '宠物',
  pet_water: '宠物',
  vacuum: '家电',
  washer: '家电',
  dishwasher: '家电',
  dryer: '家电',
  plug: '插座',
  smart_speaker: '音箱',
  router_mesh: '网络'
};

/**
 * 住房类型 -> 产品品类替换映射
 * 在 _buildBundle 中，根据 houseType 替换 bundleConfig.products 中的 productId
 */
var houseTypeProductSwap = {
  rent: {
    // 租房：墙壁开关替换为无线开关（随意贴，不需要拆墙）
    switch_wall: 'switch_wireless'
  },
  renovate: {
    // 改造：保持原有品类，不替换
  },
  new: {
    // 新装修：保持原有品类，不替换
  }
};

/**
 * 成员组合效应配置
 * 某些成员组合在一起时，会对特定场景包产生额外加分
 */
var memberCombinations = {
  'elderly+child': { bundle: 'security', boost: 20 },
  'elderly+pet': { bundle: 'sensor', boost: 10 }
};

class Recommender {
  constructor(products) {
    this.products = products;
    this.gateway = new GatewayChecker(products);
  }

  generate(userAnswers) {
    var platform = userAnswers.platform;
    var houseType = userAnswers.houseType;
    var members = userAnswers.members;
    var scenarios = userAnswers.scenarios || [];
    var rooms = userAnswers.rooms;
    var painPoints = userAnswers.painPoints || [];

    var result = {
      bundles: [],
      totalCost: 0,
      platforms: [platform],
      painPoints: painPoints,
      rooms: rooms || null,
      userAnswers: userAnswers
    };

    // 计算场景包权重
    var bundleWeights = this._calculateBundleWeights(userAnswers);

    // 根据权重排序，选出前5个场景包
    var topBundles = bundleWeights
      .sort(function(a, b) { return b.weight - a.weight; })
      .slice(0, 5);

    // 为每个场景包选择产品
    var selectedProductIds = new Set();

    topBundles.forEach(function(bundleConfig) {
      var bundle = this._buildBundle(
        bundleConfig,
        platform,
        houseType,
        members,
        scenarios,
        selectedProductIds,
        userAnswers
      );
      result.bundles.push(bundle);
      bundle.products.forEach(function(p) { selectedProductIds.add(p.id); });
    }.bind(this));

    // 检查网关依赖
    var gatewayCheck = this.gateway.check(Array.from(selectedProductIds).map(function(id) { return this._findProduct(id); }.bind(this)));
    if (gatewayCheck.needsGateway) {
      // 确保网关基础包在前面
      var gatewayBundle = result.bundles.find(function(b) { return b.id === 'gateway'; });
      if (gatewayBundle) {
        gatewayBundle.priority = 'required';
        if (gatewayCheck.gatewayId) {
          var gw = this._findProduct(gatewayCheck.gatewayId);
          if (gw && !gatewayBundle.products.find(function(p) { return p.id === gw.id; })) {
            gatewayBundle.products.unshift({
              name: gw.name,
              id: gw.id,
              price: gw.price,
              category: gw.category,
              platforms: gw.platforms,
              quantity: 1,
              reason: '满足设备网关依赖'
            });
          }
        }
      }
    }

    // 计算总费用
    result.totalCost = result.bundles.reduce(function(sum, b) { return sum + b.subtotal; }, 0);

    // 根据painPoints和rooms生成解释
    result.explanations = this._generateExplanations(userAnswers, result.bundles);

    return result;
  }

  _calculateBundleWeights(userAnswers) {
    var scenarios = userAnswers.scenarios || [];
    var members = userAnswers.members || [];
    var houseType = userAnswers.houseType;
    var painPoints = userAnswers.painPoints || [];

    return RecommendRuleConfig.bundles.map(function(bundle) {
      var weight = bundle.weight;

      // 场景偏好加分
      if (bundle.boost && bundle.boost.scenarios) {
        scenarios.forEach(function(s) {
          if (bundle.boost.scenarios[s]) {
            weight += bundle.boost.scenarios[s];
          }
        });
      }

      // 家庭成员加分
      if (bundle.boost && bundle.boost.members) {
        members.forEach(function(m) {
          if (bundle.boost.members[m]) {
            weight += bundle.boost.members[m];
          }
        });
      }

      // 住房类型加分
      if (bundle.boost && bundle.boost.houseType && bundle.boost.houseType[houseType]) {
        weight += bundle.boost.houseType[houseType];
      }

      // 成员组合效应加分
      if (members.length >= 2) {
        // 遍历所有两两组合
        for (var i = 0; i < members.length; i++) {
          for (var j = i + 1; j < members.length; j++) {
            var comboKey = members[i] + '+' + members[j];
            var reverseKey = members[j] + '+' + members[i];
            var combo = memberCombinations[comboKey] || memberCombinations[reverseKey];
            if (combo && bundle.id === combo.bundle) {
              weight += combo.boost;
            }
          }
        }
      }

      // 痛点权重调整
      if (painPoints.length > 0) {
        var painMap = {
          'forget-light': { bundle: 'lighting', boost: 30 },
          'elderly-safety': { bundle: 'security', boost: 40 },
          'auto-entry': { bundle: 'lighting', boost: 30 },
          'pet-monitor': { bundle: 'pet', boost: 50 },
          'ritual': { bundle: 'lighting', boost: 20 }
        };
        painPoints.forEach(function(pp) {
          if (painMap[pp] && bundle.id === painMap[pp].bundle) {
            weight += painMap[pp].boost;
          }
          // auto-entry also boosts sensor
          if (pp === 'auto-entry' && bundle.id === 'sensor') {
            weight += 30;
          }
          // ritual also boosts curtain
          if (pp === 'ritual' && bundle.id === 'curtain') {
            weight += 20;
          }
        });
      }

      return {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        weight: bundle.weight,
        basePriority: bundle.basePriority,
        boost: bundle.boost,
        products: bundle.products,
        calculatedWeight: weight
      };
    });
  }

  _buildBundle(bundleConfig, platform, houseType, members, scenarios, selectedIds, userAnswers) {
    var self = this;
    var bundle = {
      id: bundleConfig.id,
      name: bundleConfig.name,
      description: bundleConfig.description,
      priority: bundleConfig.basePriority,
      products: [],
      subtotal: 0,
      tags: []
    };

    var rooms = userAnswers.rooms || {};
    var painPoints = userAnswers.painPoints || [];

    // 通用产品名称映射到品类（当精确id找不到时按品类匹配）
    var categoryMap = {
      gateway: 'gateway',
      light_bulb: 'light',
      light_strip: 'light',
      downlight: 'light',
      switch_wall: 'switch',
      switch_wireless: 'switch',
      curtain_motor: 'curtain',
      lock: 'lock',
      camera: 'camera',
      sensor_door: 'sensor',
      sensor_body: 'sensor',
      sensor_smoke: 'sensor',
      sensor_presence: 'sensor'
    };

    /**
     * 住房类型灯光品类优先级映射
     * 根据住房类型调整灯光类产品的推荐优先级
     * - rent: 优先推荐 light_bulb（螺口灯泡即插即用），不推荐 ceiling_light（需要拆灯盘）
     * - renovate: 推荐 light_bulb + light_strip（筒射灯需要吊顶，改造房可能没有）
     * - new: 增加 downlight（筒射灯，需要吊顶配合）
     */
    var lightPreference = {
      rent: { prefer: ['light_bulb'], skip: ['ceiling_light', 'downlight'] },
      renovate: { prefer: ['light_bulb', 'light_strip'], skip: ['downlight'] },
      new: { prefer: ['light_bulb', 'light_strip', 'downlight'], skip: [] }
    };

    // 收集所有候选产品（含平台排序）
    var candidates = [];

    bundleConfig.products.forEach(function(productId) {
      // 住房类型品类替换
      var actualProductId = productId;
      if (houseType && houseTypeProductSwap[houseType] && houseTypeProductSwap[houseType][productId]) {
        actualProductId = houseTypeProductSwap[houseType][productId];
      }

      // 租房灯光优先级过滤
      if (houseType && lightPreference[houseType]) {
        var pref = lightPreference[houseType];
        if (pref.skip && pref.skip.indexOf(actualProductId) !== -1) {
          return; // 跳过不推荐的灯光品类
        }
      }

      var product = self._findProduct(actualProductId);

      // 如果精确id找不到，尝试按通用名称映射到品类查找
      if (!product && categoryMap[actualProductId]) {
        product = self.products.find(function(p) {
          return p.category === categoryMap[actualProductId] &&
            (p.platforms.indexOf(platform) !== -1 || p.platforms.indexOf('universal') !== -1) &&
            !selectedIds.has(p.id) &&
            !candidates.find(function(c) { return c.id === p.id; });
        });
      }

      if (!product) return;

      // 平台过滤
      if (Array.isArray(product.platforms)) {
        if (product.platforms.indexOf(platform) === -1 && product.platforms.indexOf('universal') === -1) {
          return;
        }
      }

      // 租房场景过滤改造型产品
      if (houseType === 'rent' && product.installDifficulty > 2) {
        return;
      }

      // 避免重复添加
      if (selectedIds.has(product.id)) {
        return;
      }

      // 平台排序优先级：用户选的平台排在前面
      var platformPriority = 0;
      if (Array.isArray(product.platforms)) {
        if (product.platforms.indexOf(platform) !== -1) {
          platformPriority = 2; // 精确匹配平台
        } else if (product.platforms.indexOf('universal') !== -1) {
          platformPriority = 1; // 通用兼容
        }
      }

      candidates.push({
        product: product,
        productId: actualProductId,
        originalProductId: productId,
        platformPriority: platformPriority
      });
    });

    // 按平台优先级排序（精确匹配平台排前面）
    candidates.sort(function(a, b) {
      return b.platformPriority - a.platformPriority;
    });

    // 构建最终产品列表
    candidates.forEach(function(candidate) {
      var product = candidate.product;
      var productId = candidate.productId;

      // 避免候选列表内部的重复
      if (bundle.products.find(function(bp) { return bp.id === product.id; })) {
        return;
      }

      // 根据房间数计算推荐数量
      var quantity = self._calculateQuantity(product, productId, rooms, bundleConfig.id, userAnswers);

      if (quantity > 0) {
        var item = {
          name: product.name,
          id: product.id,
          price: product.price,
          category: product.category,
          platforms: product.platforms,
          quantity: quantity,
          reason: self._getProductReason(product, productId, members, scenarios, painPoints, houseType, candidate.originalProductId)
        };
        bundle.products.push(item);
        bundle.subtotal += product.price * quantity;
      }
    });

    // 空包处理：过滤后场景包产品数量为0时，标记空包
    if (bundle.products.length === 0) {
      bundle.empty = true;
      bundle.emptyReason = '当前平台暂无兼容产品';
    }

    // 添加标签
    if (bundleConfig.id === 'gateway') {
      bundle.tags.push('必需基础');
    }
    if (members && members.indexOf('elderly') !== -1 && ['security', 'sensor'].indexOf(bundleConfig.id) !== -1) {
      bundle.tags.push('老人关怀');
    }
    if (members && members.indexOf('pet') !== -1 && bundleConfig.id === 'pet') {
      bundle.tags.push('宠物看护');
    }

    // 如果用户痛点直接匹配，提升为 required
    var requiredPainBundles = {
      'forget-light': ['lighting', 'sensor'],
      'elderly-safety': ['security', 'sensor'],
      'auto-entry': ['lighting', 'sensor'],
      'pet-monitor': ['pet']
    };
    painPoints.forEach(function(pp) {
      if (requiredPainBundles[pp] && requiredPainBundles[pp].indexOf(bundleConfig.id) !== -1) {
        bundle.priority = 'required';
      }
    });

    return bundle;
  }

  _calculateQuantity(product, productId, rooms, bundleId, userAnswers) {
    var r = {
      bedrooms: (rooms && rooms.bedrooms) || 3,
      livingRooms: (rooms && rooms.livingRooms) || 1
    };
    var totalRooms = r.bedrooms + r.livingRooms;

    // 灯泡：卧室每室1个，客厅每室1个主灯（不再 x2）
    if (productId === 'light_bulb') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 墙壁开关
    if (productId === 'switch_wall') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 无线开关（随意贴）
    if (productId === 'switch_wireless') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 窗帘电机
    if (productId === 'curtain_motor') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 人体传感器
    if (productId === 'sensor_body') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 门磁传感器
    if (productId === 'sensor_door') {
      return r.bedrooms * 1 + r.livingRooms * 1;
    }

    // 筒射灯：客厅1-2个（按livingRooms算）
    if (productId === 'downlight') {
      return Math.min(Math.max(r.livingRooms, 1), 2);
    }

    // 灯带默认1条
    if (productId === 'light_strip') {
      return 1;
    }

    // 网关：总房间数 >= 5 时设为2，否则1
    if (productId === 'gateway') {
      return totalRooms >= 5 ? 2 : 1;
    }

    // 扫拖机器人默认1个
    if (productId === 'vacuum') {
      return 1;
    }

    // 洗碗机默认1个
    if (productId === 'dishwasher') {
      return 1;
    }

    // 其余默认1个
    return 1;
  }

  _findProduct(id) {
    return this.products.find(function(p) { return p.id === id; });
  }

  _getProductReason(product, productId, members, scenarios, painPoints, houseType, originalProductId) {
    var reasons = [];
    members = members || [];
    scenarios = scenarios || [];
    painPoints = painPoints || [];

    // 平台匹配
    if (Array.isArray(product.platforms) && product.platforms.indexOf('universal') === -1) {
      var platformNames = { mijia: '米家', apple: '苹果HomeKit', huawei: '华为HiLink' };
      var name = product.platforms.map(function(p) { return platformNames[p] || p; }).join(' / ');
      reasons.push('匹配' + name + '平台');
    }

    // 家庭成员相关
    if (members.indexOf('elderly') !== -1 && product.category === 'sensor') {
      reasons.push('老人安全监测');
    }
    if (members.indexOf('child') !== -1 && product.category === 'lock') {
      reasons.push('儿童安全防护');
    }
    if (members.indexOf('pet') !== -1 && ['camera', 'pet'].indexOf(product.category) !== -1) {
      reasons.push('宠物看护');
    }

    // 场景偏好相关
    if (scenarios.indexOf('security') !== -1 && ['lock', 'camera', 'sensor'].indexOf(product.category) !== -1) {
      reasons.push('安全防护场景');
    }
    if (scenarios.indexOf('comfort') !== -1 && ['light', 'curtain', 'climate'].indexOf(product.category) !== -1) {
      reasons.push('舒适体验场景');
    }

    // 痛点相关
    if (painPoints.indexOf('forget-light') !== -1 && product.id === 'light_bulb') {
      reasons.push('解决忘关灯问题');
    }
    if (painPoints.indexOf('elderly-safety') !== -1 && ['sensor_body', 'sensor_smoke', 'lock'].indexOf(product.id) !== -1) {
      reasons.push('老人安全保障');
    }

    // 住房类型标注
    if (houseType === 'rent' && productId === 'switch_wireless') {
      reasons.push('无线随意贴，租房免拆墙');
    }
    if (houseType === 'rent' && productId === 'light_bulb') {
      reasons.push('螺口灯泡即插即用');
    }
    if (houseType === 'renovate' && (productId === 'switch_wall' || originalProductId === 'switch_wall')) {
      reasons.push('建议选单火版');
    }
    if (houseType === 'new' && (productId === 'switch_wall' || originalProductId === 'switch_wall')) {
      reasons.push('建议预埋零线');
    }

    return reasons.length > 0 ? reasons.join('，') : '智能设备推荐';
  }

  _generateExplanations(userAnswers, bundles) {
    var houseType = userAnswers.houseType;
    var members = userAnswers.members || [];
    var rooms = userAnswers.rooms;
    var painPoints = userAnswers.painPoints || [];
    var explanations = {};

    bundles.forEach(function(bundle) {
      var reasons = [];

      // 根据户型
      if (rooms) {
        var totalRooms = (rooms.bedrooms || 0) + (rooms.livingRooms || 0);
        if (totalRooms >= 5) {
          reasons.push('你的' + totalRooms + '个房间需要更完善的智能覆盖');
        }
      }

      // 根据住房类型
      if (houseType === 'rent') {
        reasons.push('因为你选择了租房，推荐即插即用型设备，无需改线');
      } else if (houseType === 'renovate') {
        reasons.push('改造房推荐兼容方案，尽量不破坏现有装修');
      } else if (houseType === 'new') {
        reasons.push('新装修可预埋，推荐完整方案');
      }

      // 根据家庭成员
      if (members.indexOf('elderly') !== -1 && ['security', 'sensor'].indexOf(bundle.id) !== -1) {
        reasons.push('因为你选择了有老人居住，推荐安防包保护家人安全');
      }
      if (members.indexOf('pet') !== -1 && bundle.id === 'pet') {
        reasons.push('因为你选择了有宠物，推荐宠物看护包');
      }
      if (members.indexOf('child') !== -1 && bundle.id === 'security') {
        reasons.push('有小孩的家庭更需要安全防护');
      }

      // 根据痛点
      if (painPoints.indexOf('forget-light') !== -1 && bundle.id === 'lighting') {
        reasons.push('因为你经常忘关灯，灯光包帮你自动管理');
      }
      if (painPoints.indexOf('elderly-safety') !== -1 && bundle.id === 'security') {
        reasons.push('因为你担心老人安全，安防包给你安心保障');
      }
      if (painPoints.indexOf('pet-monitor') !== -1 && bundle.id === 'pet') {
        reasons.push('因为想远程看宠物，推荐宠物看护设备');
      }
      if (painPoints.indexOf('auto-entry') !== -1 && bundle.id === 'sensor') {
        reasons.push('因为你想进门自动开灯，感应包实现自动化');
      }
      if (painPoints.indexOf('ritual') !== -1 && ['lighting', 'curtain'].indexOf(bundle.id) !== -1) {
        reasons.push('因为想提升生活仪式感，推荐灯光和氛围设备');
      }
      if (painPoints.indexOf('sweep') !== -1 && bundle.id === 'chores') {
        reasons.push('因为你不想扫地拖地，推荐扫拖机器人解放双手');
      }
      if (painPoints.indexOf('dish') !== -1 && bundle.id === 'chores') {
        reasons.push('因为你不想洗碗，推荐智能洗碗机');
      }

      // 默认解释
      if (reasons.length === 0) {
        reasons.push('根据你的整体画像推荐');
      }

      explanations[bundle.id] = reasons.join('；');
    });

    return explanations;
  }
}

// 导出兼容（CommonJS环境，不依赖ES Module）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Recommender: Recommender, RecommendRuleConfig: RecommendRuleConfig };
}
