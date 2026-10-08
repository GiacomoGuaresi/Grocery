import { describe, expect, it } from 'vitest'
import { aggiungiVoce } from './aggiunta'
import { passoTra, riporta } from './cronologia'
import { listaEsempio } from './listaEsempio'
import { eliminaVoce, rinominaVoce } from './modifica'
import { spuntaVoce } from './spunta'

const ids = (voci: { id: string }[]) => voci.map((v) => v.id)

describe('passoTra', () => {
  it('nullo se non cambia niente', () => {
    expect(passoTra(listaEsempio, listaEsempio)).toBeNull()
  })

  it('ricorda com era la voce e com è diventata', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = passoTra(listaEsempio, dopo)!
    expect(passo.cambi).toHaveLength(1)
    expect(passo.cambi[0].prima?.comprata).toBe(false)
    expect(passo.cambi[0].dopo?.comprata).toBe(true)
  })
})

describe('riporta', () => {
  it('annulla e ripristina una spunta', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = passoTra(listaEsempio, dopo)!
    const annullata = riporta(dopo, passo, 'annulla')
    expect(annullata.voci.find((v) => v.id === 'carne_rossa-1')?.comprata).toBe(false)
    expect(riporta(annullata, passo, 'ripristina').voci.find((v) => v.id === 'carne_rossa-1')?.comprata).toBe(true)
  })

  it("un'eliminazione annullata rimette la voce al suo posto", () => {
    const dopo = eliminaVoce(listaEsempio, 'frutta-2')
    const annullata = riporta(dopo, passoTra(listaEsempio, dopo)!, 'annulla')
    expect(ids(annullata.voci)).toEqual(ids(listaEsempio.voci))
  })

  it("un'aggiunta annullata toglie la voce, ripristinata la rimette", () => {
    const dopo = aggiungiVoce(listaEsempio, 'lievito', 'nuova')
    const passo = passoTra(listaEsempio, dopo)!
    const annullata = riporta(dopo, passo, 'annulla')
    expect(annullata.voci.some((v) => v.id === 'nuova')).toBe(false)
    expect(riporta(annullata, passo, 'ripristina').voci.some((v) => v.id === 'nuova')).toBe(true)
  })

  it('non tocca le voci cambiate intanto da altri', () => {
    const conNuova = aggiungiVoce(listaEsempio, 'lievito', 'nuova')
    const dopo = rinominaVoce(conNuova, 'nuova', 'lievito madre')
    const passo = passoTra(conNuova, dopo)!
    const altrove = spuntaVoce(dopo, 'carne_rossa-1')
    const annullata = riporta(altrove, passo, 'annulla')
    expect(annullata.voci.find((v) => v.id === 'nuova')?.nome).toBe('lievito')
    expect(annullata.voci.find((v) => v.id === 'carne_rossa-1')?.comprata).toBe(true)
  })

  it('un passo di una lista vecchia non tocca la nuova', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = passoTra(listaEsempio, dopo)!
    const nuova = { ...dopo, id: 'altra' }
    expect(riporta(nuova, passo, 'annulla')).toBe(nuova)
  })
})
