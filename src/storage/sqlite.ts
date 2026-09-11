// Implementazione di Storage su SQLite eseguito nel browser con sql.js (WASM).
// Il database vive in memoria: dopo ogni scrittura viene esportato in un blob
// e affidato alla Persistenza (IndexedDB in browser), così sopravvive al
// refresh della pagina.

import type { Database, SqlJsStatic } from 'sql.js'
import { eGruppoFisso } from '../domain/dati'
import type { IdReparto, Lista, Rotazione, SintesiLista, Voce } from '../domain/tipi'
import { MIGRAZIONE_FORMAGGI, MIGRAZIONE_ROTAZIONI, MIGRAZIONE_SURGELATI, SCHEMA } from './schema'
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
  db.run(MIGRAZIONE_SURGELATI)
  db.run(MIGRAZIONE_FORMAGGI)
  const storage = new StorageSqlite(db, persistenza)
  if (tabellaEsiste(db, 'elementi')) await storage.migraElementi()
  return storage
}

/** Vero se il database porta ancora la tabella `rotazioni` a indici. */
function rotazioniDaMigrare(db: Database): boolean {
  return interroga(db, "PRAGMA table_info('rotazioni')").some(
    (colonna) => colonna.name === 'ultimo_indice',
  )
}

function tabellaEsiste(db: Database, nome: string): boolean {
  return interroga(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [nome])
    .length > 0
}

export class StorageSqlite implements Storage {
  constructor(
    private readonly db: Database,
    private readonly persistenza: Persistenza,
  ) {}

  async leggiListaCorrente(): Promise<Lista | null> {
    return this.lista(
      "SELECT id, creata_il, stato FROM liste WHERE stato = 'corrente' ORDER BY creata_il DESC LIMIT 1",
    )
  }

  async leggiLista(id: string): Promise<Lista | null> {
    return this.lista('SELECT id, creata_il, stato FROM liste WHERE id = ?', [id])
  }

  /**
   * L'elenco dell'archivio, dalla spesa più recente alla più vecchia. Conta le
   * voci con una query di aggregazione: per l'elenco non serve caricarle (F11).
   */
  async leggiArchivio(): Promise<SintesiLista[]> {
    return interroga(
      this.db,
      `SELECT liste.id, liste.creata_il,
              COUNT(voci.id) AS quante,
              COALESCE(SUM(voci.comprata), 0) AS quante_comprate
       FROM liste LEFT JOIN voci ON voci.lista_id = liste.id
       WHERE liste.stato = 'archiviata'
       GROUP BY liste.id
       ORDER BY liste.creata_il DESC`,
    ).map((riga) => ({
      id: riga.id as string,
      creataIl: riga.creata_il as string,
      quanteVoci: riga.quante as number,
      quanteComprate: riga.quante_comprate as number,
    }))
  }

  /**
   * Riscrive la lista da zero: le voci sparite dall'oggetto spariscono anche
   * dal database. Salvando una lista `corrente` le altre correnti passano ad
   * archiviate: ce n'è sempre una sola (doc/06).
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

  /**
   * Fino al 2026-09-11 frutta e verdura erano una voce sola ciascuna, coi tipi
   * nella tabella `elementi`. Le liste salvate così si riscrivono con una voce
   * per tipo, come le genera l'app adesso, spunte comprese; poi la tabella si
   * butta. Tocca anche l'archivio, così i conteggi dell'elenco tornano.
   */
  async migraElementi(): Promise<void> {
    const righe = interroga(
      this.db,
      'SELECT lista_id, voce_id, nome, comprato FROM elementi ORDER BY lista_id, voce_id, posizione',
    )
    for (const listaId of new Set(righe.map((riga) => riga.lista_id as string))) {
      const lista = await this.leggiLista(listaId)
      if (!lista) continue
      const voci = lista.voci.flatMap((voce) => {
        const tipi = righe.filter((riga) => riga.lista_id === listaId && riga.voce_id === voce.id)
        if (tipi.length === 0) return [voce]
        const gruppo = voce.nome.toLowerCase()
        return tipi.map(
          (riga, posizione): Voce => ({
            id: `${voce.id}-${posizione + 1}`,
            nome: riga.nome as string,
            reparto: voce.reparto,
            ...(eGruppoFisso(gruppo) ? { categoria: gruppo } : {}),
            origine: voce.origine,
            comprata: riga.comprato === 1,
          }),
        )
      })
      await this.salvaLista({ ...lista, voci })
    }
    this.db.run('DROP TABLE elementi')
    await this.salvaSuDisco()
  }

  /** Chiude il database e libera la memoria del WASM. */
  chiudi(): void {
    this.db.close()
  }

  /** La lista trovata dalla query, con le sue voci; `null` se la query non pesca niente. */
  private lista(sql: string, parametri: unknown[] = []): Lista | null {
    const riga = interroga(this.db, sql, parametri)[0]
    if (!riga) return null

    const id = riga.id as string
    return {
      id,
      creataIl: riga.creata_il as string,
      stato: riga.stato as Lista['stato'],
      voci: this.leggiVoci(id),
    }
  }

  private leggiVoci(listaId: string): Voce[] {
    return interroga(
      this.db,
      `SELECT id, nome, reparto, categoria, origine, comprata, alternative
       FROM voci WHERE lista_id = ? ORDER BY posizione`,
      [listaId],
    ).map((riga) => {
      const voce: Voce = {
        id: riga.id as string,
        nome: riga.nome as string,
        reparto: riga.reparto as IdReparto,
        origine: riga.origine as Voce['origine'],
        comprata: riga.comprata === 1,
      }
      if (riga.categoria !== null) voce.categoria = riga.categoria as Voce['categoria']
      if (riga.alternative !== null) voce.alternative = JSON.parse(riga.alternative as string)
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
