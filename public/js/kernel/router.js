/**
 * RETAILMAN AI — Single Page Application (SPA) Router
 */
window.App = window.App || {};

window.App.router = {
  init() {
    this.navigate(window.App.state.activeTab || 'pos');
  },

  /**
   * Navigate to a tab module
   * @param {string} tab - 'pos' | 'inventory' | 'metahub' | 'billing' | 'customers'
   */
  async navigate(tab) {
    window.App.state.activeTab = tab;

    // Update bottom nav tab CSS active states
    document.querySelectorAll('.nav-tab').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Control Sticky Cart Dock Visibility (Only show on POS tab when cart has items)
    const dock = document.getElementById('pos-sticky-dock');
    if (tab === 'pos' && window.App.state.cart.length > 0) {
      dock.classList.remove('hidden');
    } else {
      dock.classList.add('hidden');
    }

    // Refresh state data and render target module view
    const mainContainer = document.getElementById('main-content');
    
    switch (tab) {
      case 'pos':
        if (window.App.POS) {
          mainContainer.innerHTML = await window.App.POS.render();
          window.App.POS.bindEvents();
        }
        break;

      case 'inventory':
        if (window.App.Inventory) {
          mainContainer.innerHTML = await window.App.Inventory.render();
          window.App.Inventory.bindEvents();
        }
        break;

      case 'metahub':
        if (window.App.MetaHub) {
          mainContainer.innerHTML = await window.App.MetaHub.render();
          window.App.MetaHub.bindEvents();
        }
        break;

      case 'billing':
        if (window.App.Billing) {
          mainContainer.innerHTML = await window.App.Billing.render();
          window.App.Billing.bindEvents();
        }
        break;

      case 'customers':
        if (window.App.Directory) {
          mainContainer.innerHTML = await window.App.Directory.render();
          window.App.Directory.bindEvents();
        }
        break;

      default:
        mainContainer.innerHTML = `<h2>Module Not Found</h2>`;
    }

    window.scrollTo(0, 0);
  }
};
