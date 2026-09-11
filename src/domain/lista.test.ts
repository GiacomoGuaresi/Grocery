import { describe, expect, it } from 'vitest'
import { diStagione, ordineReparto, reparti } from './dati'
import { raggruppaPerReparto, vociAttive } from './lista'
import { listaEsempio } from './listaEsempio'
import type { Voce } from './tipi'

function voce(id: string, reparto: Voce['reparto']): Voce {
  return { id, nome: id, reparto, origine: 'manuale', comprata: false }
}

describe('raggruppaPerReparto', () => {
  it('mette i reparti nell ordine del percorso in corsia', () => {
    const gruppi = raggruppaPerReparto([
      voce('a', 'dispensa'),
      voce('b', 'ortofrutta'),
      voce('c', 'pescheria'),
    ])
    expect(gruppi.map((g) => g.id)).toEqual(['ortofrutta', 'pescheria', 'dispensa'])
  })

  it('non mostra i reparti senza voci', () => {
    const gruppi = raggruppaPerReparto([voce('a', 'macelleria')])
    expect(gruppi).toHaveLength(1)
    expect(gruppi[0].nome).toBe('Macelleria')
  })

  it('su una lista vuota non produce nessun gruppo', () => {
    expect(raggruppaPerReparto([])).toEqual([])
  })

  it('tiene le voci di uno stesso reparto nell ordine della lista', () => {
    const gruppi = raggruppaPerReparto([
      voce('primo', 'macelleria'),
      voce('altrove', 'dispensa'),
      voce('secondo', 'macelleria'),
    ])
    expect(gruppi[0].voci.map((v) => v.id)).toEqual(['primo', 'secondo'])
  })

  it('usa il nome del reparto preso da reparti.json', () => {
    for (const reparto of reparti) {
      const [gruppo] = raggruppaPerReparto([voce('x', reparto.id)])
      expect(gruppo.nome).toBe(reparto.nome)
    }
  })
})

describe('vociAttive', () => {
  it('scarta le voci già comprate', () => {
    const lista = {
      ...listaEsempio,
      voci: [
        { ...voce('presa', 'dispensa'), comprata: true },
        voce('da prendere', 'dispensa'),
      ],
    }
    expect(vociAttive(lista).map((v) => v.id)).toEqual(['da prendere'])
  })
})

describe('lista di esempio', () => {
  it('non ha voci comprate: è una lista appena generata', () => {
    expect(vociAttive(listaEsempio)).toHaveLength(listaEsempio.voci.length)
  })

  it('ha id unici', () => {
    const id = new Set(listaEsempio.voci.map((v) => v.id))
    expect(id.size).toBe(listaEsempio.voci.length)
  })

  it('cita solo reparti esistenti', () => {
    for (const v of listaEsempio.voci) {
      expect(ordineReparto(v.reparto), v.nome).toBeGreaterThanOrEqual(0)
    }
  })

  it('ha 4 tipi di verdura e 4 di frutta di stagione, una voce ciascuno', () => {
    const mese = 9 // la lista di esempio è di settembre
    for (const gruppo of ['verdura', 'frutta'] as const) {
      const tipi = listaEsempio.voci.filter((v) => v.categoria === gruppo)
      expect(tipi).toHaveLength(4)
      const stagione = diStagione(gruppo, mese)
      for (const tipo of tipi) {
        expect(stagione, tipo.nome).toContain(tipo.nome)
      }
    }
  })

  it('lascia qualche reparto vuoto, così si vede che non viene mostrato', () => {
    const usati = new Set(listaEsempio.voci.map((v) => v.reparto))
    expect(usati.size).toBeLessThan(reparti.length)
  })
})
