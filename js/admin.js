/* ============================================================
   ADMIN — Gerenciamento de Usuários, Planos e Projetos
   Requires: supabase-config.js, auth.js loaded first
   ============================================================ */

/* ── ADMIN CHECK ── */
async function isAdmin() {
  const ADMIN_EMAIL = 'oescolhidoneo9@gmail.com';
  const user = await authGetUser();
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  // Fallback: check email first
  if (user.email === ADMIN_EMAIL) return true;
  // Then check DB role
  try {
    const { data } = await supabase.from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (data && data.role === 'admin') return true;
  } catch (e) { /* RLS may fail, fallback already handled */ }
  window.location.href = 'dashboard.html';
  return false;
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

/* ── SIMULATIONS (admin view) ── */
async function getAdminSimulations() {
  const { data, error } = await supabase.from('simulations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── DELETE OPERATIONS ── */
async function deleteAdminSimulation(id) {
  const { error } = await supabase.from('simulations').delete().eq('id', id);
  if (error) throw error;
}

async function deleteAdminProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

async function deleteAdminBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

/* ── UPDATE BUDGET STATUS ── */
async function updateAdminBudgetStatus(id, status) {
  const { data, error } = await supabase.from('budgets')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── CHANGE USER PLAN ── */
async function changeUserPlan(userId, newPlan) {
  const updates = { plan: newPlan };
  if (newPlan === 'pro' || newPlan === 'premium') {
    const proUntil = new Date();
    proUntil.setFullYear(proUntil.getFullYear() + 1);
    updates.pro_until = proUntil.toISOString();
  } else {
    updates.pro_until = null;
  }
  const { data, error } = await supabase.from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── GET USER FULL DATA (for "Entrar na conta" modal) ── */
async function getUserFullData(userId) {
  const [profileRes, simsRes, projsRes, budgetsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('simulations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('budgets').select('*, projects(name)').eq('user_id', userId).order('created_at', { ascending: false })
  ]);
  return {
    profile: profileRes.data,
    simulations: simsRes.data || [],
    projects: projsRes.data || [],
    budgets: budgetsRes.data || []
  };
}

/* ── ADMIN STATS ── */
async function getAdminStats() {
  const [users, projects, budgets, simulations] = await Promise.all([
    getAdminUsers(),
    getAdminProjects(),
    getAdminBudgets(),
    getAdminSimulations()
  ]);

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro' || u.plan === 'premium').length;
  const freeUsers = users.filter(u => u.plan === 'free' || !u.plan).length;
  const totalProjects = projects.length;
  const totalSimulations = simulations.length;

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
    totalSimulations,
    totalBudgets: budgets.length,
    totalBudgetValue,
    approvedBudgets,
    pendingBudgets,
    users,
    projects,
    budgets,
    simulations
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
