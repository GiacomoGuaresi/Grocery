import { describe, expect, it } from 'vitest'
import { etichettaData, riepilogo, sintesi } from './archivio'
import { listaEsempio } from './listaEsempio'
import type { SintesiLista } from './tipi'

const base: SintesiLista = {
  id: 'lista-1',
  creataIl: '2026-09-07T08:00:00.000Z',
  quanteVoci: 12,
  quanteComprate: 10,
}

describe('etichetta della data', () => {
  it('scrive la data per esteso in italiano', () => {
    expect(etichettaData('2026-09-07T08:00:00.000Z')).toBe('7 settembre 2026')
  })

  it('su una data illeggibile non inventa niente', () => {
    expect(etichettaData('boh')).toBe('boh')
  })
})

describe('riepilogo di una spesa', () => {
  it('dice quante voci e quante prese', () => {
    expect(riepilogo(base)).toBe('12 voci · 10 prese')
  })

  it('quando si è preso tutto lo dice e basta', () => {
    expect(riepilogo({ ...base, quanteComprate: 12 })).toBe('12 voci · tutte prese')
  })

  it('distingue il nessuna presa dallo zero voci', () => {
    expect(riepilogo({ ...base, quanteComprate: 0 })).toBe('12 voci · nessuna presa')
    expect(riepilogo({ ...base, quanteVoci: 0, quanteComprate: 0 })).toBe('nessuna voce')
  })

  it('al singolare scrive voce', () => {
    expect(riepilogo({ ...base, quanteVoci: 1, quanteComprate: 0 })).toBe('1 voce · nessuna presa')
  })
})

describe('sintesi di una lista caricata', () => {
  it('conta le voci e quelle comprate', () => {
    const conta = sintesi(listaEsempio)
    expect(conta.id).toBe(listaEsempio.id)
    expect(conta.quanteVoci).toBe(listaEsempio.voci.length)
    expect(conta.quanteComprate).toBe(listaEsempio.voci.filter((v) => v.comprata).length)
  })
})
