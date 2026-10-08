import { describe, expect, it } from 'vitest'
import { aggiungiVoce } from './aggiunta'
import { Cronologia, passoTra, rimappa, riporta } from './cronologia'
import { listaEsempio } from './listaEsempio'
import { eliminaVoce, rinominaVoce } from './modifica'
import { spuntaVoce } from './spunta'
import type { Lista } from './tipi'

const ids = (lista: Lista) => lista.voci.map((v) => v.id)
const voce = (lista: Lista, id: string) => lista.voci.find((v) => v.id === id)

/** Id nuovi prevedibili: nuovo-1, nuovo-2… */
function contatoreId() {
  let n = 0
  return () => `nuovo-${++n}`
}

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
  it('annulla e ripristina una spunta, senza id nuovi', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = passoTra(listaEsempio, dopo)!
    const annullata = riporta(dopo, passo, 'annulla', contatoreId())
    expect(voce(annullata.lista, 'carne_rossa-1')?.comprata).toBe(false)
    expect(annullata.mappa.size).toBe(0)
    const rifatta = riporta(annullata.lista, passo, 'ripristina', contatoreId())
    expect(voce(rifatta.lista, 'carne_rossa-1')?.comprata).toBe(true)
  })

  it("un'eliminazione annullata rimette la voce con un id nuovo: il database non riprende quello vecchio", () => {
    const dopo = eliminaVoce(listaEsempio, 'frutta-2')
    const { lista, mappa } = riporta(dopo, passoTra(listaEsempio, dopo)!, 'annulla', contatoreId())
    expect(mappa.get('frutta-2')).toBe('nuovo-1')
    expect(voce(lista, 'frutta-2')).toBeUndefined()
    expect(voce(lista, 'nuovo-1')).toEqual({ ...voce(listaEsempio, 'frutta-2'), id: 'nuovo-1' })
  })

  it('non tocca le voci cambiate intanto da altri', () => {
    const conNuova = aggiungiVoce(listaEsempio, 'lievito', 'nuova')
    const dopo = rinominaVoce(conNuova, 'nuova', 'lievito madre')
    const passo = passoTra(conNuova, dopo)!
    const altrove = spuntaVoce(dopo, 'carne_rossa-1')
    const { lista } = riporta(altrove, passo, 'annulla', contatoreId())
    expect(voce(lista, 'nuova')?.nome).toBe('lievito')
    expect(voce(lista, 'carne_rossa-1')?.comprata).toBe(true)
  })

  it('un passo di una lista vecchia non tocca la nuova', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = passoTra(listaEsempio, dopo)!
    const nuova = { ...dopo, id: 'altra' }
    expect(riporta(nuova, passo, 'annulla', contatoreId()).lista).toBe(nuova)
  })
})

describe('rimappa', () => {
  it('cambia gli id del passo, anche dentro le voci', () => {
    const dopo = spuntaVoce(listaEsempio, 'carne_rossa-1')
    const passo = rimappa(passoTra(listaEsempio, dopo)!, new Map([['carne_rossa-1', 'x']]))
    expect(passo.cambi[0].id).toBe('x')
    expect(passo.cambi[0].prima?.id).toBe('x')
    expect(passo.cambi[0].dopo?.id).toBe('x')
  })
})

/** Una lista con la sua cronologia, modificata come fa useLista. */
function banco(iniziale: Lista = listaEsempio) {
  const cronologia = new Cronologia(contatoreId())
  let lista = iniziale
  return {
    cronologia,
    get lista() {
      return lista
    },
    set lista(nuova: Lista) {
      lista = nuova
    },
    modifica(trasforma: (lista: Lista) => Lista) {
      const dopo = trasforma(lista)
      cronologia.registra(lista, dopo)
      lista = dopo
    },
    salta(verso: 'annulla' | 'ripristina') {
      const passo = cronologia.prossimo(verso)
      if (!passo) return false
      const fatto = cronologia.salta(lista, verso, passo)
      if (fatto) lista = fatto.lista
      return fatto !== null
    },
  }
}

