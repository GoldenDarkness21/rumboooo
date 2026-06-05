import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://tyuzejfqvnkvdljfoiyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dXplamZxdm5rdmRsamZvaXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzU2MDQsImV4cCI6MjA5MTM1MTYwNH0.LLOm5gOjYYcNQrDZtud4HzPYZztMPUYOV_cZMVbQarU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);