import { describe, expect, it } from 'vitest'
import { aggiungiVoce } from './aggiunta'
import { listaEsempio } from './listaEsempio'
import { cambiaReparto, eliminaVoce, rinominabile, rinominaVoce } from './modifica'
import type { Lista } from './tipi'

/** Una lista con una voce manuale nuova ("Altro") e una manuale riconosciuta. */
function conVociManuali(): Lista {
  const conNuova = aggiungiVoce(listaEsempio, 'lievito madre', 'manuale-nuova')
  return aggiungiVoce(conNuova, 'Carta igienica', 'manuale-nota')
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

  it('toglie un solo tipo di frutta, lasciando gli altri', () => {
    const dopo = eliminaVoce(listaEsempio, 'frutta-2')
    expect(dopo.voci.filter((v) => v.categoria === 'frutta').map((v) => v.nome)).toEqual([
      'uva',
      'fichi',
      'mele',
    ])
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
    const dopo = rinominaVoce(conVociManuali(), 'manuale-nota', 'carta da forno')
    expect(voce(dopo, 'manuale-nota')?.nome).toBe('carta igienica')
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

describe('cambiaReparto', () => {
  it('mette una voce manuale di Altro nel reparto scelto', () => {
    const dopo = cambiaReparto(conVociManuali(), 'manuale-nuova', 'dispensa')
    expect(voce(dopo, 'manuale-nuova')?.reparto).toBe('dispensa')
  })

  it('una volta nel reparto non si rinomina né si sposta più', () => {
    const dopo = cambiaReparto(conVociManuali(), 'manuale-nuova', 'dispensa')
    expect(rinominabile(voce(dopo, 'manuale-nuova')!)).toBe(false)
    const ancora = cambiaReparto(dopo, 'manuale-nuova', 'casa_igiene')
    expect(voce(ancora, 'manuale-nuova')?.reparto).toBe('dispensa')
  })

  it('non sposta una voce manuale riconosciuta dal catalogo', () => {
    const dopo = cambiaReparto(conVociManuali(), 'manuale-nota', 'dispensa')
    expect(voce(dopo, 'manuale-nota')?.reparto).toBe('casa_igiene')
  })

  it('non sposta una voce generata', () => {
    const dopo = cambiaReparto(listaEsempio, 'carne_rossa-1', 'dispensa')
    expect(voce(dopo, 'carne_rossa-1')?.reparto).toBe('macelleria')
  })

  it("rifiuta Altro come scelta, lasciando la lista com'è", () => {
    const prima = conVociManuali()
    expect(cambiaReparto(prima, 'manuale-nuova', 'altro')).toBe(prima)
  })

  it('lascia intatti nome e spunta', () => {
    const prima = conVociManuali()
    const presa = { ...prima, voci: prima.voci.map((v) => ({ ...v, comprata: true })) }
    const dopo = voce(cambiaReparto(presa, 'manuale-nuova', 'dispensa'), 'manuale-nuova')
    expect(dopo).toMatchObject({ nome: 'lievito madre', comprata: true })
  })
})
