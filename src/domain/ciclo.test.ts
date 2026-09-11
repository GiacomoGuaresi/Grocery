import { describe, expect, it } from 'vitest'
import { haVociDaRiportare, nuovoCiclo, vociDaRiportare } from './ciclo'
import type { Lista, Voce } from './tipi'

const ilQuindiciDiGiugno = new Date(2026, 5, 15)

/**
 * La generazione pesca a caso (doc/03, R2): con un seme fisso due chiamate
 * danno la stessa lista, ed è quello che serve per confrontarle qui.
 */
function caso(seme: number): () => number {
  let stato = seme >>> 0
  return () => {
    stato = (stato + 0x6d2b79f5) >>> 0
    let t = stato
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Le opzioni di un ciclo generato sempre uguale, per poterlo confrontare. */
function stessaGenerazione() {
  return { data: ilQuindiciDiGiugno, caso: caso(42) }
}

function lista(voci: Voce[]): Lista {
  return { id: 'precedente', creataIl: '2026-06-01T08:00:00.000Z', stato: 'corrente', voci }
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

function verdura(id: string, nome: string, comprata = false): Voce {
  return { id, nome, reparto: 'ortofrutta', categoria: 'verdura', origine: 'generata', comprata }
}

function nomi(l: Lista): string[] {
  return l.voci.map((voce) => voce.nome)
}

describe('vociDaRiportare', () => {
  it('sono le voci non spuntate', () => {
    expect(vociDaRiportare(lista([caffe, detersivo]))).toEqual([caffe])
  })

  it('della verdura restano i soli tipi non presi', () => {
    const rimaste = vociDaRiportare(
      lista([verdura('verdura-1', 'zucchine', true), verdura('verdura-2', 'spinaci')]),
    )
    expect(rimaste.map((voce) => voce.nome)).toEqual(['spinaci'])
  })

  it('senza lista precedente non c’è niente da riportare', () => {
    expect(vociDaRiportare(null)).toEqual([])
    expect(haVociDaRiportare(null)).toBe(false)
    expect(haVociDaRiportare(lista([detersivo]))).toBe(false)
    expect(haVociDaRiportare(lista([caffe]))).toBe(true)
  })
})

describe('nuovoCiclo', () => {
  it('la prima generazione non archivia niente', () => {
    const ciclo = nuovoCiclo({ data: ilQuindiciDiGiugno })
    expect(ciclo.archiviata).toBeNull()
    expect(ciclo.lista.stato).toBe('corrente')
    expect(ciclo.rotazioni.length).toBeGreaterThan(0)
  })

  it('archivia la lista precedente senza toccarne le voci', () => {
    const precedente = lista([caffe, detersivo])
    const ciclo = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente })

    expect(ciclo.archiviata).toEqual({ ...precedente, stato: 'archiviata' })
    expect(precedente.stato).toBe('corrente')
    expect(ciclo.lista.id).not.toBe(precedente.id)
  })

  it('senza conferma le voci rimaste non passano nella lista nuova', () => {
    const ciclo = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente: lista([caffe]) })
    expect(nomi(ciclo.lista)).not.toContain('caffè')
  })

  it('con la conferma porta avanti le voci non spuntate, non quelle prese', () => {
    const ciclo = nuovoCiclo({
      data: ilQuindiciDiGiugno,
      precedente: lista([caffe, detersivo]),
      portaAvanti: true,
    })

    expect(nomi(ciclo.lista)).toContain('caffè')
    expect(nomi(ciclo.lista)).not.toContain('detersivo piatti')
  })

  it('non raddoppia quello che il nuovo ciclo propone già', () => {
    const senzaRiporto = nuovoCiclo(stessaGenerazione()).lista
    const primaVoce = senzaRiporto.voci[0]
    const doppione: Voce = { ...primaVoce, id: 'doppione', nome: primaVoce.nome.toUpperCase() }

    const ciclo = nuovoCiclo({
      ...stessaGenerazione(),
      precedente: lista([doppione]),
      portaAvanti: true,
    })

    expect(ciclo.lista.voci).toHaveLength(senzaRiporto.voci.length)
  })

  it('un tipo di verdura rimasto torna come voce a sé, se il ciclo nuovo non lo propone già', () => {
    const senzaRiporto = nuovoCiclo(stessaGenerazione()).lista
    const giaProposta = senzaRiporto.voci.find((voce) => voce.categoria === 'verdura')!

    const ciclo = nuovoCiclo({
      ...stessaGenerazione(),
      precedente: lista([verdura('verdura-1', 'cavolo nero'), verdura('verdura-2', giaProposta.nome)]),
      portaAvanti: true,
    })

    // Il tipo rimasto si aggiunge, quello già proposto dal ciclo nuovo no.
    expect(ciclo.lista.voci).toHaveLength(senzaRiporto.voci.length + 1)
    expect(nomi(ciclo.lista).filter((nome) => nome === 'cavolo nero')).toHaveLength(1)
    expect(nomi(ciclo.lista).filter((nome) => nome === giaProposta.nome)).toHaveLength(1)
    const ids = ciclo.lista.voci.map((voce) => voce.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('quello che si porta avanti arriva da prendere, non spuntato', () => {
    const rimasta: Voce = { ...caffe, comprata: false }
    const ciclo = nuovoCiclo({
      data: ilQuindiciDiGiugno,
      precedente: lista([rimasta]),
      portaAvanti: true,
    })
    expect(ciclo.lista.voci.find((voce) => voce.nome === 'caffè')?.comprata).toBe(false)
  })

  it('una voce riportata non ruba l\'id a una voce del ciclo nuovo', () => {
    const senzaRiporto = nuovoCiclo(stessaGenerazione()).lista
    const occupato = senzaRiporto.voci[0].id
    const vecchia: Voce = { ...caffe, id: occupato }

    const ciclo = nuovoCiclo({
      ...stessaGenerazione(),
      precedente: lista([vecchia]),
      portaAvanti: true,
    })

    const ids = ciclo.lista.voci.map((voce) => voce.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ciclo.lista.voci.find((voce) => voce.nome === 'caffè')?.id).toBe(`riportata-${occupato}`)
  })

  it('la generazione non è in place: la lista nuova è un oggetto a parte', () => {
    const precedente = lista([caffe])
    const ciclo = nuovoCiclo({ data: ilQuindiciDiGiugno, precedente, portaAvanti: true })

    expect(ciclo.lista).not.toBe(precedente)
    expect(precedente.voci).toEqual([caffe])
  })
})
