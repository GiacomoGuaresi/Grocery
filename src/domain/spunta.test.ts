import { describe, expect, it } from 'vitest'
import { vociAttive, vociComprate } from './lista'
import { listaEsempio } from './listaEsempio'
import { alternaElemento, despuntaVoce, elementiAttivi, spuntaVoce } from './spunta'
import type { Lista, Voce } from './tipi'

function trova(lista: Lista, id: string): Voce {
  const voce = lista.voci.find((v) => v.id === id)
  if (!voce) throw new Error(`voce ${id} assente`)
  return voce
}

describe('spuntaVoce', () => {
  it('toglie la voce dalla lista attiva e la porta tra i già presi', () => {
    const dopo = spuntaVoce(listaEsempio, 'manuale-1')
    expect(vociAttive(dopo).map((v) => v.id)).not.toContain('manuale-1')
    expect(vociComprate(dopo).map((v) => v.id)).toEqual(['manuale-1'])
  })

  it('non tocca le altre voci', () => {
    const dopo = spuntaVoce(listaEsempio, 'manuale-1')
    expect(vociAttive(dopo)).toHaveLength(listaEsempio.voci.length - 1)
  })

  it('spunta anche tutti gli elementi di una voce raggruppata', () => {
    const dopo = spuntaVoce(listaEsempio, 'verdura')
    expect(trova(dopo, 'verdura').elementi!.every((e) => e.comprato)).toBe(true)
    expect(elementiAttivi(trova(dopo, 'verdura'))).toEqual([])
  })

  it('lascia intatta la lista di partenza', () => {
    spuntaVoce(listaEsempio, 'verdura')
    expect(trova(listaEsempio, 'verdura').elementi!.some((e) => e.comprato)).toBe(false)
    expect(vociComprate(listaEsempio)).toEqual([])
  })

  it('su un id inesistente non cambia niente', () => {
    expect(spuntaVoce(listaEsempio, 'boh')).toEqual(listaEsempio)
  })

  it('è idempotente', () => {
    const una = spuntaVoce(listaEsempio, 'pesce-1')
    expect(spuntaVoce(una, 'pesce-1')).toEqual(una)
  })
})

describe('despuntaVoce', () => {
  it('riporta la voce nella lista attiva', () => {
    const dopo = despuntaVoce(spuntaVoce(listaEsempio, 'uova-1'), 'uova-1')
    expect(vociComprate(dopo)).toEqual([])
    expect(dopo).toEqual(listaEsempio)
  })

  it('rimette da prendere tutti gli elementi di una voce raggruppata', () => {
    const presa = spuntaVoce(listaEsempio, 'frutta')
    const dopo = despuntaVoce(presa, 'frutta')
    expect(elementiAttivi(trova(dopo, 'frutta'))).toHaveLength(4)
  })

  it('de-spunta anche una voce raggruppata presa un elemento alla volta', () => {
    let lista = listaEsempio
    for (const elemento of trova(listaEsempio, 'verdura').elementi!) {
      lista = alternaElemento(lista, 'verdura', elemento.nome)
    }
    const dopo = despuntaVoce(lista, 'verdura')
    expect(trova(dopo, 'verdura').comprata).toBe(false)
    expect(elementiAttivi(trova(dopo, 'verdura'))).toHaveLength(4)
  })
})

describe('alternaElemento', () => {
  it('spunta il solo elemento toccato', () => {
    const dopo = alternaElemento(listaEsempio, 'verdura', 'spinaci')
    const elementi = trova(dopo, 'verdura').elementi!
    expect(elementi.filter((e) => e.comprato).map((e) => e.nome)).toEqual(['spinaci'])
  })

  it('tiene la voce nella lista attiva finché resta qualcosa da prendere', () => {
    const dopo = alternaElemento(listaEsempio, 'verdura', 'spinaci')
    expect(trova(dopo, 'verdura').comprata).toBe(false)
    expect(elementiAttivi(trova(dopo, 'verdura')).map((e) => e.nome)).toEqual([
      'zucchine',
      'melanzane',
      'peperoni',
    ])
  })

  it('marca la voce comprata quando l ultimo elemento viene spuntato', () => {
    let lista = listaEsempio
    for (const elemento of trova(listaEsempio, 'frutta').elementi!) {
      expect(trova(lista, 'frutta').comprata).toBe(false)
      lista = alternaElemento(lista, 'frutta', elemento.nome)
    }
    expect(trova(lista, 'frutta').comprata).toBe(true)
    expect(vociComprate(lista).map((v) => v.id)).toEqual(['frutta'])
  })

  it('riporta la voce tra quelle attive se si de-spunta un elemento', () => {
    const presa = spuntaVoce(listaEsempio, 'frutta')
    const dopo = alternaElemento(presa, 'frutta', 'uva')
    expect(trova(dopo, 'frutta').comprata).toBe(false)
    expect(elementiAttivi(trova(dopo, 'frutta')).map((e) => e.nome)).toEqual(['uva'])
  })

  it('due tocchi sullo stesso elemento tornano al punto di partenza', () => {
    const dopo = alternaElemento(alternaElemento(listaEsempio, 'frutta', 'pere'), 'frutta', 'pere')
    expect(dopo).toEqual(listaEsempio)
  })

  it('su una voce semplice non fa niente', () => {
    expect(alternaElemento(listaEsempio, 'manuale-1', 'caffè')).toEqual(listaEsempio)
  })

  it('su un elemento inesistente non fa niente', () => {
    expect(alternaElemento(listaEsempio, 'verdura', 'ananas')).toEqual(listaEsempio)
  })
})

describe('lista attiva e già presi', () => {
  it('insieme contengono sempre tutte le voci, senza doppioni', () => {
    const lista = alternaElemento(spuntaVoce(listaEsempio, 'pesce-2'), 'verdura', 'zucchine')
    expect(vociAttive(lista).length + vociComprate(lista).length).toBe(lista.voci.length)
  })
})