describe('Cronologia', () => {
  it('annulla e ripristina più modifiche nell ordine giusto', () => {
    const b = banco()
    b.modifica((l) => spuntaVoce(l, 'carne_rossa-1'))
    b.modifica((l) => eliminaVoce(l, 'verdura-1'))
    b.modifica((l) => aggiungiVoce(l, 'lievito', 'lievito'))
    const finale = b.lista

    expect(b.salta('annulla')).toBe(true)
    expect(voce(b.lista, 'lievito')).toBeUndefined()
    expect(b.salta('annulla')).toBe(true)
    expect(b.lista.voci.filter((v) => v.nome === 'zucchine')).toHaveLength(1)
    expect(b.salta('annulla')).toBe(true)
    expect(voce(b.lista, 'carne_rossa-1')?.comprata).toBe(false)
    expect(b.salta('annulla')).toBe(false)
    expect(b.cronologia.puoAnnullare).toBe(false)

    b.salta('ripristina')
    b.salta('ripristina')
    b.salta('ripristina')
    expect(b.cronologia.puoRipristinare).toBe(false)
    expect(voce(b.lista, 'carne_rossa-1')?.comprata).toBe(true)
    expect(b.lista.voci.some((v) => v.nome === 'zucchine')).toBe(false)
    // Il lievito è tornato, con un id nuovo.
    expect(b.lista.voci.filter((v) => v.nome === 'lievito')).toHaveLength(1)
    expect(b.lista.voci).toHaveLength(finale.voci.length)
  })

  it('elimina, annulla, ripristina, annulla: la voce segue gli id nuovi', () => {
    const b = banco()
    b.modifica((l) => eliminaVoce(l, 'frutta-2'))
    b.salta('annulla')
    expect(voce(b.lista, 'nuovo-1')?.nome).toBe(voce(listaEsempio, 'frutta-2')?.nome)
    b.salta('ripristina')
    expect(voce(b.lista, 'nuovo-1')).toBeUndefined()
    b.salta('annulla')
    expect(voce(b.lista, 'nuovo-2')?.nome).toBe(voce(listaEsempio, 'frutta-2')?.nome)
    expect(b.lista.voci).toHaveLength(listaEsempio.voci.length)
  })

  it('una voce aggiunta, spuntata, eliminata: annullando tutto sparisce, rifacendo tutto pure', () => {
    const b = banco()
    b.modifica((l) => aggiungiVoce(l, 'lievito', 'lievito'))
    b.modifica((l) => spuntaVoce(l, 'lievito'))
    b.modifica((l) => eliminaVoce(l, 'lievito'))

    b.salta('annulla') // torna, spuntata, come nuovo-1
    expect(voce(b.lista, 'nuovo-1')?.comprata).toBe(true)
    b.salta('annulla') // de-spuntata: il passo ora parla di nuovo-1
    expect(voce(b.lista, 'nuovo-1')?.comprata).toBe(false)
    b.salta('annulla') // tolta
    expect(ids(b.lista)).toEqual(ids(listaEsempio))

    b.salta('ripristina') // aggiunta di nuovo, come nuovo-2
    b.salta('ripristina') // spuntata
    expect(voce(b.lista, 'nuovo-2')?.comprata).toBe(true)
    b.salta('ripristina') // eliminata
    expect(ids(b.lista)).toEqual(ids(listaEsempio))
  })

  it('una modifica nuova svuota il ripristina', () => {
    const b = banco()
    b.modifica((l) => spuntaVoce(l, 'carne_rossa-1'))
    b.salta('annulla')
    expect(b.cronologia.puoRipristinare).toBe(true)
    b.modifica((l) => spuntaVoce(l, 'pesce-1'))
    expect(b.cronologia.puoRipristinare).toBe(false)
  })

  it('il passo mostrato si fa anche se intanto ne è arrivato un altro sopra', () => {
    const b = banco()
    b.modifica((l) => spuntaVoce(l, 'carne_rossa-1'))
    const mostrato = b.cronologia.prossimo('annulla')!
    // Mentre la riga esce, arriva la modifica di uno swipe.
    b.modifica((l) => spuntaVoce(l, 'pesce-1'))
    const fatto = b.cronologia.salta(b.lista, 'annulla', mostrato)!
    expect(voce(fatto.lista, 'carne_rossa-1')?.comprata).toBe(false)
    expect(voce(fatto.lista, 'pesce-1')?.comprata).toBe(true)
    // Resta da annullare lo swipe.
    expect(b.cronologia.prossimo('annulla')?.cambi[0].id).toBe('pesce-1')
  })

  it('lo stesso passo non si fa due volte', () => {
    const b = banco()
    b.modifica((l) => spuntaVoce(l, 'carne_rossa-1'))
    const passo = b.cronologia.prossimo('annulla')!
    expect(b.cronologia.salta(b.lista, 'annulla', passo)).not.toBeNull()
    expect(b.cronologia.salta(b.lista, 'annulla', passo)).toBeNull()
  })

  it('una lista nuova la svuota', () => {
    const b = banco()
    b.modifica((l) => spuntaVoce(l, 'carne_rossa-1'))
    b.cronologia.perLista('altra')
    expect(b.cronologia.puoAnnullare).toBe(false)
  })

  it('ne ricorda al massimo 30', () => {
    const b = banco()
    for (let n = 0; n < 40; n++) b.modifica((l) => aggiungiVoce(l, `cosa ${n}`, `id-${n}`))
    let annullati = 0
    while (b.salta('annulla')) annullati++
    expect(annullati).toBe(30)
  })
})
