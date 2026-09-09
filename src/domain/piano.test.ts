import { describe, expect, it } from 'vitest'
import { giorniRoutine } from './dati'
import { giornoDellaSettimana, pianoSettimanale } from './piano'

describe('pianoSettimanale', () => {
  it('copre i sette giorni, da lunedì a domenica', () => {
    const piano = pianoSettimanale()
    expect(piano.map((g) => g.giorno)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(piano[0].etichetta).toBe('lunedì')
    expect(piano[6].etichetta).toBe('domenica')
  })

  it('segue la routine di doc/02: mercoledì e sabato pesce, domenica affettati', () => {
    const perGiorno = new Map(pianoSettimanale().map((g) => [g.etichetta, g.categoria]))
    expect(perGiorno.get('lunedì')).toBe('carne_rossa')
    expect(perGiorno.get('martedì')).toBe('formaggio')
    expect(perGiorno.get('mercoledì')).toBe('pesce')
    expect(perGiorno.get('giovedì')).toBe('uova')
    expect(perGiorno.get('venerdì')).toBe('carne_bianca')
    expect(perGiorno.get('sabato')).toBe('pesce')
    expect(perGiorno.get('domenica')).toBe('affettati')
  })

  it('mostra la categoria con l\'etichetta del catalogo, non l\'id', () => {
    const mercoledi = pianoSettimanale().find((g) => g.giorno === 3)
    expect(mercoledi?.etichettaCategoria).toBe('Pesce')
  })

  it('non inventa giorni: sono quelli della routine', () => {
    expect(pianoSettimanale()).toHaveLength(giorniRoutine.length)
  })
})

describe('giornoDellaSettimana', () => {
  it('conta da lunedì (1) a domenica (7)', () => {
    // Lunedì 15 giugno 2026.
    expect(giornoDellaSettimana(new Date(2026, 5, 15))).toBe(1)
    expect(giornoDellaSettimana(new Date(2026, 5, 17))).toBe(3)
    // Domenica, che per getDay() è 0.
    expect(giornoDellaSettimana(new Date(2026, 5, 21))).toBe(7)
  })

  it('trova sempre un giorno del piano', () => {
    const giorni = new Set(pianoSettimanale().map((g) => g.giorno))
    for (let scarto = 0; scarto < 7; scarto++) {
      const data = new Date(2026, 5, 15 + scarto)
      expect(giorni.has(giornoDellaSettimana(data))).toBe(true)
    }
  })
})
