import { describe, expect, it } from 'vitest'
import { categorie, stagionalita } from './dati'
import { generaLista, meseDi, occorrenzePerCiclo } from './generazione'
import type { IdCategoria, Lista, Voce } from './tipi'

/** Il 15 del mese: una data qualsiasi dentro il mese, senza sorprese di fuso. */
function ilQuindici(mese: number): Date {
  return new Date(2026, mese - 1, 15)
}

function vociDi(lista: Lista, categoria: IdCategoria): Voce[] {
  return lista.voci.filter((voce) => voce.categoria === categoria)
}

function nomi(voci: Voce[]): string[] {
  return voci.map((voce) => voce.nome)
}

function elementi(lista: Lista, id: 'verdura' | 'frutta'): string[] {
  const voce = lista.voci.find((v) => v.id === id)
  return (voce?.elementi ?? []).map((elemento) => elemento.nome)
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

  it('più le due voci raggruppate di verdura e frutta', () => {
    expect(lista.voci).toHaveLength(16)
    expect(elementi(lista, 'verdura')).toHaveLength(4)
    expect(elementi(lista, 'frutta')).toHaveLength(4)
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
    expect(new Set(elementi(lista, 'verdura')).size).toBe(4)
    expect(new Set(elementi(lista, 'frutta')).size).toBe(4)
  })
})

describe('generaLista — rotazione deterministica', () => {
  it('a parità di data e rotazioni esce sempre la stessa lista', () => {
    const prima = generaLista({ data: ilQuindici(3), id: 'x' })
    const seconda = generaLista({ data: ilQuindici(3), id: 'x' })
    expect(seconda.lista).toEqual(prima.lista)
    expect(seconda.rotazioni).toEqual(prima.rotazioni)
  })

  it('senza memoria si parte dall’inizio del catalogo', () => {
    const { lista } = generaLista({ data: ilQuindici(3) })
    const carne = categorie.find((c) => c.id === 'carne_rossa')!
    expect(nomi(vociDi(lista, 'carne_rossa'))).toEqual([carne.tipi[0].nome, carne.tipi[1].nome])
  })

  it('salva la posizione raggiunta in ogni catalogo', () => {
    const { rotazioni } = generaLista({ data: ilQuindici(3) })
    const perCategoria = Object.fromEntries(
      rotazioni.map((r) => [r.categoria, r.ultimoIndice]),
    )
    expect(perCategoria.carne_rossa).toBe(1)
    expect(perCategoria.pesce).toBe(3)
    expect(perCategoria.uova).toBe(-1)
  })

  it('due cicli consecutivi non ripropongono le stesse tipologie', () => {
    const primo = generaLista({ data: ilQuindici(6) })
    const secondo = generaLista({ data: ilQuindici(6), rotazioni: primo.rotazioni })

    for (const categoria of ['carne_rossa', 'carne_bianca', 'pesce', 'formaggio', 'affettati'] as IdCategoria[]) {
      const prime = new Set(nomi(vociDi(primo.lista, categoria)))
      for (const nome of nomi(vociDi(secondo.lista, categoria))) {
        expect(prime).not.toContain(nome)
      }
    }
  })

  it('due cicli consecutivi non ripropongono verdura e frutta', () => {
    const primo = generaLista({ data: ilQuindici(6) })
    const secondo = generaLista({ data: ilQuindici(6), rotazioni: primo.rotazioni })

    for (const gruppo of ['verdura', 'frutta'] as const) {
      const prima = new Set(elementi(primo.lista, gruppo))
      for (const nome of elementi(secondo.lista, gruppo)) {
        expect(prima).not.toContain(nome)
      }
    }
  })

  it('il catalogo riparte dall’inizio quando finisce', () => {
    const carne = categorie.find((c) => c.id === 'carne_rossa')!
    const { lista } = generaLista({
      data: ilQuindici(6),
      rotazioni: [{ categoria: 'carne_rossa', ultimoIndice: carne.tipi.length - 1 }],
    })
    expect(nomi(vociDi(lista, 'carne_rossa'))).toEqual([carne.tipi[0].nome, carne.tipi[1].nome])
  })
})

describe('generaLista — stagionalità', () => {
  it('a gennaio non escono pomodori', () => {
    const { lista } = generaLista({ data: ilQuindici(1) })
    expect(elementi(lista, 'verdura')).not.toContain('pomodori')
  })

  it('sceglie solo verdura e frutta del mese, in ogni mese', () => {
    for (let mese = 1; mese <= 12; mese++) {
      const { lista } = generaLista({ data: ilQuindici(mese) })
      for (const gruppo of ['verdura', 'frutta'] as const) {
        for (const nome of elementi(lista, gruppo)) {
          expect(stagionalita[gruppo][nome]).toContain(mese)
        }
      }
    }
  })

  it('la rotazione continua anche cambiando mese', () => {
    const giugno = generaLista({ data: ilQuindici(6) })
    const luglio = generaLista({ data: ilQuindici(7), rotazioni: giugno.rotazioni })
    expect(elementi(luglio.lista, 'frutta')).not.toEqual(elementi(giugno.lista, 'frutta'))
  })
})
