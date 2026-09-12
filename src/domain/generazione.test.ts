import { describe, expect, it } from 'vitest'
import { categorie } from './dati'
import { generaLista, pastiPerCiclo, type Routine } from './generazione'
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
