import initSqlJs from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { listaEsempio } from '../domain/listaEsempio'
import { spuntaVoce } from '../domain/spunta'
import type { Lista, Rotazione } from '../domain/tipi'
import { PersistenzaMemoria } from './memoria'
import { apriStorageSqlite } from './sqlite'
import type { Persistenza, Storage } from './tipi'

let SQL: Awaited<ReturnType<typeof initSqlJs>>

beforeAll(async () => {
  SQL = await initSqlJs()
})

/** Uno storage nuovo, con la sua persistenza: riaprendola si simula il refresh. */
async function apri(persistenza: Persistenza = new PersistenzaMemoria()) {
  return { storage: (await apriStorageSqlite(SQL, persistenza)) as Storage, persistenza }
}

const lista: Lista = {
  id: 'lista-1',
  creataIl: '2026-09-07T08:00:00.000Z',
  stato: 'corrente',
  voci: [
    {
      id: 'verdura',
      nome: 'Verdura',
      reparto: 'ortofrutta',
      origine: 'generata',
      comprata: false,
      alternative: ['cavolfiore', 'finocchi'],
      elementi: [
        { nome: 'zucchine', comprato: false },
        { nome: 'spinaci', comprato: true },
      ],
    },
    {
      id: 'pesce-1',
      nome: 'orata',
      reparto: 'pescheria',
      categoria: 'pesce',
      origine: 'generata',
      comprata: false,
    },
    {
      id: 'manuale-1',
      nome: 'caffè',
      reparto: 'dispensa',
      origine: 'manuale',
      comprata: true,
    },
  ],
}

describe('lettura e scrittura della lista', () => {
  it('su un database vuoto non c e nessuna lista corrente', async () => {
    const { storage } = await apri()
    expect(await storage.leggiListaCorrente()).toBeNull()
  })

  it('rilegge la lista esattamente com era', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    expect(await storage.leggiListaCorrente()).toEqual(lista)
  })

  it('tiene l ordine delle voci e degli elementi', async () => {
    const { storage } = await apri()
    await storage.salvaLista(listaEsempio)
    const riletta = await storage.leggiListaCorrente()
    expect(riletta?.voci.map((v) => v.id)).toEqual(listaEsempio.voci.map((v) => v.id))
    expect(riletta?.voci[0].elementi?.map((e) => e.nome)).toEqual(['zucchine', 'melanzane', 'spinaci', 'peperoni'])
  })

  it('non inventa i campi opzionali assenti', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    const voce = (await storage.leggiListaCorrente())?.voci[1]
    expect(voce).not.toHaveProperty('elementi')
    expect(voce).not.toHaveProperty('alternative')
    expect(voce?.categoria).toBe('pesce')
  })

  it('salvando di nuovo aggiorna invece di duplicare', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    await storage.salvaLista(spuntaVoce(lista, 'pesce-1'))
    const riletta = await storage.leggiListaCorrente()
    expect(riletta?.voci).toHaveLength(lista.voci.length)
    expect(riletta?.voci.find((v) => v.id === 'pesce-1')?.comprata).toBe(true)
  })

  it('le voci tolte dalla lista spariscono col loro elementi', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    await storage.salvaLista({ ...lista, voci: [lista.voci[1]] })
    const riletta = await storage.leggiListaCorrente()
    expect(riletta?.voci.map((v) => v.id)).toEqual(['pesce-1'])
    expect(riletta?.voci[0].elementi).toBeUndefined()
  })

  it('tiene una sola lista corrente: la precedente viene archiviata', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
    await storage.salvaLista(nuova)
    expect((await storage.leggiListaCorrente())?.id).toBe('lista-2')
  })
})

