import { describe, expect, it } from 'vitest'
import { vociAttive, vociComprate } from './lista'
import { listaEsempio } from './listaEsempio'
import { despuntaVoce, spuntaVoce } from './spunta'
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

  it('un tipo di verdura si spunta da solo: gli altri restano da prendere', () => {
    const dopo = spuntaVoce(listaEsempio, 'verdura-3')
    expect(vociComprate(dopo).map((v) => v.nome)).toEqual(['spinaci'])
    expect(
      vociAttive(dopo)
        .filter((v) => v.categoria === 'verdura')
        .map((v) => v.nome),
    ).toEqual(['zucchine', 'melanzane', 'peperoni'])
  })

  it('lascia intatta la lista di partenza', () => {
    spuntaVoce(listaEsempio, 'verdura-1')
    expect(trova(listaEsempio, 'verdura-1').comprata).toBe(false)
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

  it('riporta indietro il solo tipo di frutta de-spuntato', () => {
    const presi = spuntaVoce(spuntaVoce(listaEsempio, 'frutta-1'), 'frutta-2')
    const dopo = despuntaVoce(presi, 'frutta-1')
    expect(vociComprate(dopo).map((v) => v.id)).toEqual(['frutta-2'])
  })
})

describe('lista attiva e già presi', () => {
  it('insieme contengono sempre tutte le voci, senza doppioni', () => {
    const lista = spuntaVoce(spuntaVoce(listaEsempio, 'pesce-2'), 'verdura-1')
    expect(vociAttive(lista).length + vociComprate(lista).length).toBe(lista.voci.length)
  })
})
