// Il ciclo offline → online (Step 16): più dispositivi finti, ognuno con la
// sua memoria locale, il suo orologio e la sua rete, attaccati allo stesso
// database in memoria.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { eliminaVoce } from '../domain/modifica'
import { despuntaVoce, spuntaVoce } from '../domain/spunta'
import type { Lista } from '../domain/tipi'
import { alle, lista } from './contratto'
import { Collegamento, StorageInMemoria } from './inMemoria'
import { MemoriaLocale, type Scaffale } from './memoriaLocale'
import { Sincronizzatore } from './sincronizzatore'

/** Il localStorage di un dispositivo. */
function scaffale(): Scaffale {
  const dati = new Map<string, string>()
  return { getItem: (chiave) => dati.get(chiave) ?? null, setItem: (chiave, valore) => void dati.set(chiave, valore) }
}

const aperti: Sincronizzatore[] = []

afterEach(() => {
  for (const sincronizzatore of aperti.splice(0)) sincronizzatore.chiudi()
  vi.restoreAllMocks()
})

/** Un dispositivo: la sua rete, la sua memoria, il suo orologio (fermo finché non lo si sposta). */
function dispositivo(db: StorageInMemoria, memoria = scaffale()) {
  const rete = new Collegamento(db)
  let ora = alle('10:00')
  const sincronizzatore = new Sincronizzatore({
    storage: async () => rete,
    memoria: new MemoriaLocale(memoria),
    adesso: () => new Date(ora),
    pausa: 0,
  })
  aperti.push(sincronizzatore)
  return {
    sincronizzatore,
    rete,
    memoria,
    alle: (quando: string) => {
      ora = alle(quando)
    },
    lista(): Lista {
      const { stato } = sincronizzatore.leggi()
      if (stato.fase !== 'pronta') throw new Error(`Nessuna lista a schermo: ${stato.fase}`)
      return stato.lista
    },
  }
}

async function conLista(): Promise<StorageInMemoria> {
  const db = new StorageInMemoria()
  await db.salvaLista(lista)
  return db
}

const comprata = (l: Lista | null, id: string) => l?.voci.find((voce) => voce.id === id)?.comprata
const ids = (l: Lista | null) => l?.voci.map((voce) => voce.id)

describe('senza rete', () => {
  it('le modifiche restano a schermo, sopravvivono alla chiusura e partono al ritorno della rete', async () => {
    const db = await conLista()
    const memoria = scaffale()
    const prima = dispositivo(db, memoria)
    await prima.sincronizzatore.apri()

    prima.rete.stacca()
    prima.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    prima.sincronizzatore.modifica((l) => eliminaVoce(l, 'verdura-1'))
    await prima.sincronizzatore.finito()
    expect(ids(prima.lista())).toEqual(['pesce-1', 'manuale-1'])
    expect(prima.sincronizzatore.leggi()).toMatchObject({ inAttesa: 2, senzaRete: true })
    expect(await db.leggiListaCorrente()).toEqual(lista)
    prima.sincronizzatore.chiudi()

    // L'app riaperta, ancora senza rete: la lista è quella lasciata.
    const dopo = dispositivo(db, memoria)
    dopo.rete.stacca()
    await dopo.sincronizzatore.apri()
    expect(ids(dopo.lista())).toEqual(['pesce-1', 'manuale-1'])
    expect(comprata(dopo.lista(), 'pesce-1')).toBe(true)
    expect(dopo.sincronizzatore.leggi()).toMatchObject({ inAttesa: 2, senzaRete: true })

    dopo.rete.riattacca()
    await vi.waitFor(() =>
      expect(dopo.sincronizzatore.leggi()).toMatchObject({ inAttesa: 0, senzaRete: false }),
    )
    await dopo.sincronizzatore.finito()
    const sulDatabase = await db.leggiListaCorrente()
    expect(ids(sulDatabase)).toEqual(['pesce-1', 'manuale-1'])
    expect(comprata(sulDatabase, 'pesce-1')).toBe(true)
    expect(dopo.lista()).toEqual(sulDatabase)
  })

  it('la prima apertura senza rete non ha niente da mostrare, finché la rete non torna', async () => {
    const db = await conLista()
    const nuovo = dispositivo(db)
    nuovo.rete.stacca()
    await nuovo.sincronizzatore.apri()
    expect(nuovo.sincronizzatore.leggi().stato.fase).toBe('errore')

    nuovo.rete.riattacca()
    await vi.waitFor(() => expect(nuovo.sincronizzatore.leggi().stato.fase).toBe('pronta'))
    expect(nuovo.lista()).toEqual(lista)
  })
})

