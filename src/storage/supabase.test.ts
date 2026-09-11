// Il contratto di Storage contro un Supabase vero, più le policy. Gira solo se
// trova le variabili SUPABASE_TEST_*, pensate per il Supabase locale di
// `supabase start`: ogni test svuota le tabelle, quindi mai contro il progetto
// di produzione. Senza le variabili i test si saltano.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { lista, verificaContratto } from './contratto'
import { StorageSupabase } from './supabase'

const url = process.env.SUPABASE_TEST_URL ?? ''
const chiave = process.env.SUPABASE_TEST_PUBLISHABLE_KEY ?? ''
const segreta = process.env.SUPABASE_TEST_SECRET_KEY ?? ''

const UTENTE = { email: 'test@grocery.local', password: 'passphrase-di-prova' }
const SENZA_SESSIONE_SALVATA = { auth: { persistSession: false, autoRefreshToken: false } }

/** Postgres: permesso negato. */
const PERMESSO_NEGATO = { code: '42501' }

describe.skipIf(!url || !chiave || !segreta)('StorageSupabase', () => {
  // La chiave segreta scavalca le policy: serve solo a creare l'account e a
  // svuotare le tabelle tra un test e l'altro.
  let admin: SupabaseClient
  let autenticato: SupabaseClient

  beforeAll(async () => {
    admin = createClient(url, segreta, SENZA_SESSIONE_SALVATA)
    const creato = await admin.auth.admin.createUser({ ...UTENTE, email_confirm: true })
    if (creato.error && creato.error.code !== 'email_exists') throw creato.error

    autenticato = createClient(url, chiave, SENZA_SESSIONE_SALVATA)
    const accesso = await autenticato.auth.signInWithPassword(UTENTE)
    if (accesso.error) throw accesso.error
  })

  async function svuota(): Promise<void> {
    // Le voci se ne vanno con le loro liste (on delete cascade).
    const liste = await admin.from('liste').delete().neq('id', '')
    if (liste.error) throw liste.error
    const rotazioni = await admin.from('rotazioni').delete().neq('categoria', '')
    if (rotazioni.error) throw rotazioni.error
  }

  describe('contratto di Storage', () => {
    verificaContratto(async () => {
      await svuota()
      return new StorageSupabase(autenticato)
    })
  })

  describe('senza sessione', () => {
    const anonimo = () => new StorageSupabase(createClient(url, chiave, SENZA_SESSIONE_SALVATA))

    it('non si legge niente', async () => {
      await svuota()
      await new StorageSupabase(autenticato).salvaLista(lista)
      await expect(anonimo().leggiListaCorrente()).rejects.toMatchObject(PERMESSO_NEGATO)
      await expect(anonimo().leggiArchivio()).rejects.toMatchObject(PERMESSO_NEGATO)
      await expect(anonimo().leggiRotazioni()).rejects.toMatchObject(PERMESSO_NEGATO)
    })

    it('non si scrive niente', async () => {
      await svuota()
      await expect(anonimo().salvaLista(lista)).rejects.toMatchObject(PERMESSO_NEGATO)
      await expect(
        anonimo().salvaRotazioni([{ categoria: 'uova', ultimi: [] }]),
      ).rejects.toMatchObject(PERMESSO_NEGATO)
      expect(await new StorageSupabase(autenticato).leggiListaCorrente()).toBeNull()
    })
  })
})
