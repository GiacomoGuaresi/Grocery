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
  /**
   * La ricetta da cui viene l'ingrediente: in lista sta sotto il suo nome, non
   * nel reparto. Il nome è una copia, così il gruppo resta anche se la ricetta
   * si elimina. Solo voci manuali.
   */
  ricetta?: RiferimentoRicetta
}

export interface RiferimentoRicetta {
  id: string
  nome: string
}

/** La lista della spesa: ce n'è una sola, generarne una nuova cancella la vecchia. */
export interface Lista {
  id: string
  creataIl: string
  voci: Voce[]
}

/**
 * Una ricetta come arriva dalla Edge Function `importa-ricetta`: la forma di
 * `RicettaEstratta` in supabase/functions/_shared/estraiRicetta.ts.
 */
export interface RicettaImportata {
  nome: string
  /** Il link della ricetta sul sito: due ricette non hanno mai lo stesso. */
  url: string
  /** La foto sul sito d'origine: si mostra da lì, non si copia. */
  immagine?: string
  /** Le categorie del sito ("Primi piatti", "Dolci"…). */
  categorie: string[]
  /** Gli ingredienti col testo del sito, quantità comprese. */
  ingredienti: string[]
}

/** Una ricetta salvata nella sezione Ricette (doc/14-piano-ricette.md). */
export interface Ricetta extends RicettaImportata {
  id: string
  creataIl: string
}