describe('last-write-wins con la coda', () => {
  it('una spunta rimasta in coda non vince su una modifica più recente fatta altrove', async () => {
    const db = await conLista()
    const qui = dispositivo(db)
    const la = dispositivo(db)
    await qui.sincronizzatore.apri()
    await la.sincronizzatore.apri()

    qui.rete.stacca()
    qui.alle('10:00')
    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    la.alle('10:05')
    la.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    la.alle('10:06')
    la.sincronizzatore.modifica((l) => despuntaVoce(l, 'pesce-1'))
    await la.sincronizzatore.finito()

    // Torna la rete: la spunta delle 10:00 arriva per ultima, ma è la più vecchia.
    qui.rete.riattacca()
    await vi.waitFor(() => expect(qui.sincronizzatore.leggi().inAttesa).toBe(0))
    await qui.sincronizzatore.finito()
    expect(comprata(await db.leggiListaCorrente(), 'pesce-1')).toBe(false)
    expect(comprata(qui.lista(), 'pesce-1')).toBe(false)
  })

  it('le spunte fatte senza rete su voci diverse si sommano a quelle dell altro', async () => {
    const db = await conLista()
    const qui = dispositivo(db)
    const la = dispositivo(db)
    await qui.sincronizzatore.apri()
    await la.sincronizzatore.apri()

    qui.rete.stacca()
    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    la.sincronizzatore.modifica((l) => spuntaVoce(l, 'verdura-1'))
    await la.sincronizzatore.finito()

    qui.rete.riattacca()
    await vi.waitFor(() => expect(qui.sincronizzatore.leggi().inAttesa).toBe(0))
    await qui.sincronizzatore.finito()
    expect(qui.lista().voci.every((voce) => voce.comprata)).toBe(true)
  })

  it('una voce eliminata altrove non torna per una modifica rimasta in coda', async () => {
    const db = await conLista()
    const qui = dispositivo(db)
    const la = dispositivo(db)
    await qui.sincronizzatore.apri()
    await la.sincronizzatore.apri()

    qui.rete.stacca()
    qui.alle('10:05')
    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'verdura-1'))
    la.alle('10:00')
    la.sincronizzatore.modifica((l) => eliminaVoce(l, 'verdura-1'))
    await la.sincronizzatore.finito()

    qui.rete.riattacca()
    await vi.waitFor(() => expect(qui.sincronizzatore.leggi().inAttesa).toBe(0))
    await qui.sincronizzatore.finito()
    expect(ids(await db.leggiListaCorrente())).toEqual(['pesce-1', 'manuale-1'])
    expect(ids(qui.lista())).toEqual(['pesce-1', 'manuale-1'])
  })

  it('le modifiche rimaste in coda per una lista che altrove è stata sostituita non toccano l archivio', async () => {
    const db = await conLista()
    const qui = dispositivo(db)
    const la = dispositivo(db)
    await qui.sincronizzatore.apri()
    await la.sincronizzatore.apri()

    qui.rete.stacca()
    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    la.sincronizzatore.genera(false)
    await la.sincronizzatore.finito()

    qui.rete.riattacca()
    await vi.waitFor(() => expect(qui.sincronizzatore.leggi().inAttesa).toBe(0))
    await qui.sincronizzatore.finito()
    expect(qui.lista().id).toBe(la.lista().id)
    expect(qui.lista().id).not.toBe(lista.id)
    expect(comprata(await db.leggiLista(lista.id), 'pesce-1')).toBe(false)
  })
})

describe('la coda', () => {
  it('una scrittura rifiutata dal database si lascia perdere e non ferma le altre', async () => {
    const db = await conLista()
    const qui = dispositivo(db)
    await qui.sincronizzatore.apri()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(db, 'salvaVoci').mockRejectedValueOnce(new Error('permission denied'))

    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'pesce-1'))
    qui.sincronizzatore.modifica((l) => spuntaVoce(l, 'verdura-1'))
    await qui.sincronizzatore.finito()

    expect(qui.sincronizzatore.leggi().inAttesa).toBe(0)
    const sulDatabase = await db.leggiListaCorrente()
    expect(comprata(sulDatabase, 'pesce-1')).toBe(false)
    expect(comprata(sulDatabase, 'verdura-1')).toBe(true)
  })

  it('un database senza lista corrente riceve una lista vuota', async () => {
    const db = new StorageInMemoria()
    const qui = dispositivo(db)
    await qui.sincronizzatore.apri()
    expect(qui.lista().voci).toEqual([])
    expect(await db.leggiListaCorrente()).toEqual(qui.lista())
  })
})

describe('memoria locale', () => {
  it('un valore illeggibile vale come assente', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const rotta = { getItem: () => '{non è json', setItem: () => {} }
    const memoria = new MemoriaLocale(rotta)
    expect(memoria.leggiLista()).toBeNull()
    expect(memoria.leggiCoda()).toEqual([])
  })

  it('senza spazio si va avanti lo stesso', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const piena = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => new MemoriaLocale(piena).salvaLista(lista)).not.toThrow()
  })
})
