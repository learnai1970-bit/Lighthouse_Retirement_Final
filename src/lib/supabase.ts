import { createClient } from '@supabase/supabase-js';

// Retrieve values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// LOGGING - Check your browser console for these!
console.log("--- Supabase Connection Check ---");
console.log("URL Found:", supabaseUrl ? "✅ " + supabaseUrl.substring(0, 20) + "..." : "❌ MISSING");
console.log("Key Found:", supabaseAnonKey ? "✅ (Value exists)" : "❌ MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase credentials are not loading from .env file!");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);