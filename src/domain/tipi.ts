// Modello dati — vedi doc/06-modello-dati.md

export type IdReparto =
  | 'ortofrutta' | 'macelleria' | 'pescheria' | 'salumi'
  | 'latticini_uova' | 'dispensa' | 'casa_igiene' | 'altro'

export type IdCategoria =
  | 'carne_rossa' | 'carne_bianca' | 'pesce' | 'formaggio' | 'affettati' | 'uova'

/** Verdura e frutta: non legate a un giorno, scelte tra quelle di stagione. */
export type IdGruppo = 'verdura' | 'frutta'

export interface Voce {
  id: string
  nome: string
  reparto: IdReparto
  /** Assente per le voci manuali. */
  categoria?: IdCategoria | IdGruppo
  origine: 'generata' | 'manuale'
  comprata: boolean
  /**
   * Il totale di pasti da coprire, dalla routine (v2). Solo voci generate: le
   * manuali, e le generate rimaste dalla v1, non ce l'hanno e si spuntano.
   */
  quantita?: number
  /** Quanti pasti sono già stati presi, da 0 a `quantita`. C'è se c'è `quantita`. */
  presi?: number
}

/** La lista della spesa: ce n'è una sola, generarne una nuova cancella la vecchia. */
export interface Lista {
  id: string
  creataIl: string
  voci: Voce[]
}
