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
      const { data: prof } = await supabase.from('profiles').select('plan, role').eq('id', user.id).single();
      if (prof && prof.plan === 'free' && prof.role !== 'admin') {
        window.location.href = 'planos.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return;
    }

    // If on dashboard, check plan + populate sidebar
    if (isDashPage && user) {
      const nameEl = document.getElementById('dashUserName');
      const emailEl = document.getElementById('dashUserEmail');
      const avatarEl = document.getElementById('dashUserAvatar');

      const { data: profile } = await supabase.from('profiles').select('full_name, role, plan').eq('id', user.id).single();

      // PAYWALL: Block free users from dashboard
      if (profile && profile.plan === 'free' && profile.role !== 'admin') {
        window.location.href = 'planos.html?blocked=1';
        return;
      }

      if (nameEl && profile) {
        const name = profile.full_name || user.email.split('@')[0];
        nameEl.textContent = name;
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
        // Show admin links if user is admin
        if (profile.role === 'admin') {
          const adminLink = document.getElementById('adminLink');
          if (adminLink) adminLink.style.display = 'flex';
          const adminBtn = document.getElementById('adminBtnSidebar');
          if (adminBtn) adminBtn.style.display = 'block';
        }
      }
      if (emailEl) emailEl.textContent = user.email;
    }
  } catch (e) {
    if (isDashPage) {
      window.location.href = 'login.html';
    }
  }
})();
