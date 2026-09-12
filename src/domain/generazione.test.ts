import { describe, expect, it } from 'vitest'
import { categorie } from './dati'
import { generaLista, haVociDaRiportare, nuovoCiclo, pastiPerCiclo, vociDaRiportare, type Routine } from './generazione'
import type { Lista, Voce } from './tipi'

function voce(lista: Lista, categoria: NonNullable<Voce['categoria']>): Voce | undefined {
  return lista.voci.find((v) => v.categoria === categoria)
}

describe('pastiPerCiclo', () => {
  it('copre il ciclo come la routine di doc/02', () => {
    expect(Object.fromEntries(pastiPerCiclo())).toEqual({
      carne_rossa: 2,
      formaggio: 2,
      pesce: 4,
      uova: 2,
      carne_bianca: 2,
      affettati: 2,
      verdura: 14,
      frutta: 28,
    })
  })
})

describe('generaLista', () => {
  const lista = generaLista({ data: new Date(2026, 5, 15) })

  it('una voce per categoria, nell’ordine del catalogo', () => {
    expect(lista.voci.map((v) => v.categoria)).toEqual(categorie.map((c) => c.id))
  })

  it('totali dalla routine: pesce 4, verdura 14, frutta 28', () => {
    expect(voce(lista, 'pesce')?.quantita).toBe(4)
    expect(voce(lista, 'verdura')?.quantita).toBe(14)
    expect(voce(lista, 'frutta')?.quantita).toBe(28)
    expect(voce(lista, 'uova')?.quantita).toBe(2)
  })

  it('ogni voce ha nome dalla categoria, reparto, niente presi e niente spunta', () => {
    for (const catalogo of categorie) {
      expect(voce(lista, catalogo.id)).toEqual({
        id: catalogo.id,
        nome: catalogo.etichetta,
        reparto: catalogo.reparto,
        categoria: catalogo.id,
        origine: 'generata',
        comprata: false,
        quantita: pastiPerCiclo().get(catalogo.id),
        presi: 0,
      })
    }
  })

  it('è deterministica: stessa data, stessa lista', () => {
    const data = new Date(2026, 0, 15)
    expect(generaLista({ data })).toEqual(generaLista({ data }))
  })

  it('cambiando la routine cambiano i numeri', () => {
    const routine: Routine = {
      giorni: [
        { categoria: 'pesce' },
        { categoria: 'pesce' },
        { categoria: 'pesce' },
        { categoria: 'uova' },
        { categoria: 'carne_bianca' },
        { categoria: 'carne_bianca' },
        { categoria: 'formaggio' },
      ],
      pastiPerGiorno: { verdura: 2, frutta: 3 },
    }
    const diversa = generaLista({ routine })

    expect(voce(diversa, 'pesce')?.quantita).toBe(6)
    expect(voce(diversa, 'carne_bianca')?.quantita).toBe(4)
    expect(voce(diversa, 'verdura')?.quantita).toBe(28)
    expect(voce(diversa, 'frutta')?.quantita).toBe(42)
    // Senza sere in routine, la categoria non entra in lista.
    expect(voce(diversa, 'carne_rossa')).toBeUndefined()
    expect(voce(diversa, 'affettati')).toBeUndefined()
  })
})

// Passaggio da un ciclo al successivo

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
