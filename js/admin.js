/* ============================================================
   ADMIN — Gerenciamento de Usuários, Planos e Projetos
   Requires: supabase-config.js, auth.js loaded first
   ============================================================ */

/* ── ADMIN CHECK ── */
async function isAdmin() {
  const user = await authGetUser();
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  const { data, error } = await supabase.from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (error || !data || data.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

/* ── USERS ── */
async function getAdminUsers() {
  const { data, error } = await supabase.from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── PROMOTE / DEMOTE ── */
async function promoteUser(userId, plan) {
  const proUntil = new Date();
  proUntil.setFullYear(proUntil.getFullYear() + 1);
  const { data, error } = await supabase.from('profiles')
    .update({ plan: plan, pro_until: proUntil.toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function demoteUser(userId) {
  const { data, error } = await supabase.from('profiles')
    .update({ plan: 'free', pro_until: null })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── ACTIVATE / DEACTIVATE ── */
async function deactivateUser(userId) {
  const { data, error } = await supabase.from('profiles')
    .update({ status: 'inactive' })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function activateUser(userId) {
  const { data, error } = await supabase.from('profiles')
    .update({ status: 'active' })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── PROJECTS (admin view) ── */
async function getAdminProjects() {
  const { data, error } = await supabase.from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── BUDGETS (admin view) ── */
async function getAdminBudgets() {
  const { data, error } = await supabase.from('budgets')
    .select('*, projects(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── ADMIN STATS ── */
async function getAdminStats() {
  const users = await getAdminUsers();
  const projects = await getAdminProjects();
  const budgets = await getAdminBudgets();

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro' || u.plan === 'premium').length;
  const freeUsers = users.filter(u => u.plan === 'free' || !u.plan).length;
  const totalProjects = projects.length;

  let totalBudgetValue = 0;
  let approvedBudgets = 0;
  let pendingBudgets = 0;
  budgets.forEach(b => {
    const val = parseFloat(b.total_value || b.total || 0);
    totalBudgetValue += val;
    if (b.status === 'aprovado' || b.status === 'approved') approvedBudgets++;
    if (b.status === 'analise' || b.status === 'pending' || b.status === 'em_analise') pendingBudgets++;
  });

  return {
    totalUsers,
    proUsers,
    freeUsers,
    totalProjects,
    totalBudgets: budgets.length,
    totalBudgetValue,
    approvedBudgets,
    pendingBudgets,
    users,
    projects,
    budgets
  };
}

/* ── FORMAT HELPERS ── */
function formatCurrency(n) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
