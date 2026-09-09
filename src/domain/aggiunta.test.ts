import { describe, expect, it } from 'vitest'
import { aggiungiVoce, creaVoceManuale, normalizza, suggerimenti, trovaProdotto } from './aggiunta'
import { listaEsempio } from './listaEsempio'

describe('normalizza', () => {
  it('ignora maiuscole, accenti e spazi di troppo', () => {
    expect(normalizza('  Caffè ')).toBe('caffe')
    expect(normalizza('PANE   in\tcassetta')).toBe('pane in cassetta')
    expect(normalizza('Tè')).toBe('te')
  })
})

describe('trovaProdotto', () => {
  it('riconosce il prodotto scritto con gli accenti', () => {
    expect(trovaProdotto('caffè')?.reparto).toBe('dispensa')
  })

  it('riconosce il prodotto scritto in maiuscolo e con spazi ai bordi', () => {
    expect(trovaProdotto('  CARTA IGIENICA ')?.nome).toBe('carta igienica')
  })

  it('riconosce il prodotto con spazi interni doppi', () => {
    expect(trovaProdotto('detersivo  piatti')?.reparto).toBe('casa_igiene')
  })

  it('non riconosce un prodotto che non è in catalogo', () => {
    expect(trovaProdotto('lievito madre')).toBeUndefined()
  })

  it('a campo vuoto non riconosce niente', () => {
    expect(trovaProdotto('   ')).toBeUndefined()
  })
})

describe('suggerimenti', () => {
  it('propone i prodotti che iniziano col testo digitato', () => {
    expect(suggerimenti('det').map((p) => p.nome)).toContain('detersivo piatti')
  })

  it('non bada ad accenti e maiuscole', () => {
    expect(suggerimenti('CAFFÈ').map((p) => p.nome)).toEqual(['caffe'])
  })

  it('mette prima chi inizia col testo, poi chi lo contiene più avanti', () => {
    const nomi = suggerimenti('pat', 10).map((p) => p.nome)
    expect(nomi.indexOf('patatine')).toBeLessThan(nomi.indexOf('sacchi pattumiera'))
  })

  it('non propone niente a campo vuoto', () => {
    expect(suggerimenti('')).toEqual([])
    expect(suggerimenti('  ')).toEqual([])
  })

  it('si ferma al limite chiesto', () => {
    expect(suggerimenti('a', 3)).toHaveLength(3)
  })
})

describe('creaVoceManuale', () => {
  it('prende reparto e grafia dal catalogo quando il prodotto è riconosciuto', () => {
    const voce = creaVoceManuale('  Caffè ', 'v1')
    expect(voce).toEqual({
      id: 'v1',
      nome: 'caffe',
      reparto: 'dispensa',
      origine: 'manuale',
      comprata: false,
    })
  })

  it('manda un prodotto nuovo nel reparto altro, col nome come è stato scritto', () => {
    const voce = creaVoceManuale('  Lievito  madre ', 'v2')
    expect(voce.nome).toBe('Lievito madre')
    expect(voce.reparto).toBe('altro')
    expect(voce.origine).toBe('manuale')
  })

  it('senza id ne genera uno diverso ogni volta', () => {
    expect(creaVoceManuale('sale').id).not.toBe(creaVoceManuale('sale').id)
  })
})

describe('aggiungiVoce', () => {
  it('mette la voce nuova in fondo alla lista', () => {
    const dopo = aggiungiVoce(listaEsempio, 'yogurt', 'v3')
    expect(dopo.voci).toHaveLength(listaEsempio.voci.length + 1)
    expect(dopo.voci.at(-1)).toMatchObject({ id: 'v3', nome: 'yogurt', reparto: 'latticini_uova' })
  })

  it('lascia intatta la lista di partenza', () => {
    aggiungiVoce(listaEsempio, 'yogurt', 'v3')
    expect(listaEsempio.voci.some((v) => v.id === 'v3')).toBe(false)
  })

  it('con un nome vuoto non aggiunge niente', () => {
    expect(aggiungiVoce(listaEsempio, '   ')).toEqual(listaEsempio)
  })
})
