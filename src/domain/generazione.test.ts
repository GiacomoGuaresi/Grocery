import { describe, expect, it } from 'vitest'
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
  const { lista } = generaLista({ data: ilQuindici(6) })

  it('genera tante voci quante le occorrenze di ogni categoria', () => {
    for (const [categoria, quante] of occorrenzePerCiclo()) {
      expect(vociDi(lista, categoria)).toHaveLength(quante)
    }
  })

  it('più una voce per ogni tipo di verdura e di frutta, in ortofrutta', () => {
    expect(lista.voci).toHaveLength(14 + 4 + 4)
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

  it('sono tutte voci generate, non spuntate, e nasce una lista corrente', () => {
    expect(lista.voci.every((voce) => voce.origine === 'generata')).toBe(true)
    expect(lista.voci.every((voce) => !voce.comprata)).toBe(true)
    expect(lista.stato).toBe('corrente')
  })

  it('ogni voce porta il reparto del suo catalogo', () => {
    for (const catalogo of categorie) {
      const reparti = new Set(catalogo.tipi.map((tipo) => tipo.reparto))
      for (const voce of vociDi(lista, catalogo.id)) {
        expect(reparti).toContain(voce.reparto)
      }
    }
  })
})

describe('generaLista — varietà dentro il ciclo', () => {
  const { lista } = generaLista({ data: ilQuindici(6) })

  it('le tipologie della stessa categoria sono diverse tra loro', () => {
    for (const categoria of ['carne_rossa', 'carne_bianca', 'pesce', 'formaggio', 'affettati'] as IdCategoria[]) {
      const scelte = nomi(vociDi(lista, categoria))
      expect(new Set(scelte).size).toBe(scelte.length)
    }
  })

  it('le uova sono l’eccezione: due voci identiche, senza rotazione', () => {
    expect(nomi(vociDi(lista, 'uova'))).toEqual(['uova', 'uova'])
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
    expect(seconda.lista).toEqual(prima.lista)
    expect(seconda.rotazioni).toEqual(prima.rotazioni)
  })

  it('non segue l’ordine del catalogo: semi diversi, liste diverse', () => {
    const carne = categorie.find((c) => c.id === 'carne_rossa')!
    const primi = [carne.tipi[0].nome, carne.tipi[1].nome]
    const uscite = [1, 2, 3, 4, 5].map((seme) =>
      nomi(vociDi(generaLista({ data: ilQuindici(3), caso: caso(seme) }).lista, 'carne_rossa')),
    )

    expect(new Set(uscite.map((u) => u.join('|'))).size).toBeGreaterThan(1)
    expect(uscite.every((u) => u.join('|') === primi.join('|'))).toBe(false)
  })

  it('gira su tutto il catalogo, non su un angolo solo', () => {
    // Il motivo del cambio (doc/10): a giro fisso capitavano cicli interi
    // sullo stesso animale, cambiando solo il taglio.
    const scelte = new Set<string>()
    for (let seme = 1; seme <= 20; seme++) {
      const { lista } = generaLista({ data: ilQuindici(6), caso: caso(seme) })
      for (const nome of nomi(vociDi(lista, 'carne_rossa'))) scelte.add(nome)
    }
    expect(scelte.size).toBeGreaterThan(15)
  })

  it('salva le tipologie proposte, che sono quelle della lista', () => {
    const { lista, rotazioni } = generaLista({ data: ilQuindici(3), caso: caso(9) })
    const perCategoria = Object.fromEntries(rotazioni.map((r) => [r.categoria, r.ultimi]))

    expect(perCategoria.carne_rossa).toEqual(nomi(vociDi(lista, 'carne_rossa')))
    expect(perCategoria.pesce).toEqual(nomi(vociDi(lista, 'pesce')))
    expect(perCategoria.verdura).toEqual(tipi(lista, 'verdura'))
    // Le uova non ruotano: non c'è niente da ricordare.
    expect(perCategoria.uova).toEqual([])
  })

  it('due cicli consecutivi non ripropongono le stesse tipologie', () => {
    const primo = generaLista({ data: ilQuindici(6), caso: caso(11) })
    const secondo = generaLista({ data: ilQuindici(6), rotazioni: primo.rotazioni, caso: caso(12) })

    for (const categoria of ['carne_rossa', 'carne_bianca', 'pesce', 'formaggio', 'affettati'] as IdCategoria[]) {
      const prime = new Set(nomi(vociDi(primo.lista, categoria)))
      for (const nome of nomi(vociDi(secondo.lista, categoria))) {
        expect(prime).not.toContain(nome)
      }
    }
  })

  it('due cicli consecutivi non ripropongono verdura e frutta, in nessun mese', () => {
    for (let mese = 1; mese <= 12; mese++) {
      const primo = generaLista({ data: ilQuindici(mese), caso: caso(mese) })
      const secondo = generaLista({
        data: ilQuindici(mese),
        rotazioni: primo.rotazioni,
        caso: caso(mese + 100),
      })

      for (const gruppo of ['verdura', 'frutta'] as const) {
        const prima = new Set(tipi(primo.lista, gruppo))
        for (const nome of tipi(secondo.lista, gruppo)) {
          expect(prima).not.toContain(nome)
        }
      }
    }
  })

  it('se il mese non offre abbastanza tipi si ripescano quelli del ciclo prima', () => {
    // Memoria che copre tutta la frutta: non resta niente di nuovo da pescare,
    // ma escono lo stesso 4 tipi di stagione.
    const tuttaLaFrutta = Object.keys(stagionalita.frutta)
    const { lista } = generaLista({
      data: ilQuindici(3),
      rotazioni: [{ categoria: 'frutta', ultimi: tuttaLaFrutta }],
      caso: caso(3),
    })

    expect(new Set(tipi(lista, 'frutta')).size).toBe(4)
    for (const nome of tipi(lista, 'frutta')) {
      expect(stagionalita.frutta[nome]).toContain(3)
    }
  })
})

describe('generaLista — stagionalità', () => {
  it('a gennaio non escono pomodori', () => {
    const { lista } = generaLista({ data: ilQuindici(1) })
    expect(tipi(lista, 'verdura')).not.toContain('pomodori')
  })

  it('sceglie solo verdura e frutta del mese, in ogni mese', () => {
    for (let mese = 1; mese <= 12; mese++) {
      const { lista } = generaLista({ data: ilQuindici(mese) })
      for (const gruppo of ['verdura', 'frutta'] as const) {
        for (const nome of tipi(lista, gruppo)) {
          expect(stagionalita[gruppo][nome]).toContain(mese)
        }
      }
    }
  })

  it('la memoria vale anche cambiando mese', () => {
    const giugno = generaLista({ data: ilQuindici(6), caso: caso(21) })
    const luglio = generaLista({
      data: ilQuindici(7),
      rotazioni: giugno.rotazioni,
      caso: caso(22),
    })
    const prima = new Set(tipi(giugno.lista, 'frutta'))
    for (const nome of tipi(luglio.lista, 'frutta')) expect(prima).not.toContain(nome)
  })
})
