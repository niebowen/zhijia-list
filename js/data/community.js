// community.js 内容已合并到 scenarios.js 中
// 此文件保留为导出接口
const CommunityData = {
  scenarios: typeof CommunityScenarios !== 'undefined' ? CommunityScenarios : [],
  getScenarioById(id) {
    return this.scenarios.find(s => s.id === id);
  },
  getScenariosByTag(tag) {
    return this.scenarios.filter(s => s.tags.includes(tag));
  }
};
