
// js/config.js
const SUPABASE_URL = 'https://kgzignpnhhdhquhilrsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemlnbnBuaGhkaHF1aGlscnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTEwNjgsImV4cCI6MjA5OTEyNzA2OH0.dN1beamFkNjytmO83_QRM1lZMChhyBv35kcMtNrh81c';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado');
