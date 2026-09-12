import { describe, expect, it } from 'vitest'
import {
  categoria,
  categorie,
  diStagione,
  giorniRoutine,
  mesi,
  pastiPerGiorno,
  prodotti,
  reparti,
  stagionalita,
  type IdVoceCatalogo,
} from './dati'

const idReparti = new Set(reparti.map((r) => r.id))

/** Tutte le categorie che la routine mette in lista: le sere più verdura e frutta. */
const categorieRoutine: IdVoceCatalogo[] = [
  ...giorniRoutine.map((g) => g.categoria),
  ...(Object.keys(pastiPerGiorno) as IdVoceCatalogo[]),
]

describe('coerenza dei dati statici', () => {
  it('i reparti hanno id unici', () => {
    expect(idReparti.size).toBe(reparti.length)
  })

  it('ogni categoria del catalogo sta in un reparto di reparti.json', () => {
    for (const c of categorie) {
      expect(idReparti, c.id).toContain(c.reparto)
    }
  })

  it('ogni reparto citato nei prodotti esiste in reparti.json', () => {
    for (const prodotto of prodotti) {
      expect(idReparti, prodotto.nome).toContain(prodotto.reparto)
    }
  })

  it('ogni categoria della routine è nel catalogo, con un reparto', () => {
    for (const id of categorieRoutine) {
      expect(categoria(id)?.reparto, id).toBeDefined()
    }
  })

  it('la routine copre i sette giorni della settimana, una volta ciascuno', () => {
    expect(giorniRoutine.map((g) => g.giorno)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('verdura una volta al giorno, frutta due', () => {
    expect(pastiPerGiorno).toEqual({ verdura: 1, frutta: 2 })
  })

  it('ogni categoria tranne le uova ha consigli, senza ripetizioni', () => {
    for (const c of categorie) {
      if (c.id === 'uova') continue
      expect(c.consigli.length, c.id).toBeGreaterThan(0)
      expect(new Set(c.consigli).size, c.id).toBe(c.consigli.length)
    }
  })

  it('le uova non hanno consigli', () => {
    expect(categoria('uova')?.consigli).toEqual([])
  })

  it('i consigli di verdura e frutta sono la tabella di stagionalità', () => {
    expect(categoria('verdura')?.consigli).toEqual(Object.keys(stagionalita.verdura))
    expect(categoria('frutta')?.consigli).toEqual(Object.keys(stagionalita.frutta))
  })

  it('ogni mese ha verdura e frutta di stagione', () => {
    for (const mese of mesi) {
      expect(diStagione('verdura', mese).length, `verdura, mese ${mese}`).toBeGreaterThan(0)
      expect(diStagione('frutta', mese).length, `frutta, mese ${mese}`).toBeGreaterThan(0)
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
