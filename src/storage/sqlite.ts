// Implementazione di Storage su SQLite eseguito nel browser con sql.js (WASM).
// Il database vive in memoria: dopo ogni scrittura viene esportato in un blob
// e affidato alla Persistenza (IndexedDB in browser), così sopravvive al
// refresh della pagina.

import type { Database, SqlJsStatic } from 'sql.js'
import type { Elemento, IdCategoria, IdReparto, Lista, Rotazione, Voce } from '../domain/tipi'
import { MIGRAZIONE_ROTAZIONI, SCHEMA } from './schema'
import type { Persistenza, Storage } from './tipi'

/**
 * Apre il database salvato — creandolo la prima volta — e applica lo schema.
 * `SQL` arriva da `initSqlJs()`: chi chiama decide da dove caricare il WASM.
 */
export async function apriStorageSqlite(
  SQL: SqlJsStatic,
  persistenza: Persistenza,
): Promise<StorageSqlite> {
  const salvato = await persistenza.carica()
  const db = salvato ? new SQL.Database(salvato) : new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  if (rotazioniDaMigrare(db)) db.run(MIGRAZIONE_ROTAZIONI)
  db.run(SCHEMA)
  return new StorageSqlite(db, persistenza)
}

/** Vero se il database porta ancora la tabella `rotazioni` a indici. */
function rotazioniDaMigrare(db: Database): boolean {
  return interroga(db, "PRAGMA table_info('rotazioni')").some(
    (colonna) => colonna.name === 'ultimo_indice',
  )
}

export class StorageSqlite implements Storage {
  constructor(
    private readonly db: Database,
    private readonly persistenza: Persistenza,
  ) {}

  async leggiListaCorrente(): Promise<Lista | null> {
    const righe = interroga(
      this.db,
      "SELECT id, creata_il, stato FROM liste WHERE stato = 'corrente' ORDER BY creata_il DESC LIMIT 1",
    )
    const riga = righe[0]
    if (!riga) return null

    const id = riga.id as string
    return {
      id,
      creataIl: riga.creata_il as string,
      stato: 'corrente',
      voci: this.leggiVoci(id),
    }
  }

  /**
   * Riscrive la lista da zero: le voci e gli elementi spariti dall'oggetto
   * spariscono anche dal database. Salvando una lista `corrente` le altre
   * correnti passano ad archiviate: ce n'è sempre una sola (doc/06).
   */
  async salvaLista(lista: Lista): Promise<void> {
    this.inTransazione(() => {
      if (lista.stato === 'corrente') {
        this.db.run("UPDATE liste SET stato = 'archiviata' WHERE stato = 'corrente' AND id <> ?", [
          lista.id,
        ])
      }
      this.db.run(
        `INSERT INTO liste (id, creata_il, stato) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET creata_il = excluded.creata_il, stato = excluded.stato`,
        [lista.id, lista.creataIl, lista.stato],
      )
      this.db.run('DELETE FROM voci WHERE lista_id = ?', [lista.id])

      lista.voci.forEach((voce, posizione) => {
        this.db.run(
          `INSERT INTO voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, alternative)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lista.id,
            voce.id,
            posizione,
            voce.nome,
            voce.reparto,
            voce.categoria ?? null,
            voce.origine,
            voce.comprata ? 1 : 0,
            voce.alternative ? JSON.stringify(voce.alternative) : null,
          ],
        )
        voce.elementi?.forEach((elemento, posizioneElemento) => {
          this.db.run(
            `INSERT INTO elementi (lista_id, voce_id, posizione, nome, comprato) VALUES (?, ?, ?, ?, ?)`,
            [lista.id, voce.id, posizioneElemento, elemento.nome, elemento.comprato ? 1 : 0],
          )
        })
      })
    })
    await this.salvaSuDisco()
  }

  async leggiRotazioni(): Promise<Rotazione[]> {
    return interroga(this.db, 'SELECT categoria, ultimi FROM rotazioni ORDER BY categoria').map(
      (riga) => ({
        categoria: riga.categoria as Rotazione['categoria'],
        ultimi: JSON.parse(riga.ultimi as string) as string[],
      }),
    )
  }

  async salvaRotazioni(rotazioni: Rotazione[]): Promise<void> {
    this.inTransazione(() => {
      this.db.run('DELETE FROM rotazioni')
      for (const rotazione of rotazioni) {
        this.db.run('INSERT INTO rotazioni (categoria, ultimi) VALUES (?, ?)', [
          rotazione.categoria,
          JSON.stringify(rotazione.ultimi),
        ])
      }
    })
    await this.salvaSuDisco()
  }

  /** Chiude il database e libera la memoria del WASM. */
  chiudi(): void {
    this.db.close()
  }

  private leggiVoci(listaId: string): Voce[] {
    const elementi = new Map<string, Elemento[]>()
    for (const riga of interroga(
      this.db,
      'SELECT voce_id, nome, comprato FROM elementi WHERE lista_id = ? ORDER BY posizione',
      [listaId],
    )) {
      const voceId = riga.voce_id as string
      const elemento = { nome: riga.nome as string, comprato: riga.comprato === 1 }
      const gruppo = elementi.get(voceId)
      if (gruppo) gruppo.push(elemento)
      else elementi.set(voceId, [elemento])
    }

    return interroga(
      this.db,
      `SELECT id, nome, reparto, categoria, origine, comprata, alternative
       FROM voci WHERE lista_id = ? ORDER BY posizione`,
      [listaId],
    ).map((riga) => {
      const id = riga.id as string
      const voce: Voce = {
        id,
        nome: riga.nome as string,
        reparto: riga.reparto as IdReparto,
        origine: riga.origine as Voce['origine'],
        comprata: riga.comprata === 1,
      }
      if (riga.categoria !== null) voce.categoria = riga.categoria as IdCategoria
      if (riga.alternative !== null) voce.alternative = JSON.parse(riga.alternative as string)
      const suoiElementi = elementi.get(id)
      if (suoiElementi) voce.elementi = suoiElementi
      return voce
    })
  }

  /** Tutto o niente: un errore a metà scrittura non lascia la lista monca. */
  private inTransazione(scritture: () => void): void {
    // `export()` di sql.js riapre la connessione, e `foreign_keys` è
    // un'impostazione di connessione: senza rimetterla i CASCADE non
    // scattano più dopo il primo salvataggio. Fuori dalla transazione,
    // perché dentro SQLite la ignorerebbe.
    this.db.run('PRAGMA foreign_keys = ON')
    this.db.run('BEGIN')
    try {
      scritture()
      this.db.run('COMMIT')
    } catch (errore) {
      this.db.run('ROLLBACK')
      throw errore
    }
  }

  private async salvaSuDisco(): Promise<void> {
    await this.persistenza.salva(this.db.export())
  }
}

type Riga = Record<string, unknown>

function interroga(db: Database, sql: string, parametri: unknown[] = []): Riga[] {
  const statement = db.prepare(sql)
  try {
    statement.bind(parametri as never)
    const righe: Riga[] = []
    while (statement.step()) righe.push(statement.getAsObject() as Riga)
    return righe
  } finally {
    statement.free()
  }
}
