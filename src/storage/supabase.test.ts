// Il contratto di Storage contro un Supabase vero, più le policy. Gira solo se
// trova le variabili SUPABASE_TEST_*, pensate per il Supabase locale di
// `supabase start`: ogni test svuota le tabelle, quindi mai contro il progetto
// di produzione. Senza le variabili i test si saltano.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { differenze } from '../domain/sincronia'
import { spuntaVoce } from '../domain/spunta'
import { AccessoSupabase } from './accesso'
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
  }

  describe('contratto di Storage', () => {
    verificaContratto(async () => {
      await svuota()
      return new StorageSupabase(autenticato)
    })
  })

  describe('accesso con passphrase', () => {
    const porta = () =>
      new AccessoSupabase(createClient(url, chiave, SENZA_SESSIONE_SALVATA), UTENTE.email)

    it('con la passphrase giusta si entra e la sessione resta', async () => {
      const accesso = porta()
      expect(await accesso.entra(UTENTE.password)).toBe('dentro')
      expect(await accesso.haSessione()).toBe(true)
    })

    it('con quella sbagliata no', async () => {
      const accesso = porta()
      expect(await accesso.entra('passphrase-sbagliata')).toBe('passphrase-sbagliata')
      expect(await accesso.haSessione()).toBe(false)
    })
  })

  describe('realtime', () => {
    /** Ascolta e aspetta la prima connessione: da lì in poi conta solo i cambi. */
    async function inAscolto(storage: StorageSupabase) {
      let avvisi = 0
      const smetti = storage.quandoCambia(() => avvisi++)
      await new Promise((pronto) => setTimeout(pronto, 1500))
      const connessione = avvisi
      return { cambi: () => avvisi - connessione, smetti }
    }

    it('una spunta avvisa chi ascolta con la sessione, non chi è senza', async () => {
      await svuota()
      const storage = new StorageSupabase(autenticato)
      await storage.salvaLista(lista)
      const dentro = await inAscolto(storage)
      const fuori = await inAscolto(
        new StorageSupabase(createClient(url, chiave, SENZA_SESSIONE_SALVATA)),
      )

      await storage.salvaVoci(
        lista.id,
        differenze(lista, spuntaVoce(lista, 'pesce-1')),
        new Date().toISOString(),
      )
      await vi.waitFor(() => expect(dentro.cambi()).toBeGreaterThan(0), { timeout: 5000 })
      // L'evento è partito: se chi è senza sessione dovesse riceverlo, ormai l'avrebbe.
      await new Promise((pronto) => setTimeout(pronto, 1000))
      expect(fuori.cambi()).toBe(0)

      dentro.smetti()
      fuori.smetti()
    })
  })

  describe('senza sessione', () => {
    const anonimo = () => new StorageSupabase(createClient(url, chiave, SENZA_SESSIONE_SALVATA))

    it('non si legge niente', async () => {
      await svuota()
      await new StorageSupabase(autenticato).salvaLista(lista)
      await expect(anonimo().leggiListaCorrente()).rejects.toMatchObject(PERMESSO_NEGATO)
    })

    it('non si scrive niente', async () => {
      await svuota()
      await expect(anonimo().salvaLista(lista)).rejects.toMatchObject(PERMESSO_NEGATO)
      expect(await new StorageSupabase(autenticato).leggiListaCorrente()).toBeNull()
    })
  })

  describe('vincoli del database', () => {
    it('presi non esce dal totale: la scrittura si rifiuta', async () => {
      await svuota()
      const storage = new StorageSupabase(autenticato)
      await storage.salvaLista(lista)
      const troppi = { ...lista.voci[0], presi: 15 }
      await expect(
        storage.salvaVoci(lista.id, { voci: [troppi], eliminate: [] }, new Date().toISOString()),
      ).rejects.toMatchObject({ code: '23514' })
    })

    it('le liste sparite non esistono più', async () => {
      for (const tabella of ['rotazioni', 'archivio']) {
        const { error } = await autenticato.from(tabella).select('*').limit(1)
        expect(error).not.toBeNull()
      }
    })
  })
})
