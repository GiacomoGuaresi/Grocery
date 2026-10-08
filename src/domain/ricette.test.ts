import { describe, expect, it } from 'vitest'
import { nuovoCiclo } from './generazione'
import { raggruppaPerReparto, raggruppaPerRicetta } from './lista'
import { cambiaReparto, repartoSceglibile } from './modifica'
import {
  aggiungiIngredienti,
  categorieRicette,
  eQuantoBasta,
  filtraRicette,
  ingredientiDaScegliere,
  nomeIngrediente,
} from './ricette'
import type { Lista, Ricetta, Voce } from './tipi'

const torta: Ricetta = {
  id: 'ricetta-torta',
  nome: 'Torta di mele',
  url: 'https://esempio.it/torta-di-mele',
  categorie: ['Dolci', 'Torte'],
  ingredienti: ['Mele 4', 'Burro 100 g', 'Uova 2', 'Sale q.b.', 'Pecorino Romano DOP 50 g'],
  creataIl: '2026-10-08T10:00:00.000Z',
}

const carbonara: Ricetta = {
  id: 'ricetta-carbonara',
  nome: 'Spaghetti alla Carbonara',
  url: 'https://esempio.it/carbonara',
  categorie: ['Primi piatti'],
  ingredienti: ['Spaghetti 320 g', 'Guanciale 150 g'],
  creataIl: '2026-10-07T10:00:00.000Z',
}

function manuale(id: string, nome: string, comprata = false): Voce {
  return { id, nome, reparto: 'altro', origine: 'manuale', comprata }
}

const lista: Lista = {
  id: 'lista-1',
  creataIl: '2026-10-01T08:00:00.000Z',
  voci: [
    { id: 'uova', nome: 'Uova', reparto: 'latticini_uova', categoria: 'uova', origine: 'generata', comprata: false },
    manuale('pecorino', 'pecorino'),
    manuale('burro', 'burro', true),
  ],
}

describe('eQuantoBasta', () => {
  it('riconosce q.b., qb e quanto basta', () => {
    expect(eQuantoBasta('Pepe nero q.b.')).toBe(true)
    expect(eQuantoBasta('sale qb')).toBe(true)
    expect(eQuantoBasta('Olio extravergine Q.B.')).toBe(true)
    expect(eQuantoBasta('prezzemolo quanto basta')).toBe(true)
  })

  it('non scambia per q.b. gli ingredienti con la quantità', () => {
    expect(eQuantoBasta('Burro 100 g')).toBe(false)
    expect(eQuantoBasta('Squbbo 2')).toBe(false)
  })
})

describe('nomeIngrediente', () => {
  it('toglie quantità, unità e parentesi', () => {
    expect(nomeIngrediente('Pecorino Romano DOP 50 g')).toBe('pecorino romano dop')
    expect(nomeIngrediente('Tuorli (di uova medie) 6')).toBe('tuorli')
    expect(nomeIngrediente('caffè solubile 1 cucchiaino')).toBe('caffe solubile')
    expect(nomeIngrediente('latte 1/2 l')).toBe('latte')
    expect(nomeIngrediente('farina di riso 200 g')).toBe('farina di riso')
  })
})

describe('ingredientiDaScegliere', () => {
  it('tutti scelti tranne i q.b., nell’ordine del sito', () => {
    const scelta = ingredientiDaScegliere(torta, lista)
    expect(scelta.map((i) => i.testo)).toEqual(torta.ingredienti)
    expect(scelta.map((i) => i.scelto)).toEqual([true, true, true, false, true])
  })

  it('segna quelli già da prendere, ma non quelli già presi', () => {
    const gia = ingredientiDaScegliere(torta, lista).filter((i) => i.giaInLista).map((i) => i.testo)
    // Le uova generate e il pecorino manuale; il burro è già nel carrello.
    expect(gia).toEqual(['Uova 2', 'Pecorino Romano DOP 50 g'])
  })

  it('confronta anche con gli ingredienti di un’altra ricetta in lista', () => {
    const conCarbonara = aggiungiIngredienti(lista, carbonara, ['Guanciale 150 g'])
    const altra: Ricetta = { ...torta, ingredienti: ['guanciale 200 g'] }
    expect(ingredientiDaScegliere(altra, conCarbonara)[0].giaInLista).toBe(true)
  })

  it('senza lista niente è già in lista', () => {
    expect(ingredientiDaScegliere(torta, null).some((i) => i.giaInLista)).toBe(false)
  })
})

