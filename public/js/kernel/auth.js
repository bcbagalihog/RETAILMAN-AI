/**
 * RETAILMAN AI — User Authentication & Session Kernel (`window.App.auth`)
 */
(function() {
  window.App = window.App || {};

  window.App.auth = {
    tokenKey: 'retailman_jwt_token',
    userKey: 'retailman_user_profile',

    init: function() {
      const token = this.getToken();
      if (token) {
        this.fetchProfile();
      }
    },

    getToken: function() {
      return localStorage.getItem(this.tokenKey);
    },

    getUser: function() {
      try {
        const u = localStorage.getItem(this.userKey);
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },

    saveSession: function(token, user) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
      if (window.App.subscription) {
        window.App.subscription.updateHeaderBadge(user.subscription);
      }
      this.closeModal();
      if (window.App.router && window.App.router.render) {
        window.App.router.render();
      }
    },

    logout: function() {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      window.location.reload();
    },

    fetchProfile: async function() {
      try {
        const res = await window.App.api.get('/api/auth/me');
        if (res && res.success && res.user) {
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          if (window.App.subscription) {
            window.App.subscription.updateHeaderBadge(res.user.subscription);
          }
        }
      } catch (err) {
        console.warn('Session verification failed');
      }
    },

    login: async function(email, password) {
      try {
        const res = await window.App.api.post('/api/auth/login', { email, password });
        if (res && res.success) {
          this.saveSession(res.token, res.user);
          if (window.App.showNotification) window.App.showNotification('Welcome back, ' + (res.user.storeName || 'Merchant') + '!', 'success');
          return true;
        } else {
          alert(res.message || 'Login failed.');
          return false;
        }
      } catch (err) {
        alert('Login error: ' + err.message);
        return false;
      }
    },

    register: async function(email, password, storeName) {
      try {
        const res = await window.App.api.post('/api/auth/register', { email, password, storeName });
        if (res && res.success) {
          this.saveSession(res.token, res.user);
          if (window.App.showNotification) window.App.showNotification('Account created successfully! Welcome to RETAILMAN AI.', 'success');
          return true;
        } else {
          alert(res.message || 'Registration failed.');
          return false;
        }
      } catch (err) {
        alert('Registration error: ' + err.message);
        return false;
      }
    },

    loginWithFacebook: async function() {
      try {
        const demoName = "Facebook Merchant " + Math.floor(100 + Math.random() * 900);
        const demoEmail = "fb_merchant_" + Date.now() + "@meta.com";
        const res = await window.App.api.post('/api/auth/facebook', { name: demoName, email: demoEmail, fb_token: "mock_fb_access_token_" + Date.now() });
        if (res && res.success) {
          this.saveSession(res.token, res.user);
          if (window.App.showNotification) window.App.showNotification('Successfully logged in with Facebook!', 'success');
          return true;
        } else {
          alert(res.message || 'Facebook login failed.');
        }
      } catch (err) {
        alert('Facebook Login Error: ' + err.message);
      }
    },

    openModal: function(view) {
      view = view || 'login';
      let modal = document.getElementById('auth-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      const isLogin = view === 'login';
      const user = this.getUser();

      if (user) {
        modal.innerHTML = `
          <div class="modal-card nb-card" style="max-width:440px; text-align:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
              <h3 style="margin:0; font-family:var(--font-heading); font-weight:900;"><i class="ph-bold ph-user-circle"></i> My Account</h3>
              <button onclick="window.App.auth.closeModal()" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <div style="background:rgba(255,255,255,0.05); padding:1.2rem; border-radius:12px; border:2px solid #000; margin-bottom:1.5rem; text-align:left;">
              <div style="font-size:1.2rem; font-weight:900; color:#fff; margin-bottom:0.2rem;">` + (user.storeName || 'My Retail Store') + `</div>
              <div style="font-size:0.85rem; color:#888; margin-bottom:0.8rem;">` + user.email + `</div>
              <div style="display:inline-block; background:rgba(8,102,255,0.25); color:#00E5FF; border:1.5px solid #0866FF; padding:3px 10px; border-radius:6px; font-weight:800; font-size:0.8rem;">
                ` + (user.subscription ? (user.subscription.plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN (50 Sales/mo)') : 'FREE PLAN') + `
              </div>
            </div>

            <div style="display:grid; gap:0.8rem;">
              <button onclick="window.App.subscription.openModal()" class="nb-btn primary" style="width:100%; font-weight:900;">
                <i class="ph-bold ph-crown"></i> Manage Subscription
              </button>
              <button onclick="window.App.auth.logout()" class="nb-btn danger" style="width:100%;">
                <i class="ph-bold ph-sign-out"></i> Log Out
              </button>
            </div>
          </div>
        `;
      } else {
        modal.innerHTML = `
          <div class="modal-card nb-card" style="max-width:440px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
              <h3 style="margin:0; font-family:var(--font-heading); font-weight:900; font-size:1.4rem;">
                ` + (isLogin ? '<i class="ph-bold ph-lock-key"></i> Merchant Login' : '<i class="ph-bold ph-user-plus"></i> Create Account') + `
              </h3>
              <button onclick="window.App.auth.closeModal()" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>

            <button type="button" onclick="window.App.auth.loginWithFacebook()" class="nb-btn" style="width:100%; height:48px; background:#1877F2; color:#fff; font-weight:800; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:0.6rem; border:2px solid #000; box-shadow:2.5px 2.5px 0px #000; border-radius:10px; margin-bottom:1.2rem;">
              <i class="ph-bold ph-facebook-logo" style="font-size:1.3rem;"></i> Log in with Facebook
            </button>

            <div style="margin-top:0.5rem; margin-bottom:1.2rem; text-align:center; position:relative;">
              <hr style="border:none; border-top:1px solid #333; margin:0.8rem 0;">
              <span style="position:absolute; top:-9px; left:50%; transform:translateX(-50%); background:#18191a; padding:0 8px; font-size:0.75rem; color:#888;">OR</span>
            </div>

            <form onsubmit="event.preventDefault(); ` + (isLogin ? 'window.App.auth.handleLoginSubmit()' : 'window.App.auth.handleRegisterSubmit()') + `">
              ` + (isLogin ? '' : `
                <div style="margin-bottom:1.2rem;">
                  <label style="display:block; font-size:0.85rem; font-weight:800; color:#aaa; margin-bottom:0.4rem;">STORE NAME</label>
                  <input type="text" id="auth-store-name" class="nb-input" placeholder="e.g. Main Retail Store" required style="width:100%; height:48px; padding:12px 14px; font-size:1rem; border-radius:10px;">
                </div>
              `) + `

              <div style="margin-bottom:1.2rem;">
                <label style="display:block; font-size:0.85rem; font-weight:800; color:#aaa; margin-bottom:0.4rem;">EMAIL ADDRESS</label>
                <input type="email" id="auth-email" class="nb-input" placeholder="merchant@store.com" required style="width:100%; height:48px; padding:12px 14px; font-size:1rem; border-radius:10px;">
              </div>

              <div style="margin-bottom:1.5rem;">
                <label style="display:block; font-size:0.85rem; font-weight:800; color:#aaa; margin-bottom:0.4rem;">PASSWORD</label>
                <input type="password" id="auth-password" class="nb-input" placeholder="••••••••" required style="width:100%; height:48px; padding:12px 14px; font-size:1rem; border-radius:10px;">
              </div>

              <button type="submit" class="nb-btn primary" style="width:100%; height:48px; font-weight:900; font-size:1.05rem; padding:0.8rem; border-radius:10px; margin-bottom:1rem;">
                ` + (isLogin ? 'Log In with Email' : 'Create Free Store Account') + `
              </button>
            </form>

            <div style="text-align:center; font-size:0.88rem; color:#888;">
              ` + (isLogin ? `Don't have an account? <a href="#" onclick="event.preventDefault(); window.App.auth.openModal('register')" style="color:#00E5FF; font-weight:800;">Create One</a>` : `Already have an account? <a href="#" onclick="event.preventDefault(); window.App.auth.openModal('login')" style="color:#00E5FF; font-weight:800;">Log In</a>`) + `
            </div>
          </div>
        `;
      }

      modal.style.display = 'flex';
    },

    handleLoginSubmit: function() {
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;
      this.login(email, pass);
    },

    handleRegisterSubmit: function() {
      const store = document.getElementById('auth-store-name').value;
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;
      this.register(email, pass, store);
    },

    closeModal: function() {
      const modal = document.getElementById('auth-modal');
      if (modal) modal.style.display = 'none';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.App.auth.init();
  });
})();
