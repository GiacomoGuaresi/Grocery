// Il realtime di StorageSupabase su un client finto, come accesso.test.ts: il
// Supabase vero (supabase.test.ts) vuole Docker, questo gira sempre.

import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { StorageSupabase } from './supabase'

/** Il minimo di client che il realtime tocca: un canale per volta, comandato dal test. */
function clientFinto() {
  let cambio: (() => void) | null = null
  let connessione: ((stato: string) => void) | null = null
  const canale = {
    on: vi.fn((_tipo: string, _filtro: object, callback: () => void) => {
      cambio = callback
      return canale
    }),
    subscribe: vi.fn((callback: (stato: string) => void) => {
      connessione = callback
      return canale
    }),
  }
  const client = {
    channel: vi.fn(() => canale),
    removeChannel: vi.fn(async () => 'ok'),
    rpc: vi.fn(async () => ({ error: null })),
  }
  return {
    storage: new StorageSupabase(client as unknown as SupabaseClient),
    client,
    canale,
    cambia: () => cambio?.(),
    connetti: (stato: string) => connessione?.(stato),
  }
}

describe('quandoCambia', () => {
  it('ascolta la sola tabella liste', () => {
    const { storage, canale } = clientFinto()
    storage.quandoCambia(() => {})
    expect(canale.on).toHaveBeenCalledOnce()
    expect(canale.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'liste' },
      expect.any(Function),
    )
  })

  it('avvisa a ogni cambio', () => {
    const { storage, cambia } = clientFinto()
    const avvisa = vi.fn()
    storage.quandoCambia(avvisa)
    cambia()
    cambia()
    expect(avvisa).toHaveBeenCalledTimes(2)
  })

  it('avvisa a ogni connessione, per quello che si è perso nel frattempo', () => {
    const { storage, connetti } = clientFinto()
    const avvisa = vi.fn()
    storage.quandoCambia(avvisa)
    connetti('SUBSCRIBED')
    connetti('CHANNEL_ERROR')
    connetti('SUBSCRIBED')
    expect(avvisa).toHaveBeenCalledTimes(2)
  })

  it('smettendo chiude il canale', () => {
    const { storage, client, canale } = clientFinto()
    storage.quandoCambia(() => {})()
    expect(client.removeChannel).toHaveBeenCalledWith(canale)
  })

  it('ogni ascolto ha il suo canale', () => {
    const { storage, client } = clientFinto()
    storage.quandoCambia(() => {})
    storage.quandoCambia(() => {})
    const [[primo], [secondo]] = client.channel.mock.calls as unknown as [[string], [string]]
    expect(primo).not.toBe(secondo)
  })
})

describe('salvaVoci', () => {
  it('manda a salva_voci solo le voci toccate', async () => {
    const { storage, client } = clientFinto()
    const voce = {
      id: 'pesce-1',
      nome: 'orata',
      reparto: 'pescheria' as const,
      origine: 'generata' as const,
      comprata: true,
    }
    await storage.salvaVoci('lista-1', { voci: [voce], eliminate: ['verdura-1'] })
    expect(client.rpc).toHaveBeenCalledWith('salva_voci', {
      id_lista: 'lista-1',
      modificate: [voce],
      eliminate: ['verdura-1'],
    })
  })
})