describe('aggiungiIngredienti', () => {
  it('in fondo, col testo del sito, manuali in "Altro" sotto la ricetta', () => {
    const nuova = aggiungiIngredienti(lista, torta, ['Mele 4', '  Burro   100 g '], ['a', 'b'])
    expect(nuova.voci.slice(lista.voci.length)).toEqual([
      { id: 'a', nome: 'Mele 4', reparto: 'altro', origine: 'manuale', comprata: false, ricetta: { id: torta.id, nome: torta.nome } },
      { id: 'b', nome: 'Burro 100 g', reparto: 'altro', origine: 'manuale', comprata: false, ricetta: { id: torta.id, nome: torta.nome } },
    ])
  })

  it('aggiunge anche quello che c’è già: ogni ricetta tiene i suoi', () => {
    const nuova = aggiungiIngredienti(lista, torta, ['Uova 2'])
    expect(nuova.voci).toHaveLength(lista.voci.length + 1)
  })

  it('senza ingredienti scelti la lista resta la stessa', () => {
    expect(aggiungiIngredienti(lista, torta, [])).toBe(lista)
    expect(aggiungiIngredienti(lista, torta, ['  '])).toBe(lista)
  })

  it('la voce di una ricetta non cambia reparto', () => {
    const nuova = aggiungiIngredienti(lista, torta, ['Mele 4'], ['mele'])
    expect(repartoSceglibile(nuova.voci.at(-1)!)).toBe(false)
    expect(cambiaReparto(nuova, 'mele', 'ortofrutta')).toEqual(nuova)
  })
})

describe('gruppi delle ricette in lista', () => {
  const conRicette = aggiungiIngredienti(
    aggiungiIngredienti(
      aggiungiIngredienti(lista, carbonara, ['Spaghetti 320 g'], ['s']),
      torta,
      ['Mele 4'],
      ['m'],
    ),
    carbonara,
    ['Guanciale 150 g'],
    ['g'],
  )

  it('i reparti non contano gli ingredienti delle ricette', () => {
    const ids = raggruppaPerReparto(conRicette.voci).flatMap((g) => g.voci.map((v) => v.id))
    expect(ids).toEqual(['uova', 'pecorino', 'burro'])
  })

  it('un gruppo per ricetta, nell’ordine di arrivo, con le sue voci', () => {
    const gruppi = raggruppaPerRicetta(conRicette.voci)
    expect(gruppi.map((g) => g.ricetta.nome)).toEqual(['Spaghetti alla Carbonara', 'Torta di mele'])
    expect(gruppi[0].voci.map((v) => v.id)).toEqual(['s', 'g'])
  })

  it('al ciclo nuovo gli ingredienti non presi si riportano con la loro ricetta', () => {
    const presaUna = {
      ...conRicette,
      voci: conRicette.voci.map((v) => (v.id === 's' ? { ...v, comprata: true } : v)),
    }
    const nuova = nuovoCiclo({ precedente: presaUna, portaAvanti: true, data: new Date(2026, 9, 8) })
    const riportate = nuova.voci.filter((v) => v.ricetta)
    expect(riportate.map((v) => v.id)).toEqual(['m', 'g'])
    expect(riportate[1].ricetta).toEqual({ id: carbonara.id, nome: carbonara.nome })
  })
})

describe('sezione Ricette', () => {
  const ricette = [torta, carbonara]

  it('le categorie per i chip, senza doppioni e in ordine alfabetico', () => {
    const conDoppione = { ...carbonara, id: 'x', categorie: ['dolci', 'Primi piatti'] }
    expect(categorieRicette([...ricette, conDoppione])).toEqual(['Dolci', 'Primi piatti', 'Torte'])
  })

  it('cerca nel nome senza badare a maiuscole e accenti', () => {
    expect(filtraRicette(ricette, 'CARBONÀRA', null)).toEqual([carbonara])
    expect(filtraRicette(ricette, '', null)).toEqual(ricette)
  })

  it('filtra per categoria, anche insieme alla ricerca', () => {
    expect(filtraRicette(ricette, '', 'dolci')).toEqual([torta])
    expect(filtraRicette(ricette, 'spaghetti', 'Dolci')).toEqual([])
  })
})
