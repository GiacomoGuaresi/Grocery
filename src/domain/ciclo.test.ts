import { describe, expect, it } from 'vitest'
import { haVociDaRiportare, nuovoCiclo, vociDaRiportare } from './ciclo'
import type { Lista, Voce } from './tipi'

const ilQuindiciDiGiugno = new Date(2026, 5, 15)

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

function nomi(l: Lista): string[] {
  return l.voci.map((voce) => voce.nome)
}

function elementi(l: Lista, id: 'verdura' | 'frutta'): string[] {
  return (l.voci.find((voce) => voce.id === id)?.elementi ?? []).map((e) => e.nome)
}

describe('vociDaRiportare', () => {
  it('sono le voci non spuntate', () => {
    expect(vociDaRiportare(lista([caffe, detersivo]))).toEqual([caffe])
  })

  it('di una voce raggruppata restano i soli tipi non presi', () => {
    const verdura: Voce = {
      id: 'verdura',
      nome: 'Verdura',
      reparto: 'ortofrutta',
      origine: 'generata',
      comprata: false,
      elementi: [
        { nome: 'zucchine', comprato: true },
        { nome: 'spinaci', comprato: false },
      ],
    }
    expect(vociDaRiportare(lista([verdura]))[0].elementi).toEqual([
      { nome: 'spinaci', comprato: false },
    ])
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
    const senzaRiporto = nuovoCiclo({ data: ilQuindiciDiGiugno }).lista
    const primaVoce = senzaRiporto.voci.find((voce) => !voce.elementi)!
    const doppione: Voce = { ...primaVoce, id: 'doppione', nome: primaVoce.nome.toUpperCase() }

    const ciclo = nuovoCiclo({
      data: ilQuindiciDiGiugno,
      precedente: lista([doppione]),
      portaAvanti: true,
    })

    expect(ciclo.lista.voci).toHaveLength(senzaRiporto.voci.length)
  })

  it('i tipi rimasti di verdura entrano nella voce raggruppata, senza crearne un\'altra', () => {
    const senzaRiporto = nuovoCiclo({ data: ilQuindiciDiGiugno }).lista
    const verdura: Voce = {
      id: 'verdura',
      nome: 'Verdura',
      reparto: 'ortofrutta',
      origine: 'generata',
      comprata: false,
      elementi: [
        { nome: 'cavolo nero', comprato: false },
        { nome: elementi(senzaRiporto, 'verdura')[0], comprato: false },
      ],
    }

    const ciclo = nuovoCiclo({
      data: ilQuindiciDiGiugno,
      precedente: lista([verdura]),
      portaAvanti: true,
    })

    expect(ciclo.lista.voci.filter((voce) => voce.id === 'verdura')).toHaveLength(1)
    // Il tipo rimasto si aggiunge, quello già proposto dal ciclo nuovo no.
    expect(elementi(ciclo.lista, 'verdura')).toEqual([
      ...elementi(senzaRiporto, 'verdura'),
      'cavolo nero',
    ])
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
    const senzaRiporto = nuovoCiclo({ data: ilQuindiciDiGiugno }).lista
    const occupato = senzaRiporto.voci.find((voce) => !voce.elementi)!.id
    const vecchia: Voce = { ...caffe, id: occupato }

    const ciclo = nuovoCiclo({
      data: ilQuindiciDiGiugno,
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
