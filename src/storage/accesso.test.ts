import type { AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccessoSupabase, accessoLibero } from './accesso'

const EMAIL = 'casa@example.com'

/** Il minimo di client Supabase che l'accesso tocca, con le risposte decise dal test. */
function clientFinto(risposte: {
  sessione?: object | null
  erroreSessione?: { name: string } | null
  erroreAccesso?: { code: string } | null
}) {
  let ascolta: ((evento: AuthChangeEvent) => void) | null = null
  const auth = {
    getSession: vi.fn(async () => ({
      data: { session: risposte.sessione ?? null },
      error: risposte.erroreSessione ?? null,
    })),
    signInWithPassword: vi.fn(async () => ({ error: risposte.erroreAccesso ?? null })),
    onAuthStateChange: vi.fn((callback: (evento: AuthChangeEvent) => void) => {
      ascolta = callback
      return { data: { subscription: { unsubscribe: vi.fn(() => (ascolta = null)) } } }
    }),
  }
  return {
    client: { auth } as unknown as SupabaseClient,
    auth,
    emetti: (evento: AuthChangeEvent) => ascolta?.(evento),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sessione', () => {
  it('con una sessione salvata non si chiede la passphrase', async () => {
    const { client } = clientFinto({ sessione: { access_token: 'x' } })
    expect(await new AccessoSupabase(client, EMAIL).haSessione()).toBe(true)
  })

  it('senza sessione si chiede', async () => {
    const { client } = clientFinto({ sessione: null })
    expect(await new AccessoSupabase(client, EMAIL).haSessione()).toBe(false)
  })

  it('senza rete chi era già entrato resta dentro', async () => {
    const { client } = clientFinto({ erroreSessione: { name: 'AuthRetryableFetchError' } })
    expect(await new AccessoSupabase(client, EMAIL).haSessione()).toBe(true)
  })

  it('una sessione rifiutata dal server fa chiedere la passphrase', async () => {
    const { client } = clientFinto({ erroreSessione: { name: 'AuthApiError' } })
    expect(await new AccessoSupabase(client, EMAIL).haSessione()).toBe(false)
  })
})

describe('entrata', () => {
  it('la passphrase fa da password dell unico account', async () => {
    const { client, auth } = clientFinto({})
    expect(await new AccessoSupabase(client, EMAIL).entra('pane e salame')).toBe('dentro')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: 'pane e salame' })
  })

  it('distingue la passphrase sbagliata dagli altri problemi', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const sbagliata = clientFinto({ erroreAccesso: { code: 'invalid_credentials' } })
    const altro = clientFinto({ erroreAccesso: { code: 'over_request_rate_limit' } })
    expect(await new AccessoSupabase(sbagliata.client, EMAIL).entra('no')).toBe('passphrase-sbagliata')
    expect(await new AccessoSupabase(altro.client, EMAIL).entra('no')).toBe('errore')
  })
})

describe('uscita', () => {
  it('avvisa solo quando la sessione finisce', () => {
    const { client, emetti } = clientFinto({})
    const avvisa = vi.fn()
    new AccessoSupabase(client, EMAIL).quandoEsce(avvisa)
    emetti('TOKEN_REFRESHED')
    expect(avvisa).not.toHaveBeenCalled()
    emetti('SIGNED_OUT')
    expect(avvisa).toHaveBeenCalledOnce()
  })

  it('smettendo di ascoltare non avvisa più', () => {
    const { client, emetti } = clientFinto({})
    const avvisa = vi.fn()
    const smetti = new AccessoSupabase(client, EMAIL).quandoEsce(avvisa)
    smetti()
    emetti('SIGNED_OUT')
    expect(avvisa).not.toHaveBeenCalled()
  })
})

describe('senza Supabase', () => {
  it('si entra sempre', async () => {
    expect(await accessoLibero.haSessione()).toBe(true)
    expect(await accessoLibero.entra('')).toBe('dentro')
  })
})
