import { describe, expect, it } from 'vitest'
import { normalizza } from './aggiunta'
import { categorie, stagionalita } from './dati'
import { generaLista, meseDi, occorrenzePerCiclo } from './generazione'
import type { IdCategoria, Lista, Voce } from './tipi'

/**
 * Una sorgente del caso riproducibile (mulberry32): stesso seme, stessa
 * sequenza. Serve a testare un algoritmo che per scelta non è deterministico
 * (doc/03, R2) senza che i test diventino ballerini.
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

/** Il 15 del mese: una data qualsiasi dentro il mese, senza sorprese di fuso. */
function ilQuindici(mese: number): Date {
  return new Date(2026, mese - 1, 15)
}

function vociDi(lista: Lista, categoria: NonNullable<Voce['categoria']>): Voce[] {
  return lista.voci.filter((voce) => voce.categoria === categoria)
}

function nomi(voci: Voce[]): string[] {
  return voci.map((voce) => voce.nome)
}

/** I tipi di verdura o di frutta del ciclo: una voce ciascuno. */
function tipi(lista: Lista, gruppo: 'verdura' | 'frutta'): string[] {
  return nomi(vociDi(lista, gruppo))
}

describe('meseDi', () => {
  it('gennaio è 1 e dicembre è 12', () => {
    expect(meseDi(ilQuindici(1))).toBe(1)
    expect(meseDi(ilQuindici(12))).toBe(12)
  })
})

describe('occorrenzePerCiclo', () => {
  it('copre il ciclo come la routine di doc/02', () => {
    expect(Object.fromEntries(occorrenzePerCiclo())).toEqual({
      carne_rossa: 2,
      formaggio: 2,
      pesce: 4,
      uova: 2,
      carne_bianca: 2,
      affettati: 2,
    })
  })

  it('sono 14 cene in tutto', () => {
    const totale = [...occorrenzePerCiclo().values()].reduce((a, b) => a + b, 0)
    expect(totale).toBe(14)
  })
})

describe('generaLista — copertura', () => {
  const lista = generaLista({ data: ilQuindici(6) })

  it('genera tante voci quante le occorrenze di ogni categoria, le uova una sola', () => {
    for (const [categoria, quante] of occorrenzePerCiclo()) {
      expect(vociDi(lista, categoria)).toHaveLength(categoria === 'uova' ? 1 : quante)
    }
  })

  it('più una voce per ogni tipo di verdura e di frutta, in ortofrutta', () => {
    // 14 cene, ma le due di uova sono una voce sola.
    expect(lista.voci).toHaveLength(13 + 4 + 4)
    for (const gruppo of ['verdura', 'frutta'] as const) {
      const voci = vociDi(lista, gruppo)
      expect(voci).toHaveLength(4)
      expect(voci.every((voce) => voce.reparto === 'ortofrutta')).toBe(true)
    }
  })

  it('ogni voce ha il suo id', () => {
    const ids = lista.voci.map((voce) => voce.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sono tutte voci generate e non spuntate', () => {
    expect(lista.voci.every((voce) => voce.origine === 'generata')).toBe(true)
    expect(lista.voci.every((voce) => !voce.comprata)).toBe(true)
  })

  it('ogni voce porta il reparto della sua categoria', () => {
    for (const catalogo of categorie) {
      for (const voce of vociDi(lista, catalogo.id)) {
        expect(voce.reparto).toBe(catalogo.reparto)
      }
    }
  })
})

describe('generaLista — varietà dentro il ciclo', () => {
  const lista = generaLista({ data: ilQuindici(6) })

  it('le tipologie della stessa categoria sono diverse tra loro', () => {
    for (const categoria of ['carne_rossa', 'carne_bianca', 'pesce', 'formaggio', 'affettati'] as IdCategoria[]) {
      const scelte = nomi(vociDi(lista, categoria))
      expect(new Set(scelte).size).toBe(scelte.length)
    }
  })

  it('le uova tornano due volte nella routine ma sono una voce sola', () => {
    expect(nomi(vociDi(lista, 'uova'))).toEqual(['uova'])
  })

  it('nessuna voce si ripete, in nessun mese e con nessun seme', () => {
    for (let mese = 1; mese <= 12; mese++) {
      for (let seme = 1; seme <= 5; seme++) {
        const lista = generaLista({ data: ilQuindici(mese), caso: caso(mese * 10 + seme) })
        const tutti = lista.voci.map((voce) => normalizza(voce.nome))
        expect(new Set(tutti).size).toBe(tutti.length)
      }
    }
  })

  it('i 4 tipi di verdura e i 4 di frutta sono diversi tra loro', () => {
    expect(new Set(tipi(lista, 'verdura')).size).toBe(4)
    expect(new Set(tipi(lista, 'frutta')).size).toBe(4)
  })
})

describe('generaLista — scelta casuale', () => {
  it('a parità di seme esce sempre la stessa lista', () => {
    const prima = generaLista({ data: ilQuindici(3), id: 'x', caso: caso(7) })
    const seconda = generaLista({ data: ilQuindici(3), id: 'x', caso: caso(7) })
    expect(seconda).toEqual(prima)
  })

  it('non segue l’ordine del catalogo: semi diversi, liste diverse', () => {
    const carne = categorie.find((c) => c.id === 'carne_rossa')!
    const primi = carne.consigli.slice(0, 2)
    const uscite = [1, 2, 3, 4, 5].map((seme) =>
      nomi(vociDi(generaLista({ data: ilQuindici(3), caso: caso(seme) }), 'carne_rossa')),
    )

    expect(new Set(uscite.map((u) => u.join('|'))).size).toBeGreaterThan(1)
    expect(uscite.every((u) => u.join('|') === primi.join('|'))).toBe(false)
  })

  it('gira su tutto il catalogo, non su un angolo solo', () => {
    // Il motivo del cambio (doc/10): a giro fisso capitavano cicli interi
    // sullo stesso animale, cambiando solo il taglio.
    const scelte = new Set<string>()
    for (let seme = 1; seme <= 20; seme++) {
      const lista = generaLista({ data: ilQuindici(6), caso: caso(seme) })
      for (const nome of nomi(vociDi(lista, 'carne_rossa'))) scelte.add(nome)
    }
    expect(scelte.size).toBe(categorie.find((c) => c.id === 'carne_rossa')!.consigli.length)
  })
})

describe('generaLista — stagionalità', () => {
  it('a gennaio non escono pomodori', () => {
    const lista = generaLista({ data: ilQuindici(1) })
    expect(tipi(lista, 'verdura')).not.toContain('pomodori')
  })

  it('sceglie solo verdura e frutta del mese, in ogni mese', () => {
    for (let mese = 1; mese <= 12; mese++) {
      const lista = generaLista({ data: ilQuindici(mese) })
      for (const gruppo of ['verdura', 'frutta'] as const) {
        for (const nome of tipi(lista, gruppo)) {
          expect(stagionalita[gruppo][nome]).toContain(mese)
        }
      }
    }
  })
})
