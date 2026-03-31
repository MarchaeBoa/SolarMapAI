/* ============================================================
   SUPABASE CONFIG
   Substitua SUPABASE_URL e SUPABASE_ANON_KEY pelos valores
   do seu projeto em https://supabase.com/dashboard
   ============================================================ */

const SUPABASE_URL = 'https://tatgsdgoeazcmtoqambd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdGdzZGdvZWF6Y210b3FhbWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDUwMDgsImV4cCI6MjA4ODkyMTAwOH0.GDDFdbjJ0i5zPTeZsD9JJ-Pm9MQpj6PjOHlIiFW6Yjw';

// Initialize Supabase client and assign to window for global access
window._supabaseSDK = window.supabase;
window.supabase = window._supabaseSDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
