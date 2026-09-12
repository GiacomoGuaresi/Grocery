import { describe, expect, it } from 'vitest'
import { haVociDaRiportare, nuovoCiclo, vociDaRiportare } from './ciclo'
import { generaLista } from './generazione'
import type { Lista, Voce } from './tipi'

const ilQuindiciDiGiugno = new Date(2026, 5, 15)

function lista(voci: Voce[]): Lista {
  return { id: 'precedente', creataIl: '2026-06-01T08:00:00.000Z', voci }
}

const caffe: Voce = {
  id: 'manuale-1',
  nome: 'caffè',
  reparto: 'dispensa',
  origine: 'manuale',
  comprata: false,
}

const detersivo: Voce = {
  id: 'manuale-2',
  nome: 'detersivo piatti',
  reparto: 'casa_igiene',
  origine: 'manuale',
  comprata: true,
}

function generata(categoria: 'pesce' | 'verdura', presi: number, quantita: number): Voce {
  return {
    id: categoria,
    nome: categoria,
    reparto: categoria === 'pesce' ? 'pescheria' : 'ortofrutta',
    categoria,
    origine: 'generata',
    comprata: presi === quantita,
    quantita,
    presi,
  }
}

/** Una generata rimasta dalla v1: niente contatore, solo la spunta. */
const orataV1: Voce = {
  id: 'pesce-1',
  nome: 'orata',
  reparto: 'pescheria',
  categoria: 'pesce',
  origine: 'generata',
  comprata: false,
}

const precedente = lista([
  caffe,
  detersivo,
  generata('pesce', 2, 4),
  generata('verdura', 0, 14),
  generata('verdura', 14, 14),
  orataV1,
])

describe('vociDaRiportare', () => {
  it('sono le sole voci manuali non spuntate', () => {
    expect(vociDaRiportare(precedente)).toEqual([caffe])
  })

  it('le generate non si riportano, prese a metà, mai toccate, complete o dalla v1', () => {
    expect(haVociDaRiportare(lista([generata('pesce', 2, 4), generata('verdura', 0, 14), orataV1]))).toBe(false)
  })

  it('senza lista precedente non c’è niente da riportare', () => {
    expect(vociDaRiportare(null)).toEqual([])
    expect(haVociDaRiportare(null)).toBe(false)
    expect(haVociDaRiportare(lista([detersivo]))).toBe(false)
    expect(haVociDaRiportare(lista([caffe]))).toBe(true)
  })
})

describe('nuovoCiclo', () => {
  const generataSola = generaLista({ data: ilQuindiciDiGiugno })

  it('la prima generazione è la lista generata', () => {
    expect(nuovoCiclo({ data: ilQuindiciDiGiugno })).toEqual(generataSola)
  })

  it('la lista nuova ha un altro id e non tocca la precedente', () => {
    const copia = structuredClone(precedente)
    const nuova = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente, portaAvanti: true })

    expect(nuova.id).not.toBe(precedente.id)
    expect(precedente).toEqual(copia)
  })

  it('senza conferma non passa niente della precedente', () => {
    expect(nuovoCiclo({ data: ilQuindiciDiGiugno, precedente })).toEqual(generataSola)
  })

  it('con la conferma porta avanti le manuali non spuntate, in fondo e tali e quali', () => {
    const nuova = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente, portaAvanti: true })
    expect(nuova.voci).toEqual([...generataSola.voci, caffe])
  })

  it('nessuna generata riportata: pesce e verdura ripartono da zero, una voce sola', () => {
    const nuova = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente, portaAvanti: true })
    const pesce = nuova.voci.filter((voce) => voce.categoria === 'pesce')
    const verdura = nuova.voci.filter((voce) => voce.categoria === 'verdura')

    expect(pesce).toHaveLength(1)
    expect(pesce[0]).toMatchObject({ quantita: 4, presi: 0 })
    expect(verdura).toHaveLength(1)
    expect(verdura[0]).toMatchObject({ quantita: 14, presi: 0 })
    expect(nuova.voci.map((voce) => voce.nome)).not.toContain('orata')
  })

  it('una manuale riportata non ruba l’id a una voce del ciclo nuovo', () => {
    const vecchia: Voce = { ...caffe, id: 'pesce' }
    const nuova = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente: lista([vecchia]), portaAvanti: true })

    const ids = nuova.voci.map((voce) => voce.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(nuova.voci.find((voce) => voce.nome === 'caffè')?.id).toBe('riportata-pesce')
  })
})
