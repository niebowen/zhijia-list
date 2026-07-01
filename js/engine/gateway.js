/**
 * 智家清单 - 网关依赖检测
 * 检查方案中产品的网关需求，推荐必要网关
 */
class GatewayChecker {
  constructor(productsDB) {
    this.products = productsDB;
    // 所有可用的网关产品
    this.gateways = this.products.filter(p => p.category === 'gateway');
  }

  /**
   * 检查方案网关依赖
   * @param {Array} productList - 方案中的产品列表
   * @returns {Object} { warnings, requiredGateways, sufficient }
   */
  check(productList) {
    const requiredTypes = new Set();
    const warnings = [];

    productList.forEach(product => {
      if (product.needGateway && product.gatewayType !== 'none') {
        requiredTypes.add(product.gatewayType);
      }
    });

    // 检查方案中是否已包含网关
    const hasGatewayInPlan = productList.some(p => p.category === 'gateway');

    const result = {
      warnings: [],
      requiredGateways: [],
      productsNeedingGateway: productList.filter(p => p.needGateway && p.gatewayType !== 'none'),
      sufficient: false
    };

    if (requiredTypes.size === 0) {
      result.sufficient = true;
      result.message = '本方案所有设备均可Wi-Fi直连，无需额外网关';
      return result;
    }

    // 推荐网关
    if (requiredTypes.has('zigbee')) {
      const zigbeeGateway = this.gateways.find(g =>
        g.protocols.includes('Zigbee')
      ) || this.gateways[0];
      result.requiredGateways.push({
        type: 'zigbee',
        label: 'Zigbee网关',
        product: zigbeeGateway,
        reason: '方案中的传感器、开关等Zigbee设备需要Zigbee网关连接'
      });
      if (!hasGatewayInPlan) {
        result.warnings.push(`方案中有${result.productsNeedingGateway.filter(p => p.gatewayType === 'zigbee').length}款设备需要Zigbee网关，请确认已购买`);
      }
    }

    if (requiredTypes.has('bluetooth') && !hasGatewayInPlan) {
      const bleGateway = this.gateways.find(g =>
        g.protocols.includes('蓝牙') || g.protocols.includes('蓝牙Mesh')
      );
      if (bleGateway) {
        result.requiredGateways.push({
          type: 'bluetooth',
          label: '蓝牙Mesh网关',
          product: bleGateway,
          reason: '方案中的蓝牙Mesh设备需要蓝牙网关或带网关功能的音箱'
        });
      }
      result.warnings.push(`方案中有${result.productsNeedingGateway.filter(p => p.gatewayType === 'bluetooth').length}款蓝牙设备，需蓝牙网关(小爱音箱也可充当)`);
    }

    if (requiredTypes.has('multi')) {
      const multiGateway = this.gateways.find(g =>
        g.protocols.includes('Zigbee') && g.protocols.includes('蓝牙')
      ) || this.gateways.find(g => g.id === 'spk001');
      result.requiredGateways.push({
        type: 'multi',
        label: '多功能网关/智能音箱',
        product: multiGateway,
        reason: '建议使用带多协议支持的智能音箱作为中枢'
      });
    }

    if (hasGatewayInPlan) {
      result.sufficient = true;
    }

    return result;
  }

  /**
   * 获取产品网关描述
   * @param {Object} product
   * @returns {string}
   */
  getGatewayDescription(product) {
    if (!product.needGateway) {
      return 'Wi-Fi直连，无需额外网关';
    }
    switch (product.gatewayType) {
      case 'zigbee':
        return '需要Zigbee网关（如米家多功能网关、Aqara Hub）';
      case 'bluetooth':
        return '需要蓝牙Mesh网关（小爱音箱、米家智能插座2均可充当）';
      case 'multi':
        return '需要多协议网关（推荐小爱音箱Pro）';
      default:
        return '需要网关设备';
    }
  }
}
