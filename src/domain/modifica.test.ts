import { describe, expect, it } from 'vitest'
import { aggiungiVoce } from './aggiunta'
import { listaEsempio } from './listaEsempio'
import { eliminaVoce, rinominabile, rinominaVoce } from './modifica'
import type { Lista } from './tipi'

/** Una lista con una voce manuale nuova ("Altro") e una manuale riconosciuta. */
function conVociManuali(): Lista {
  const conNuova = aggiungiVoce(listaEsempio, 'lievito madre', 'manuale-nuova')
  return aggiungiVoce(conNuova, 'caffè', 'manuale-nota')
}

function voce(lista: Lista, id: string) {
  return lista.voci.find((v) => v.id === id)
}

describe('rinominabile', () => {
  it('sì per una voce manuale finita in Altro', () => {
    expect(rinominabile(voce(conVociManuali(), 'manuale-nuova')!)).toBe(true)
  })

  it('no per una voce manuale riconosciuta dal catalogo', () => {
    expect(rinominabile(voce(conVociManuali(), 'manuale-nota')!)).toBe(false)
  })

  it('no per una voce generata', () => {
    expect(rinominabile(voce(listaEsempio, 'carne_rossa-1')!)).toBe(false)
  })
})

describe('eliminaVoce', () => {
  it('toglie una voce generata', () => {
    const dopo = eliminaVoce(listaEsempio, 'carne_rossa-1')
    expect(voce(dopo, 'carne_rossa-1')).toBeUndefined()
    expect(dopo.voci).toHaveLength(listaEsempio.voci.length - 1)
  })

  it('toglie anche una voce raggruppata, con tutti i suoi elementi', () => {
    expect(voce(eliminaVoce(listaEsempio, 'frutta'), 'frutta')).toBeUndefined()
  })

  it('toglie una voce già comprata', () => {
    const presa = { ...listaEsempio, voci: listaEsempio.voci.map((v) => ({ ...v, comprata: true })) }
    expect(voce(eliminaVoce(presa, 'carne_rossa-1'), 'carne_rossa-1')).toBeUndefined()
  })

  it("un id che non esiste lascia la lista com'è", () => {
    expect(eliminaVoce(listaEsempio, 'non-c-e').voci).toEqual(listaEsempio.voci)
  })

  it('non tocca la lista di partenza', () => {
    const quante = listaEsempio.voci.length
    eliminaVoce(listaEsempio, 'carne_rossa-1')
    expect(listaEsempio.voci).toHaveLength(quante)
  })
})

describe('rinominaVoce', () => {
  it('cambia il nome di una voce manuale in Altro', () => {
    const dopo = rinominaVoce(conVociManuali(), 'manuale-nuova', 'lievito di birra')
    expect(voce(dopo, 'manuale-nuova')?.nome).toBe('lievito di birra')
  })

  it('ripulisce spazi ai bordi e spazi doppi', () => {
    const dopo = rinominaVoce(conVociManuali(), 'manuale-nuova', '  farina   0  ')
    expect(voce(dopo, 'manuale-nuova')?.nome).toBe('farina 0')
  })

  it('non rinomina una voce generata', () => {
    const dopo = rinominaVoce(listaEsempio, 'carne_rossa-1', 'filetto')
    expect(voce(dopo, 'carne_rossa-1')?.nome).toBe('manzo (fettine)')
  })

  it('non rinomina una voce manuale riconosciuta dal catalogo', () => {
    const dopo = rinominaVoce(conVociManuali(), 'manuale-nota', 'caffè decaffeinato')
    expect(voce(dopo, 'manuale-nota')?.nome).toBe('caffe')
  })

  it("un nome vuoto lascia la lista com'è", () => {
    const prima = conVociManuali()
    expect(rinominaVoce(prima, 'manuale-nuova', '   ').voci).toEqual(prima.voci)
  })

  it('non cambia il reparto, nemmeno col nome di un prodotto in catalogo', () => {
    const dopo = rinominaVoce(conVociManuali(), 'manuale-nuova', 'caffè')
    expect(voce(dopo, 'manuale-nuova')?.reparto).toBe('altro')
  })

  it('lascia intatta la spunta', () => {
    const prima = conVociManuali()
    const presa = { ...prima, voci: prima.voci.map((v) => ({ ...v, comprata: true })) }
    expect(voce(rinominaVoce(presa, 'manuale-nuova', 'segale'), 'manuale-nuova')?.comprata).toBe(true)
  })
})
