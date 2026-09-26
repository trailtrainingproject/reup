import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Garante que a URL é válida para não interromper a pré-renderização (SSG) no build da Vercel
const validUrl = supabaseUrl && supabaseUrl.startsWith('https://') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';

const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
