/* ============================================================
   ROUTE GUARD — Protects dashboard pages, redirects auth pages
   ============================================================ */

(async function guardRoute() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const authPages = ['login.html', 'register.html', 'forgot-password.html'];
  const dashPages = ['dashboard.html', 'dashboard-simulador.html', 'dashboard-orcamentos.html', 'dashboard-projetos.html', 'dashboard-perfil.html', 'dashboard-admin.html'];
  const freePages = ['planos.html'];

  const isAuthPage = authPages.includes(page);
  const isDashPage = dashPages.includes(page);
  const isFreePage = freePages.includes(page);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (isDashPage && !user) {
      window.location.href = 'login.html';
      return;
    }

    if (isAuthPage && user) {
      // Check plan before redirecting
      const isAdminByEmail = user.email === 'oescolhidoneo9@gmail.com';
      let prof = null;
      try {
        const { data } = await supabase.from('profiles').select('plan, role').eq('id', user.id).single();
        prof = data;
      } catch (err) { /* fallback below */ }
      if (prof && prof.plan === 'free' && prof.role !== 'admin' && !isAdminByEmail) {
        window.location.href = 'planos.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return;
    }

    // If on dashboard, check plan + populate sidebar
    if (isDashPage && user) {
      const ADMIN_EMAIL = 'oescolhidoneo9@gmail.com';
      const nameEl = document.getElementById('dashUserName');
      const emailEl = document.getElementById('dashUserEmail');
      const avatarEl = document.getElementById('dashUserAvatar');

      let profile = null;
      try {
        const { data } = await supabase.from('profiles').select('full_name, role, plan').eq('id', user.id).single();
        profile = data;
      } catch (err) { /* RLS may fail, continue with fallback */ }

      // Determine admin status: DB role or email fallback
      const isAdmin = (profile && profile.role === 'admin') || user.email === ADMIN_EMAIL;
      const plan = profile ? profile.plan : (isAdmin ? 'admin' : 'free');
      const name = (profile && profile.full_name) || user.user_metadata?.full_name || user.email.split('@')[0];

      // PAYWALL: Block free users from dashboard (admins always pass)
      if (!isAdmin && plan === 'free') {
        window.location.href = 'planos.html?blocked=1';
        return;
      }

      // Populate sidebar user info
      if (nameEl) nameEl.textContent = name;
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
      if (emailEl) emailEl.textContent = user.email;

      // Show plan label in popover
      const planLabel = document.getElementById('userPlanLabel');
      if (planLabel) {
        const planMap = { free: 'Free', pro: 'Pro', premium: 'Premium', admin: 'Admin' };
        planLabel.textContent = isAdmin ? 'Admin' : (planMap[plan] || 'Free');
      }

      // Show admin links if user is admin
      if (isAdmin) {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'flex';
        const adminBtn = document.getElementById('adminBtnSidebar');
        if (adminBtn) adminBtn.style.display = 'block';
        const adminBtnPopover = document.getElementById('adminBtnPopover');
        if (adminBtnPopover) adminBtnPopover.classList.add('visible');
      }

      // Setup popover toggle (always, regardless of admin status)
      const toggle = document.getElementById('userInfoToggle');
      const popover = document.getElementById('userPopover');
      if (toggle && popover) {
        toggle.addEventListener('click', function(e) {
          e.stopPropagation();
          popover.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
          if (!popover.contains(e.target) && !toggle.contains(e.target)) {
            popover.classList.remove('open');
          }
        });
      }
    }
  } catch (e) {
    if (isDashPage) {
      window.location.href = 'login.html';
    }
  }
})();
