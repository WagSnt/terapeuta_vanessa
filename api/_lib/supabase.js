// api/_lib/supabase.js
// Cliente Supabase singleton para reuso entre invocações warm do serverless.
// Usa a SERVICE_ROLE_KEY — NUNCA expor ao cliente.

import { createClient } from '@supabase/supabase-js'

let _client

export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.')
    }

    _client = createClient(url, key, {
      auth: { persistSession: false }
    })
  }
  return _client
}
