import { describe, expect, it } from 'vitest'
import { aumenta, diminuisci, haContatore, impostaPresi } from './contatore'
import { vociAttive, vociComprate } from './lista'
import type { Lista, Voce } from './tipi'

const lista: Lista = {
  id: 'lista',
  creataIl: '2026-09-12T08:00:00.000Z',
  voci: [
    { id: 'pesce', nome: 'Pesce', reparto: 'pescheria', categoria: 'pesce', origine: 'generata', comprata: false, quantita: 4, presi: 0 },
    { id: 'uova', nome: 'Uova', reparto: 'latticini_uova', categoria: 'uova', origine: 'generata', comprata: false, quantita: 2, presi: 1 },
    // Rimasta dalla v1: niente contatore.
    { id: 'orata', nome: 'orata', reparto: 'pescheria', categoria: 'pesce', origine: 'generata', comprata: false },
    { id: 'caffe', nome: 'caffè', reparto: 'dispensa', origine: 'manuale', comprata: false },
  ],
}

function trova(l: Lista, id: string): Voce {
  const voce = l.voci.find((v) => v.id === id)
  if (!voce) throw new Error(`voce ${id} assente`)
  return voce
}

describe('haContatore', () => {
  it('ce l hanno solo le generate v2', () => {
    expect(lista.voci.map(haContatore)).toEqual([true, true, false, false])
  })
})

describe('aumenta', () => {
  it('conta un pasto in più e sotto il totale la voce resta da prendere', () => {
    const dopo = aumenta(lista, 'pesce')
    expect(trova(dopo, 'pesce')).toMatchObject({ presi: 1, comprata: false })
  })

  it('al totale la voce è comprata e va tra i già presi', () => {
    const dopo = aumenta(lista, 'uova')
    expect(trova(dopo, 'uova')).toMatchObject({ presi: 2, comprata: true })
    expect(vociComprate(dopo).map((v) => v.id)).toEqual(['uova'])
  })

  it('oltre il totale non va', () => {
    const completa = aumenta(lista, 'uova')
    expect(aumenta(completa, 'uova')).toBe(completa)
  })

  it('lascia intatta la lista di partenza e le altre voci', () => {
    const dopo = aumenta(lista, 'pesce')
    expect(trova(lista, 'pesce').presi).toBe(0)
    expect(dopo.voci.filter((v) => v.id !== 'pesce')).toEqual(lista.voci.filter((v) => v.id !== 'pesce'))
    expect(dopo.voci[1]).toBe(lista.voci[1])
  })
})

describe('diminuisci', () => {
  it('sotto 0 non va', () => {
    expect(diminuisci(lista, 'pesce')).toBe(lista)
  })

  it('una voce completa col − torna nella lista a totale − 1', () => {
    const completa = impostaPresi(lista, 'pesce', 4)
    const dopo = diminuisci(completa, 'pesce')
    expect(trova(dopo, 'pesce')).toMatchObject({ presi: 3, comprata: false })
    expect(vociAttive(dopo).map((v) => v.id)).toContain('pesce')
  })
})

describe('impostaPresi', () => {
  it('scrive il numero dentro i limiti', () => {
    expect(trova(impostaPresi(lista, 'pesce', 3), 'pesce')).toMatchObject({ presi: 3, comprata: false })
    expect(trova(impostaPresi(lista, 'pesce', 9), 'pesce')).toMatchObject({ presi: 4, comprata: true })
    expect(trova(impostaPresi(lista, 'uova', -3), 'uova')).toMatchObject({ presi: 0, comprata: false })
  })

  it('i decimali si troncano, un numero non valido non cambia niente', () => {
    expect(trova(impostaPresi(lista, 'pesce', 2.7), 'pesce').presi).toBe(2)
    expect(impostaPresi(lista, 'pesce', Number.NaN)).toBe(lista)
  })

  it('lo stesso numero non tocca la lista', () => {
    expect(impostaPresi(lista, 'uova', 1)).toBe(lista)
  })

  it('da completa a sotto il totale la voce torna da prendere', () => {
    const completa = impostaPresi(lista, 'pesce', 4)
    expect(trova(impostaPresi(completa, 'pesce', 1), 'pesce')).toMatchObject({ presi: 1, comprata: false })
  })

  it('non tocca le voci senza contatore né gli id che non ci sono', () => {
    expect(impostaPresi(lista, 'orata', 1)).toBe(lista)
    expect(aumenta(lista, 'caffe')).toBe(lista)
    expect(diminuisci(lista, 'boh')).toBe(lista)
  })
})
