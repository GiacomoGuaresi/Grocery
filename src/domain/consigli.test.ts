import { describe, expect, it } from 'vitest'
import { consigliVoce, meseDopo, type Consigli, type TipoConsigliato } from './consigli'
import type { Mese } from './dati'
import type { Voce } from './tipi'

const generata = (categoria: NonNullable<Voce['categoria']>): Voce => ({
  id: categoria,
  nome: categoria,
  reparto: 'ortofrutta',
  categoria,
  origine: 'generata',
  comprata: false,
  quantita: 4,
  presi: 0,
})

function stagione(categoria: 'verdura' | 'frutta', mese: Mese) {
  const consigli = consigliVoce(generata(categoria), mese) as Extract<Consigli, { tipo: 'stagione' }>
  expect(consigli.tipo).toBe('stagione')
  const trova = (elenco: TipoConsigliato[], nome: string) => elenco.find((t) => t.nome === nome)
  return {
    di: (nome: string) => trova(consigli.diStagione, nome),
    fuori: (nome: string) => trova(consigli.fuoriStagione, nome),
    ...consigli,
  }
}

describe('meseDopo', () => {
  it('dopo dicembre viene gennaio', () => {
    expect(meseDopo(12)).toBe(1)
    expect(meseDopo(1)).toBe(2)
    expect(meseDopo(11)).toBe(12)
  })
})

describe('consigliVoce', () => {
  it('le carni, il pesce, il formaggio e gli affettati hanno l\'elenco breve', () => {
    for (const categoria of ['carne_rossa', 'carne_bianca', 'pesce', 'formaggio', 'affettati'] as const) {
      const consigli = consigliVoce(generata(categoria), 9)
      expect(consigli?.tipo).toBe('elenco')
    }
    expect(consigliVoce(generata('carne_bianca'), 9)).toEqual({
      tipo: 'elenco',
      tipi: ['pollo', 'tacchino', 'coniglio', 'faraona'],
    })
  })

  it('le uova, le manuali e le generate v1 senza contatore non hanno consigli', () => {
    expect(consigliVoce(generata('uova'), 9)).toBeNull()
    expect(consigliVoce({ ...generata('pesce'), origine: 'manuale' }, 9)).toBeNull()
    const { quantita: _q, presi: _p, ...v1 } = generata('pesce')
    expect(consigliVoce(v1, 9)).toBeNull()
  })

  it('divide di stagione e fuori stagione senza perdere tipi', () => {
    const { diStagione, fuoriStagione, di, fuori } = stagione('frutta', 9)
    expect(di('uva')).toBeDefined()
    expect(fuori('ciliegie')).toBeDefined()
    const nomi = [...diStagione, ...fuoriStagione].map((t) => t.nome)
    expect(new Set(nomi).size).toBe(nomi.length)
  })

  it('segna quello che c\'è tutto l\'anno', () => {
    expect(stagione('frutta', 7).di('mele')?.chip).toBe("tutto l'anno")
    expect(stagione('verdura', 7).di('patate')?.chip).toBe("tutto l'anno")
  })

  it('in uscita se il mese prossimo non c\'è più, in arrivo se c\'è dal prossimo', () => {
    const marzo = stagione('verdura', 3)
    expect(marzo.fuori('asparagi')?.chip).toBe('in arrivo')
    expect(stagione('verdura', 6).di('asparagi')?.chip).toBe('in uscita')
    expect(stagione('verdura', 5).di('asparagi')?.chip).toBeUndefined()
    expect(stagione('verdura', 9).fuori('agretti')?.chip).toBeUndefined()
  })

  it('a cavallo d\'anno: a dicembre guarda gennaio', () => {
    const dicembre = stagione('frutta', 12)
    // I cachi finiscono a dicembre: a gennaio non ci sono più.
    expect(dicembre.di('cachi')?.chip).toBe('in uscita')
    // Le arance ci sono anche a gennaio: non escono.
    expect(dicembre.di('arance')?.chip).toBeUndefined()
    expect(stagione('verdura', 12).di('sedano')?.chip).toBe('in uscita')
    expect(stagione('verdura', 12).di('broccoli')?.chip).toBeUndefined()
  })

  it('a cavallo d\'anno: a gennaio i cachi sono fuori stagione, non in arrivo', () => {
    const gennaio = stagione('frutta', 1)
    expect(gennaio.fuori('cachi')).toEqual({ nome: 'cachi' })
    // I cardi, da ottobre a gennaio, a gennaio escono.
    expect(stagione('verdura', 1).di('cardi')?.chip).toBe('in uscita')
  })
})
