// Punto d'ingresso della persistenza per l'app in esecuzione nel browser: lo
// stato sta su Supabase, in sviluppo come in produzione (doc/07).

import type { Accesso } from './accesso'
import { connettiSupabase } from './supabase'
import type { Storage } from './tipi'

export type { Accesso, EsitoAccesso } from './accesso'
export type { Storage } from './tipi'

let supabase: ReturnType<typeof connettiSupabase> | null = null

/** Lo storage dell'app, aperto una volta sola e condiviso da chi lo chiede. */
export async function storage(): Promise<Storage> {
  return connessione().storage
}

/** Chi può entrare: serve la sessione aperta dalla passphrase. */
export async function accesso(): Promise<Accesso> {
  return connessione().accesso
}

/** Il client Supabase è uno solo: storage e accesso condividono la sessione. */
function connessione(): ReturnType<typeof connettiSupabase> {
  if (supabase) return supabase
  const url = import.meta.env.VITE_SUPABASE_URL
  const chiave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = import.meta.env.VITE_SUPABASE_EMAIL
  if (!url || !chiave || !email) {
    throw new Error(
      'Mancano VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_EMAIL: vedi .env.example',
    )
  }
  supabase = connettiSupabase(url, chiave, email)
  return supabase
}
