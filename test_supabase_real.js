
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys from .env.local for testing purposes ONLY
// This script is temporary and local
const url = "https://cxkgdalprrmttsxudznw.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4a2dkYWxwcnJtdHRzeHVkem53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDYwMzcsImV4cCI6MjA4NDc4MjAzN30.d8LzLw72EqcxalP44XYGHDGuaiuoWoLzqvzAlJvsKzI";

console.log("Testing Supabase Connection...");
console.log("URL:", url);

const supabase = createClient(url, key);

async function testConnection() {
    try {
        console.log("Attempting to fetch from 'profesoria_profiles'...");
        const { data, error } = await supabase.from('profesoria_profiles').select('*').limit(1);

        if (error) {
            console.error("❌ SUPABASE ERROR:", error.message, error.details, error.hint);
            console.log("Code:", error.code);
        } else {
            console.log("✅ SUCCESS! Connected to Supabase.");
            console.log("Data retrieved:", data);
        }
    } catch (e) {
        console.error("❌ EXCEPTION:", e);
    }
}

testConnection();
