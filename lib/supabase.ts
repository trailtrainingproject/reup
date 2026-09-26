import { createClient } from '@supabase/supabase-js';

// Garante que a URL é uma string limpa e sem barras no final
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const cleanUrl = rawUrl.trim().replace(/\/+$/, '');

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const cleanKey = rawKey.trim();

// Validação preventiva para evitar erros de rota no cliente
if (!cleanUrl.startsWith('https://')) {
  console.error('URL do Supabase inválida:', cleanUrl);
}

export const supabase = createClient(
  cleanUrl || 'https://placeholder.supabase.co',
  cleanKey || 'placeholder'
);
