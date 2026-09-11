import initSqlJs from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { lista, verificaContratto } from './contratto'
import { PersistenzaMemoria } from './memoria'
import { SCHEMA } from './schema'
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

describe('contratto di Storage', () => {
  verificaContratto(async () => (await apri()).storage)
})

describe('archivio', () => {
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

describe('liste salvate con frutta e verdura raggruppate', () => {
  /** Un database com'era prima: Verdura una voce sola, coi tipi in `elementi`. */
  async function databaseVecchio(): Promise<Persistenza> {
    const vecchio = new SQL.Database()
    vecchio.run(SCHEMA)
    vecchio.run(`CREATE TABLE elementi (
      lista_id TEXT NOT NULL, voce_id TEXT NOT NULL, posizione INTEGER NOT NULL,
      nome TEXT NOT NULL, comprato INTEGER NOT NULL,
      PRIMARY KEY (lista_id, voce_id, nome),
      FOREIGN KEY (lista_id, voce_id) REFERENCES voci(lista_id, id) ON DELETE CASCADE
    )`)
    vecchio.run(`INSERT INTO liste VALUES
      ('vecchia', '2026-08-24T08:00:00.000Z', 'archiviata'),
      ('adesso', '2026-09-07T08:00:00.000Z', 'corrente')`)
    vecchio.run(`INSERT INTO voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata) VALUES
      ('vecchia', 'frutta', 0, 'Frutta', 'ortofrutta', NULL, 'generata', 1),
      ('adesso', 'verdura', 0, 'Verdura', 'ortofrutta', NULL, 'generata', 0),
      ('adesso', 'pesce-1', 1, 'orata', 'pescheria', 'pesce', 'generata', 0)`)
    vecchio.run(`INSERT INTO elementi VALUES
      ('vecchia', 'frutta', 0, 'mele', 1), ('vecchia', 'frutta', 1, 'pere', 1),
      ('adesso', 'verdura', 0, 'zucchine', 1), ('adesso', 'verdura', 1, 'spinaci', 0)`)
    const persistenza = new PersistenzaMemoria()
    await persistenza.salva(vecchio.export())
    vecchio.close()
    return persistenza
  }

  it('si riaprono con una voce per tipo, spunte comprese', async () => {
    const { storage } = await apri(await databaseVecchio())
    expect((await storage.leggiListaCorrente())?.voci).toEqual([
      { id: 'verdura-1', nome: 'zucchine', reparto: 'ortofrutta', categoria: 'verdura', origine: 'generata', comprata: true },
      { id: 'verdura-2', nome: 'spinaci', reparto: 'ortofrutta', categoria: 'verdura', origine: 'generata', comprata: false },
      { id: 'pesce-1', nome: 'orata', reparto: 'pescheria', categoria: 'pesce', origine: 'generata', comprata: false },
    ])
  })

  it('anche l archivio conta un tipo per voce', async () => {
    const { storage } = await apri(await databaseVecchio())
    expect(await storage.leggiArchivio()).toEqual([
      { id: 'vecchia', creataIl: '2026-08-24T08:00:00.000Z', quanteVoci: 2, quanteComprate: 2 },
    ])
  })

  it('la migrazione si fa una volta sola: riaprendo resta tutto com era', async () => {
    const persistenza = await databaseVecchio()
    const prima = await (await apri(persistenza)).storage.leggiListaCorrente()
    const dopo = await (await apri(persistenza)).storage.leggiListaCorrente()
    expect(dopo).toEqual(prima)
  })
})

describe('liste salvate col reparto Surgelati', () => {
  it('si riaprono con ogni surgelato nel reparto del prodotto', async () => {
    const vecchio = new SQL.Database()
    vecchio.run(SCHEMA)
    vecchio.run(`INSERT INTO liste VALUES ('adesso', '2026-09-07T08:00:00.000Z', 'corrente')`)
    vecchio.run(`INSERT INTO voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata) VALUES
      ('adesso', 'pesce-1', 0, 'salmone affumicato', 'surgelati', 'pesce', 'generata', 0),
      ('adesso', 'manuale-1', 1, 'gelato', 'surgelati', NULL, 'manuale', 1),
      ('adesso', 'manuale-2', 2, 'verdure surgelate', 'surgelati', NULL, 'manuale', 0)`)
    const persistenza = new PersistenzaMemoria()
    await persistenza.salva(vecchio.export())
    vecchio.close()

    const { storage } = await apri(persistenza)
    const reparti = (await storage.leggiListaCorrente())?.voci.map((v) => [v.nome, v.reparto])
    expect(reparti).toEqual([
      ['salmone affumicato', 'pescheria'],
      ['gelato', 'latticini_uova'],
      ['verdure surgelate', 'ortofrutta'],
    ])
  })
})

describe('liste salvate col reparto Salumi e formaggi', () => {
  it('si riaprono coi formaggi nei latticini e gli affettati nei salumi', async () => {
    const vecchio = new SQL.Database()
    vecchio.run(SCHEMA)
    vecchio.run(`INSERT INTO liste VALUES ('adesso', '2026-09-07T08:00:00.000Z', 'corrente')`)
    vecchio.run(`INSERT INTO voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata) VALUES
      ('adesso', 'formaggio-1', 0, 'stracchino', 'salumi_formaggi', 'formaggio', 'generata', 0),
      ('adesso', 'affettati-1', 1, 'bresaola', 'salumi_formaggi', 'affettati', 'generata', 1)`)
    const persistenza = new PersistenzaMemoria()
    await persistenza.salva(vecchio.export())
    vecchio.close()

    const { storage } = await apri(persistenza)
    const reparti = (await storage.leggiListaCorrente())?.voci.map((v) => [v.nome, v.reparto])
    expect(reparti).toEqual([
      ['stracchino', 'latticini_uova'],
      ['bresaola', 'salumi'],
    ])
  })
})

describe('rotazioni', () => {
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
