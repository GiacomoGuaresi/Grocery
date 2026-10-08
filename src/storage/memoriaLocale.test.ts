import { describe, expect, it } from 'vitest'
import type { Ricetta } from '../domain/tipi'
import { MemoriaLocale, type Scaffale } from './memoriaLocale'

function scaffale(iniziale: Record<string, string> = {}): Scaffale {
  const dati = new Map(Object.entries(iniziale))
  return {
    getItem: (chiave) => dati.get(chiave) ?? null,
    setItem: (chiave, valore) => void dati.set(chiave, valore),
  }
}

const torta: Ricetta = {
  id: 'ricetta-1',
  nome: 'Torta di mele',
  url: 'https://esempio.it/torta',
  immagine: 'https://esempio.it/torta.jpg',
  categorie: ['Dolci'],
  ingredienti: ['mele 4'],
  creataIl: '2026-10-08T10:00:00.000Z',
}

describe('le ricette nella memoria locale (doc/14)', () => {
  it('alla prima apertura non ce ne sono', () => {
    expect(new MemoriaLocale(scaffale()).leggiRicette()).toEqual([])
    expect(new MemoriaLocale(null).leggiRicette()).toEqual([])
  })

  it('rilegge le ricette salvate', () => {
    const memoria = new MemoriaLocale(scaffale())
    memoria.salvaRicette([torta])
    expect(memoria.leggiRicette()).toEqual([torta])
  })

  it('un valore illeggibile o di forma sbagliata vale quanto nessuna ricetta', () => {
    expect(new MemoriaLocale(scaffale({ 'grocery.ricette': '{rotto' })).leggiRicette()).toEqual([])
    const strane = JSON.stringify([torta, { id: 3 }, null])
    expect(new MemoriaLocale(scaffale({ 'grocery.ricette': strane })).leggiRicette()).toEqual([torta])
  })
})