describe('archivio', () => {
  /** Due generazioni di seguito: la prima lista finisce archiviata (F11). */
  async function conDueSpese() {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
    await storage.salvaLista(nuova)
    return storage
  }

  it('su un database senza liste passate e vuoto', async () => {
    const { storage } = await apri()
    await storage.salvaLista(lista)
    expect(await storage.leggiArchivio()).toEqual([])
  })

  it('elenca le liste archiviate, non quella corrente', async () => {
    const storage = await conDueSpese()
    expect(await storage.leggiArchivio()).toEqual([
      {
        id: 'lista-1',
        creataIl: '2026-09-07T08:00:00.000Z',
        quanteVoci: 3,
        quanteComprate: 1,
      },
    ])
  })

  it('mette per prima la spesa più recente', async () => {
    const { storage } = await apri()
    for (const [id, creataIl] of [
      ['lista-1', '2026-08-10T08:00:00.000Z'],
      ['lista-2', '2026-08-24T08:00:00.000Z'],
      ['lista-3', '2026-09-07T08:00:00.000Z'],
    ]) {
      await storage.salvaLista({ ...lista, id, creataIl })
    }
    expect((await storage.leggiArchivio()).map((s) => s.id)).toEqual(['lista-2', 'lista-1'])
  })

  it('una lista archiviata si riapre intera, com era', async () => {
    const storage = await conDueSpese()
    expect(await storage.leggiLista('lista-1')).toEqual({ ...lista, stato: 'archiviata' })
  })

  it('per un id che non esiste non restituisce niente', async () => {
    const storage = await conDueSpese()
    expect(await storage.leggiLista('lista-mai-vista')).toBeNull()
  })

  it('riaprendo il database l archivio e ancora li', async () => {
    const persistenza = new PersistenzaMemoria()
    const prima = await apri(persistenza)
    await prima.storage.salvaLista(lista)
    await prima.storage.salvaLista({ ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' })

    const dopo = await apri(persistenza)
    expect((await dopo.storage.leggiArchivio()).map((s) => s.id)).toEqual(['lista-1'])
    expect((await dopo.storage.leggiLista('lista-1'))?.voci).toHaveLength(3)
  })
})

describe('rotazioni', () => {
  const rotazioni: Rotazione[] = [
    { categoria: 'pesce', ultimi: ['orata', 'branzino', 'cozze', 'polpo'] },
    { categoria: 'carne_rossa', ultimi: ['salsiccia', 'ossobuco di vitello'] },
    { categoria: 'frutta', ultimi: ['mele', 'pere', 'uva', 'fichi'] },
  ]

  it('parte vuota', async () => {
    const { storage } = await apri()
    expect(await storage.leggiRotazioni()).toEqual([])
  })

  it('rilegge quello che ha salvato', async () => {
    const { storage } = await apri()
    await storage.salvaRotazioni(rotazioni)
    expect(await storage.leggiRotazioni()).toEqual(
      [...rotazioni].sort((a, b) => a.categoria.localeCompare(b.categoria)),
    )
  })

  it('sostituisce la memoria precedente invece di accumularla', async () => {
    const { storage } = await apri()
    await storage.salvaRotazioni(rotazioni)
    await storage.salvaRotazioni([{ categoria: 'pesce', ultimi: ['sgombro'] }])
    expect(await storage.leggiRotazioni()).toEqual([{ categoria: 'pesce', ultimi: ['sgombro'] }])
  })

  it('un database con la vecchia memoria a indici si riapre lo stesso', async () => {
    const vecchio = new SQL.Database()
    vecchio.run('CREATE TABLE rotazioni (categoria TEXT PRIMARY KEY, ultimo_indice INTEGER NOT NULL)')
    vecchio.run("INSERT INTO rotazioni (categoria, ultimo_indice) VALUES ('pesce', 3)")
    const persistenza = new PersistenzaMemoria()
    await persistenza.salva(vecchio.export())
    vecchio.close()

    // La memoria vecchia si butta: si ricostruisce alla prima generazione.
    const { storage } = await apri(persistenza)
    expect(await storage.leggiRotazioni()).toEqual([])
    await storage.salvaRotazioni([{ categoria: 'pesce', ultimi: ['sgombro'] }])
    expect(await storage.leggiRotazioni()).toEqual([{ categoria: 'pesce', ultimi: ['sgombro'] }])
  })
})

describe('sopravvivenza al refresh', () => {
  it('riaprendo il database la lista e le rotazioni sono ancora li', async () => {
    const persistenza = new PersistenzaMemoria()
    const prima = await apri(persistenza)
    await prima.storage.salvaLista(lista)
    await prima.storage.salvaRotazioni([{ categoria: 'uova', ultimi: [] }])

    // Stessa persistenza, database ricostruito da zero: è ciò che succede
    // dopo un refresh della pagina.
    const dopo = await apri(persistenza)
    expect(await dopo.storage.leggiListaCorrente()).toEqual(lista)
    expect(await dopo.storage.leggiRotazioni()).toEqual([{ categoria: 'uova', ultimi: [] }])
  })

  it('senza niente di salvato riparte da un database vuoto', async () => {
    const dopo = await apri(new PersistenzaMemoria())
    expect(await dopo.storage.leggiListaCorrente()).toBeNull()
  })
})
