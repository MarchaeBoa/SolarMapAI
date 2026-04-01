/* ============================================================
   DASHBOARD — CRUD Operations for Simulations, Projects, Budgets
   ============================================================ */

/* ── SIMULATIONS ── */
async function saveSimulation(data) {
  const user = await authGetUser();
  if (!user) throw new Error('Não autenticado');
  const { data: sim, error } = await supabase.from('simulations').insert({
    user_id: user.id,
    address: data.address,
    panels: data.panels,
    monthly_kwh: data.monthlyKwh,
    annual_savings: data.annualSavings,
    investment: data.investment,
    payback_years: data.paybackYears,
    region: data.region
  }).select().single();
  if (error) throw error;
  return sim;
}

async function getSimulations() {
  const { data, error } = await supabase.from('simulations')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteSimulation(id) {
  const { error } = await supabase.from('simulations').delete().eq('id', id);
  if (error) throw error;
}

/* ── PROJECTS ── */
async function createProject(data) {
  const user = await authGetUser();
  if (!user) throw new Error('Não autenticado');
  const { data: project, error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: data.name,
    address: data.address,
    status: data.status || 'rascunho',
    roof_area: data.roofArea,
    panels: data.panels,
    power_kwp: data.powerKwp,
    monthly_kwh: data.monthlyKwh,
    investment: data.investment,
    payback_years: data.paybackYears,
    equipment_panel: data.equipmentPanel,
    equipment_inverter: data.equipmentInverter,
    notes: data.notes
  }).select().single();
  if (error) throw error;
  return project;
}

async function getProjects() {
  const { data, error } = await supabase.from('projects')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateProject(id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('projects')
    .update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

/* ── BUDGETS ── */
async function createBudget(data) {
  const user = await authGetUser();
  if (!user) throw new Error('Não autenticado');
  const { data: budget, error } = await supabase.from('budgets').insert({
    user_id: user.id,
    project_id: data.projectId || null,
    client_name: data.clientName,
    client_email: data.clientEmail,
    total_value: data.totalValue,
    items: data.items,
    status: data.status || 'pendente'
  }).select().single();
  if (error) throw error;
  return budget;
}

async function getBudgets() {
  const { data, error } = await supabase.from('budgets')
    .select('*, projects(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateBudget(id, updates) {
  const { data, error } = await supabase.from('budgets')
    .update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

/* ── BILL ANALYSES ── */
async function saveBillAnalysis(data) {
  const user = await authGetUser();
  if (!user) throw new Error('Não autenticado');
  const { data: analysis, error } = await supabase.from('bill_analyses').insert({
    user_id: user.id,
    client_name: data.clientName,
    state_uf: data.stateUF,
    city: data.city,
    monthly_kwh: data.monthlyKwh,
    bill_value: data.billValue,
    connection_type: data.connectionType,
    panel_model: data.panelModel,
    panels_recommended: data.panelsRecommended,
    kwp_needed: data.kwpNeeded,
    monthly_generation: data.monthlyGeneration,
    monthly_savings: data.monthlySavings,
    annual_savings: data.annualSavings,
    investment: data.investment,
    payback_years: data.paybackYears,
    co2_avoided: data.co2Avoided
  }).select().single();
  if (error) throw error;
  return analysis;
}

async function getBillAnalyses() {
  const { data, error } = await supabase.from('bill_analyses')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteBillAnalysis(id) {
  const { error } = await supabase.from('bill_analyses').delete().eq('id', id);
  if (error) throw error;
}

/* ── DASHBOARD STATS ── */
async function getDashboardStats() {
  const [sims, projects, budgets] = await Promise.all([
    getSimulations(),
    getProjects(),
    getBudgets()
  ]);

  const totalSavings = sims.reduce((sum, s) => sum + (Number(s.annual_savings) || 0), 0);
  const activeBudgets = budgets.filter(b => b.status === 'pendente' || b.status === 'enviado');
  const totalBudgetValue = budgets.reduce((sum, b) => sum + (Number(b.total_value) || 0), 0);

  return {
    simulationCount: sims.length,
    projectCount: projects.length,
    budgetCount: budgets.length,
    totalSavings,
    activeBudgetCount: activeBudgets.length,
    totalBudgetValue
  };
}

/* ── MOBILE SIDEBAR TOGGLE ── */
function toggleDashSidebar() {
  document.querySelector('.dash-sidebar').classList.toggle('open');
}

/* ── ENERGY ORBS GENERATOR (reused across all pages) ── */
function generateOrbs(count) {
  const container = document.getElementById('energyOrbs');
  if (!container) return;
  const types = ['orb--gold','orb--green','orb--white','orb--orange','orb--blue'];
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    const type = types[i % types.length];
    const size = Math.random() * 10 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 25 + 6;
    const delay = Math.random() * 20;
    const driftX = (Math.random() - 0.5) * 400;
    const animStyle = i % 3;
    let anim;
    if (animStyle === 0) {
      anim = `orbDrift ${duration}s ${delay}s linear infinite`;
      orb.style.setProperty('--drift-x', driftX + 'px');
    } else if (animStyle === 1) {
      anim = `orbPulse ${Math.random()*5+2}s ${delay}s ease-in-out infinite`;
    } else {
      orb.style.setProperty('--dx', (Math.random()-0.5)*300 + 'px');
      orb.style.setProperty('--dy', (Math.random()-0.5)*300 + 'px');
      orb.style.setProperty('--dx2', (Math.random()-0.5)*400 + 'px');
      orb.style.setProperty('--dy2', (Math.random()-0.5)*400 + 'px');
      orb.style.setProperty('--scale-mid', (Math.random()*1.2+0.6).toFixed(2));
      anim = `orbFloat ${duration}s ${delay}s ease-in-out infinite`;
    }
    orb.className = 'orb ' + type;
    orb.style.cssText += `width:${size}px;height:${size}px;left:${x}%;top:${y}%;animation:${anim};`;
    container.appendChild(orb);
  }
}

/* ── FORMAT HELPERS ── */
function formatCurrency(value) {
  return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}
