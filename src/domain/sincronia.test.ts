import { describe, expect, it } from 'vitest'
import { aggiungiVoce } from './aggiunta'
import { eliminaVoce, rinominaVoce } from './modifica'
import { applicaModifiche, differenze, nessunaModifica, unisci } from './sincronia'
import { despuntaVoce, spuntaVoce } from './spunta'
import type { Lista } from './tipi'

const lista: Lista = {
  id: 'lista-1',
  creataIl: '2026-09-07T08:00:00.000Z',
  stato: 'corrente',
  voci: [
    { id: 'verdura-1', nome: 'zucchine', reparto: 'ortofrutta', categoria: 'verdura', origine: 'generata', comprata: false },
    { id: 'pesce-1', nome: 'orata', reparto: 'pescheria', categoria: 'pesce', origine: 'generata', comprata: false },
    { id: 'manuale-1', nome: 'spugne', reparto: 'altro', origine: 'manuale', comprata: false },
  ],
}

const ids = (l: Lista) => l.voci.map((voce) => voce.id)

describe('differenze', () => {
  it('una spunta tocca solo la sua voce', () => {
    const dopo = spuntaVoce(lista, 'pesce-1')
    expect(differenze(lista, dopo)).toEqual({ voci: [dopo.voci[1]], eliminate: [] })
  })

  it('una voce aggiunta c e, una tolta finisce tra le eliminate', () => {
    const aggiunta = aggiungiVoce(lista, 'caffè', 'manuale-2')
    expect(differenze(lista, aggiunta).voci.map((v) => v.id)).toEqual(['manuale-2'])
    expect(differenze(lista, eliminaVoce(lista, 'verdura-1'))).toEqual({
      voci: [],
      eliminate: ['verdura-1'],
    })
  })

  it('una modifica che non cambia niente non manda niente', () => {
    expect(nessunaModifica(differenze(lista, rinominaVoce(lista, 'manuale-1', '  ')))).toBe(true)
    expect(nessunaModifica(differenze(lista, spuntaVoce(lista, 'voce-mai-vista')))).toBe(true)
  })
})

describe('applicaModifiche', () => {
  it('rifà la modifica da cui sono uscite', () => {
    for (const dopo of [
      spuntaVoce(lista, 'pesce-1'),
      eliminaVoce(lista, 'verdura-1'),
      aggiungiVoce(lista, 'caffè', 'manuale-2'),
      rinominaVoce(lista, 'manuale-1', 'spugne abrasive'),
    ]) {
      expect(applicaModifiche(lista, differenze(lista, dopo))).toEqual(dopo)
    }
  })

  it('due dispositivi che spuntano voci diverse tengono entrambe le spunte', () => {
    const qui = differenze(lista, spuntaVoce(lista, 'pesce-1'))
    const la = differenze(lista, spuntaVoce(lista, 'verdura-1'))
    const finale = applicaModifiche(applicaModifiche(lista, qui), la)
    expect(finale.voci.filter((v) => v.comprata).map((v) => v.id)).toEqual(['verdura-1', 'pesce-1'])
  })

  it('sulla stessa voce vince l ultima scrittura', () => {
    const spunta = differenze(lista, spuntaVoce(lista, 'pesce-1'))
    const despunta = differenze(lista, despuntaVoce(spuntaVoce(lista, 'pesce-1'), 'pesce-1'))
    expect(applicaModifiche(applicaModifiche(lista, spunta), despunta).voci[1].comprata).toBe(false)
    expect(applicaModifiche(applicaModifiche(lista, despunta), spunta).voci[1].comprata).toBe(true)
  })

  it('una voce tolta di là non torna per una modifica fatta di qua', () => {
    const tolta = applicaModifiche(lista, { voci: [], eliminate: ['pesce-1'] })
    const spunta = differenze(lista, spuntaVoce(lista, 'pesce-1'))
    expect(ids(applicaModifiche(tolta, { ...spunta, eliminate: ['pesce-1'] }))).toEqual([
      'verdura-1',
      'manuale-1',
    ])
  })
})

describe('unisci', () => {
  it('senza niente in volo vale la lista riletta', () => {
    const letta = spuntaVoce(lista, 'verdura-1')
    expect(unisci(letta, lista, new Set())).toBe(letta)
  })

  it('una voce in volo tiene la versione di qui, le altre quella riletta', () => {
    const locale = spuntaVoce(lista, 'pesce-1')
    const letta = spuntaVoce(lista, 'verdura-1')
    const unita = unisci(letta, locale, new Set(['pesce-1']))
    expect(unita.voci.filter((v) => v.comprata).map((v) => v.id)).toEqual(['verdura-1', 'pesce-1'])
  })

  it('una voce aggiunta qui e non ancora scritta resta, in fondo', () => {
    const locale = aggiungiVoce(lista, 'caffè', 'manuale-2')
    expect(ids(unisci(lista, locale, new Set(['manuale-2'])))).toEqual([...ids(lista), 'manuale-2'])
  })

  it('una voce tolta qui e non ancora cancellata non ricompare', () => {
    const locale = eliminaVoce(lista, 'verdura-1')
    expect(ids(unisci(lista, locale, new Set(['verdura-1'])))).toEqual(['pesce-1', 'manuale-1'])
  })

  it('se di là è nata una lista nuova vale quella', () => {
    const nuova: Lista = { ...lista, id: 'lista-2', voci: [] }
    expect(unisci(nuova, spuntaVoce(lista, 'pesce-1'), new Set(['pesce-1']))).toBe(nuova)
  })
})
