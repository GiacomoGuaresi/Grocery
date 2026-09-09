import initSqlJs from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { PersistenzaMemoria } from '../storage/memoria'
import { apriStorageSqlite } from '../storage/sqlite'
import {
  alternativeElemento,
  alternativeVoce,
  sostituisciElemento,
  sostituisciVoce,
} from './alternative'
import { categoria, diStagione } from './dati'
import { listaEsempio } from './listaEsempio'
import { spuntaVoce } from './spunta'
import type { Lista, Rotazione, Voce } from './tipi'

/** Settembre: il mese della lista di esempio, con la sua stagionalità. */
const settembre = 9

function voce(lista: Lista, id: string): Voce {
  return lista.voci.find((v) => v.id === id)!
}

describe('alternativeVoce', () => {
  it('propone le altre tipologie della categoria', () => {
    const alternative = alternativeVoce(listaEsempio, voce(listaEsempio, 'pesce-2'))
    expect(alternative).toContain('branzino')
    expect(alternative.length).toBeGreaterThan(10)
  })

  it('non ripropone la voce stessa né quello che è già in lista', () => {
    const alternative = alternativeVoce(listaEsempio, voce(listaEsempio, 'pesce-2'))
    expect(alternative).not.toContain('orata')
    expect(alternative).not.toContain('merluzzo')
    expect(alternative).not.toContain('gamberi')
  })

  it('niente per le uova, che una tipologia sola ce l’hanno', () => {
    expect(alternativeVoce(listaEsempio, voce(listaEsempio, 'uova-1'))).toEqual([])
  })

  it('niente per le voci manuali', () => {
    expect(alternativeVoce(listaEsempio, voce(listaEsempio, 'manuale-1'))).toEqual([])
  })

  it('niente per le voci raggruppate: lì si sostituiscono i singoli tipi', () => {
    expect(alternativeVoce(listaEsempio, voce(listaEsempio, 'frutta'))).toEqual([])
  })
})

describe('alternativeElemento', () => {
  it('propone solo frutta di stagione nel mese', () => {
    const alternative = alternativeElemento(
      listaEsempio,
      voce(listaEsempio, 'frutta'),
      'uva',
      settembre,
    )
    const diSettembre = diStagione('frutta', settembre)
    expect(alternative.every((nome) => diSettembre.includes(nome))).toBe(true)
    expect(alternative.length).toBeGreaterThan(0)
  })

  it('a gennaio non propone i fichi', () => {
    expect(
      alternativeElemento(listaEsempio, voce(listaEsempio, 'frutta'), 'uva', 1),
    ).not.toContain('fichi')
  })

  it('non ripropone i tipi già scelti nella voce', () => {
    const alternative = alternativeElemento(
      listaEsempio,
      voce(listaEsempio, 'verdura'),
      'zucchine',
      settembre,
    )
    for (const gia of ['zucchine', 'melanzane', 'spinaci', 'peperoni']) {
      expect(alternative).not.toContain(gia)
    }
  })

  it('niente per un tipo che nella voce non c’è', () => {
    expect(
      alternativeElemento(listaEsempio, voce(listaEsempio, 'frutta'), 'ananas', settembre),
    ).toEqual([])
  })
})

describe('sostituisciVoce', () => {
  it('mette al posto della voce la tipologia scelta', () => {
    const dopo = sostituisciVoce(listaEsempio, 'carne_rossa-1', 'spezzatino di manzo')
    expect(voce(dopo, 'carne_rossa-1').nome).toBe('spezzatino di manzo')
    expect(dopo.voci).toHaveLength(listaEsempio.voci.length)
  })

  it('il reparto segue la tipologia nuova: è un dato del catalogo', () => {
    const surgelato = categoria('pesce')!.tipi.find((t) => t.reparto === 'surgelati')!
    const dopo = sostituisciVoce(listaEsempio, 'pesce-1', surgelato.nome)
    expect(voce(dopo, 'pesce-1').reparto).toBe('surgelati')
  })

  it('un nome fuori dalle alternative non cambia niente', () => {
    expect(sostituisciVoce(listaEsempio, 'carne_rossa-1', 'orata')).toBe(listaEsempio)
    expect(sostituisciVoce(listaEsempio, 'manuale-1', 'caffè in grani')).toBe(listaEsempio)
    expect(sostituisciVoce(listaEsempio, 'non-esiste', 'orata')).toBe(listaEsempio)
  })

  it('lascia intatta la lista di partenza', () => {
    sostituisciVoce(listaEsempio, 'carne_rossa-1', 'spezzatino di manzo')
    expect(voce(listaEsempio, 'carne_rossa-1').nome).toBe('manzo (fettine)')
  })
})

describe('sostituisciElemento', () => {
  it('scambia il tipo dentro la voce raggruppata, lasciando gli altri', () => {
    const nuovo = alternativeElemento(
      listaEsempio,
      voce(listaEsempio, 'verdura'),
      'zucchine',
      settembre,
    )[0]
    const dopo = sostituisciElemento(listaEsempio, 'verdura', 'zucchine', nuovo, settembre)
    const nomi = voce(dopo, 'verdura').elementi!.map((e) => e.nome)
    expect(nomi).toEqual([nuovo, 'melanzane', 'spinaci', 'peperoni'])
  })

  it('il tipo nuovo è da prendere, e la voce torna attiva', () => {
    const presa = spuntaVoce(listaEsempio, 'frutta')
    const nuovo = alternativeElemento(presa, voce(presa, 'frutta'), 'uva', settembre)[0]
    const dopo = sostituisciElemento(presa, 'frutta', 'uva', nuovo, settembre)
    expect(voce(dopo, 'frutta').comprata).toBe(false)
    expect(voce(dopo, 'frutta').elementi).toContainEqual({ nome: nuovo, comprato: false })
  })

  it('un tipo fuori stagione non entra in lista', () => {
    const dopo = sostituisciElemento(listaEsempio, 'frutta', 'uva', 'fichi', 1)
    expect(dopo).toBe(listaEsempio)
  })

  it('niente da fare su una voce non raggruppata', () => {
    expect(sostituisciElemento(listaEsempio, 'pesce-1', 'orata', 'gamberi', settembre)).toBe(
      listaEsempio,
    )
  })
})

describe('la sostituzione non tocca la memoria della rotazione (R7)', () => {
  let SQL: Awaited<ReturnType<typeof initSqlJs>>

  beforeAll(async () => {
    SQL = await initSqlJs()
  })

  it('le rotazioni salvate restano quelle del ciclo generato', async () => {
    const storage = await apriStorageSqlite(SQL, new PersistenzaMemoria())
    const rotazioni: Rotazione[] = [
      { categoria: 'pesce', ultimi: ['orata', 'merluzzo'] },
      { categoria: 'frutta', ultimi: ['uva', 'pere', 'fichi', 'mele'] },
    ]
    await storage.salvaLista(listaEsempio)
    await storage.salvaRotazioni(rotazioni)

    // Quello che fa l'interfaccia quando si sceglie un'alternativa: cambia la
    // lista e salva solo quella.
    const dopo = sostituisciVoce(listaEsempio, 'pesce-2', 'branzino')
    await storage.salvaLista(sostituisciElemento(dopo, 'frutta', 'uva', 'kiwi', settembre))

    // Lo storage non promette un ordine: conta che le righe siano quelle.
    expect(await storage.leggiRotazioni()).toEqual(expect.arrayContaining(rotazioni))
    expect(await storage.leggiRotazioni()).toHaveLength(rotazioni.length)
  })
})
