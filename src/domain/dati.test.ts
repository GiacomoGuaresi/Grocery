import { describe, expect, it } from 'vitest'
import {
  categorie,
  diStagione,
  giorniRoutine,
  gruppiFissi,
  mesi,
  prodotti,
  reparti,
  stagionalita,
} from './dati'

const idReparti = new Set(reparti.map((r) => r.id))
const idCategorie = new Set(categorie.map((c) => c.id))

describe('coerenza dei dati statici', () => {
  it('i reparti hanno id unici', () => {
    expect(idReparti.size).toBe(reparti.length)
  })

  it('ogni reparto citato nel catalogo esiste in reparti.json', () => {
    for (const categoria of categorie) {
      for (const tipo of categoria.tipi) {
        expect(idReparti, `${categoria.id} → ${tipo.nome}`).toContain(tipo.reparto)
      }
    }
  })

  it('ogni reparto citato nei prodotti esiste in reparti.json', () => {
    for (const prodotto of prodotti) {
      expect(idReparti, prodotto.nome).toContain(prodotto.reparto)
    }
  })

  it('ogni reparto dei gruppi fissi esiste in reparti.json', () => {
    for (const gruppo of Object.values(gruppiFissi)) {
      expect(idReparti).toContain(gruppo.reparto)
    }
  })

  it('ogni categoria della routine esiste nel catalogo', () => {
    for (const giorno of giorniRoutine) {
      expect(idCategorie, giorno.nome).toContain(giorno.categoria)
    }
  })

  it('la routine copre i sette giorni della settimana, una volta ciascuno', () => {
    expect(giorniRoutine.map((g) => g.giorno)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('ogni categoria ha almeno un tipo, e nomi non ripetuti', () => {
    for (const categoria of categorie) {
      expect(categoria.tipi.length, categoria.id).toBeGreaterThan(0)
      const nomi = new Set(categoria.tipi.map((t) => t.nome))
      expect(nomi.size, categoria.id).toBe(categoria.tipi.length)
    }
  })

  it('ogni mese ha almeno 4 verdure e 4 frutti di stagione', () => {
    for (const mese of mesi) {
      expect(diStagione('verdura', mese).length, `verdura, mese ${mese}`)
        .toBeGreaterThanOrEqual(gruppiFissi.verdura.tipiPerCiclo)
      expect(diStagione('frutta', mese).length, `frutta, mese ${mese}`)
        .toBeGreaterThanOrEqual(gruppiFissi.frutta.tipiPerCiclo)
    }
  })

  it('la stagionalità usa solo mesi da 1 a 12, senza ripetizioni', () => {
    for (const [gruppo, tabella] of Object.entries(stagionalita)) {
      for (const [nome, mesiDisponibili] of Object.entries(tabella)) {
        expect(mesiDisponibili.length, `${gruppo} → ${nome}`).toBeGreaterThan(0)
        expect(new Set(mesiDisponibili).size, `${gruppo} → ${nome}`).toBe(mesiDisponibili.length)
        for (const mese of mesiDisponibili) {
          expect(mesi, `${gruppo} → ${nome}`).toContain(mese)
        }
      }
    }
  })
})
