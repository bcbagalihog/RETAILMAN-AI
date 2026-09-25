/**
 * RETAILMAN AI — Meta Social Hub & Muse AI Module (`window.App.MetaHub`)
 */
window.App = window.App || {};

window.App.MetaHub = {
  /**
   * Render Meta Social Hub View
   */
  async render() {
    const metaCatalog = window.App.state.metaCatalog || {};
    const socialPosts = window.App.state.socialPosts || [];
    const products = window.App.state.products || [];

    // Pagination (Max 20 Posts per page to avoid lag)
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(socialPosts.length / PAGE_SIZE) || 1;
    let currentPage = window.App.state.metaHubPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    window.App.state.metaHubPage = currentPage;

    const pagePosts = socialPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return `
      <div class="card-panel">
        <!-- Header Banner -->
        <div class="panel-header">
          <div class="panel-title">
            <i class="ph-bold ph-facebook-logo" style="color:var(--fb-blue);"></i> Meta Social Commerce Hub
          </div>
          <button class="btn-primary-blue" onclick="window.App.MetaHub.simulateFbAuth()">
            <i class="ph-bold ph-user-check"></i> 1-Tap FB Connected
          </button>
        </div>

        <!-- SaaS Facebook Connection Status Card -->
        <div style="background:var(--bg-surface); border:2px solid var(--fb-blue); border-radius:12px; padding:12px; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; box-shadow:3px 3px 0px #000;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:48px; height:48px; background:var(--fb-blue); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:1.6rem; border:2px solid #000;">
              <i class="ph-bold ph-storefront"></i>
            </div>
            <div>
              <div style="font-weight:900; font-size:1rem;">${metaCatalog.page_name || 'RetailMan Official Store'}</div>
              <div style="font-size:0.75rem; color:var(--emerald); font-weight:bold;">
                ● Facebook Page & Meta Commerce Catalog Connected
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <span style="background:rgba(0,210,106,0.15); border:1px solid var(--emerald); color:var(--emerald); font-weight:800; font-size:0.7rem; padding:4px 8px; border-radius:6px;">
              MUSE AI READY
            </span>
          </div>
        </div>

        <!-- AI Post Copilot & Facebook Album Sync Bar -->
        <div style="display:flex; gap:10px; margin-bottom:1rem;">
          <button class="btn-emerald" style="flex:1; justify-content:center;" onclick="window.App.MetaHub.openAiPostModal()">
            <i class="ph-bold ph-sparkle"></i> Generate AI FB Caption Post
          </button>
          <button class="btn-primary-blue" style="justify-content:center;" onclick="window.App.MetaHub.importFbAlbum()">
            <i class="ph-bold ph-cloud-arrow-down"></i> Import FB Album
          </button>
        </div>

        <!-- Social Posts Stream -->
        <div style="margin-top:1rem;">
          <h4 style="font-family:var(--font-heading); font-size:1rem; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
            <i class="ph-bold ph-article" style="color:var(--fb-blue);"></i> Published Facebook Posts & AI Captions
          </h4>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${pagePosts.map(post => `
              <div style="background:var(--bg-surface); border:2px solid var(--border-color); border-radius:12px; padding:12px; box-shadow:2px 2px 0px #000;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:800; color:var(--fb-blue); font-size:0.85rem;">${post.product_name}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p style="font-size:0.85rem; color:#DDD; line-height:1.4; background:var(--bg-input); padding:8px; border-radius:8px; border:1px solid #222; font-family:var(--font-main);">
                  ${post.caption}
                </p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:0.75rem; color:var(--text-muted);">
                  <span>Album: <strong>${post.fb_album || 'Store Catalog'}</strong></span>
                  <div style="display:flex; gap:10px; font-weight:bold;">
                    <span>👍 ${post.likes}</span>
                    <span>💬 ${post.comments}</span>
                    <span>🔄 ${post.shares}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- MetaHub Pagination Bar (20 Posts Limit) -->
          ${totalPages > 1 ? `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding:10px; background:var(--bg-surface); border:2px solid var(--border-color); border-radius:10px; box-shadow:2px 2px 0px #000;">
              <button class="cat-pill" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.MetaHub.changePage(${currentPage - 1})">
                ◀ Prev Page
              </button>
              <span style="font-size:0.8rem; font-weight:bold; font-family:var(--font-mono); color:var(--text-muted);">
                Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> (${socialPosts.length} Posts)
              </span>
              <button class="cat-pill" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.MetaHub.changePage(${currentPage + 1})">
                Next Page ▶
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  bindEvents() {},

  changePage(newPage) {
    window.App.state.metaHubPage = newPage;
    window.App.router.navigate('metahub');
  },

  simulateFbAuth() {
    const html = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="background:var(--bg-input); border:2px solid var(--fb-blue); border-radius:10px; padding:12px; display:flex; align-items:center; gap:12px;">
          <i class="ph-bold ph-facebook-logo" style="font-size:2.4rem; color:var(--fb-blue);"></i>
          <div>
            <div style="font-weight:900; font-size:1rem;">Meta Social Commerce Integration</div>
            <div style="font-size:0.8rem; color:var(--emerald); font-weight:bold;">Status: Active & Authorized (1-Tap OAuth)</div>
          </div>
        </div>

        <div style="font-size:0.85rem; color:#DDD; line-height:1.5;">
          <strong>What is 1-Tap FB Connected?</strong><br>
          This is RETAILMAN AI's 1-Click Meta OAuth authorization engine. It connects your store directly with Meta Commerce & Facebook Pages.
        </div>

        <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:10px; font-size:0.8rem; display:flex; flex-direction:column; gap:8px;">
          <div>⚡ <strong>1. Live Commerce Catalog Sync:</strong> Products marked as "Publish to FB Catalog" in Inventory sync automatically to your Facebook Shop & Instagram Shopping catalog.</div>
          <div>✨ <strong>2. Muse AI Social Copilot:</strong> Generates marketing captions and posts product photos directly to your Facebook Page Albums.</div>
          <div>📱 <strong>3. Messenger Customer Commerce:</strong> Enables instant digital receipt sending and checkout links in Facebook Messenger chats.</div>
        </div>

        <div style="display:flex; gap:8px; margin-top:6px;">
          <button class="btn-primary-blue" style="flex:1; justify-content:center;" onclick="window.App.toast('🔄 Facebook Token refreshed & catalog verified!', 'success'); window.App.closeModal();">
            <i class="ph-bold ph-arrows-clockwise"></i> Refresh Token
          </button>
          <button class="btn-emerald" style="flex:1; justify-content:center;" onclick="window.App.closeModal();">
            <i class="ph-bold ph-check"></i> Close
          </button>
        </div>
      </div>
    `;
    window.App.openModal('🔵 Meta 1-Tap FB Connection Details', html);
  },

  importFbAlbum() {
    window.App.toast('Importing photo album "New Stock Arrivals 2026" from Facebook Page...', 'info');
    setTimeout(() => {
      window.App.toast('Imported 3 new products from Facebook Album!', 'success');
    }, 1200);
  },

  openAiPostModal() {
    const products = window.App.state.products || [];
    
    const html = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">Select Product to Post:</label>
        <select id="ai-post-product-id" style="width:100%; padding:10px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
          ${products.map(p => `
            <option value="${p.id}">${p.name} — ₱${p.retail_price.toLocaleString()}</option>
          `).join('')}
        </select>

        <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">Target Facebook Page Album:</label>
        <select id="ai-post-album" style="width:100%; padding:10px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
          <option value="New Stock Arrivals 2026">Album: New Stock Arrivals 2026</option>
          <option value="Official Store Catalog">Album: Official Store Catalog</option>
          <option value="Flash Sale Promo">Album: Flash Sale Promo</option>
        </select>

        <button class="btn-emerald" style="justify-content:center; padding:12px; margin-top:8px;" onclick="window.App.MetaHub.generateAiPost()">
          <i class="ph-bold ph-sparkle"></i> GENERATE CAPTION & POST TO FACEBOOK
        </button>
      </div>
    `;

    window.App.openModal('✨ RetailMan AI Post Copilot', html);
  },

  async generateAiPost() {
    const prodSelect = document.getElementById('ai-post-product-id');
    const albumSelect = document.getElementById('ai-post-album');
    
    if (!prodSelect) return;
    const productId = prodSelect.value;
    const fbAlbum = albumSelect ? albumSelect.value : 'New Stock Arrivals 2026';

    window.App.toast('AI Copilot generating Facebook caption...', 'info');
    const res = await window.App.API.generateAiPost(productId, fbAlbum);

    if (res.success) {
      window.App.toast('Published Facebook Post & Album Entry!', 'success');
      await window.App.refreshData();
      window.App.closeModal();
      window.App.router.navigate('metahub');
    } else {
      window.App.toast(`Generation error: ${res.message}`, 'error');
    }
  }
};
