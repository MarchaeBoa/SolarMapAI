/* ============================================================
   AUTH — Login, Register, Forgot Password, Session, Logout
   ============================================================ */

async function authSignUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName
    });
  }
  return data;
}

async function authSignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function authSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = 'login.html';
}

async function authResetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/solar-project/dashboard-perfil.html'
  });
  if (error) throw error;
}

async function authGetUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function authGetProfile() {
  const user = await authGetUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { ...user, profile: data };
}

async function authUpdateProfile(updates) {
  const user = await authGetUser();
  if (!user) throw new Error('Não autenticado');
  const { data, error } = await supabase.from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function authUpdatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    window.location.href = 'login.html';
  }
});
