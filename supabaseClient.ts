import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// These details are normally stored in environment variables,
// but are hardcoded here based on your provided keys.
const supabaseUrl = "https://oajfppteugcesocaivhh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hamZwcHRldWdjZXNvY2FpdmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTEyMDUsImV4cCI6MjA3MDkyNzIwNX0.qaouagKEZtLoB_i4N_DkLwg_J5tO98yrdR9rdp47oko"

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
