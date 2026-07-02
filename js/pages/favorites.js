/**
 * 智家清单 - 场景收藏页
 */
const FavoritesPage = {
  render() {
    const container = document.getElementById('page-content');
    const favorites = store.getFavorites();

    // Combine scene favorites and community favorites
    const sceneFavs = favorites.map(id => {
      const scene = Scenarios.find(s => s.id === id);
      if (scene) return { ...scene, source: 'scene' };
      const community = CommunityScenarios.find(s => s.id === id);
      if (community) return { ...community, source: 'community' };
      return null;
    }).filter(Boolean);

    container.innerHTML = `
      <div class="page favorites-page">
        <div class="page-sub-header">
          <h1>我的收藏</h1>
          <span class="fav-count">${sceneFavs.length}个场景</span>
        </div>

        ${sceneFavs.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            <h2>还没有收藏</h2>
            <p>去场景体验和场景广场浏览，收藏你喜欢的方案</p>
            <button class="btn btn-primary" onclick="router.navigate('square')">去广场看看</button>
          </div>
        ` : `
          <div class="fav-list">
            ${sceneFavs.map(item => `
              <div class="fav-card" onclick="router.navigate('${item.source === 'scene' ? 'scene' : 'square'}', {id: '${item.id}'})">
                <div class="fav-card-header">
                  <h3>${item.name || item.title}</h3>
                  <button class="btn btn-text btn-sm" onclick="event.stopPropagation(); FavoritesPage.removeFav('${item.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <p class="fav-desc">${item.description}</p>
                ${item.tags ? `<div class="fav-tags">${item.tags.slice(0, 3).map(t => `<span class="mini-tag">${t}</span>`).join('')}</div>` : ''}
                <div class="fav-source">${item.source === 'scene' ? '场景体验' : '场景广场'}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  removeFav(id) {
    store.toggleFavorite(id);
    this.render();
  }
};
