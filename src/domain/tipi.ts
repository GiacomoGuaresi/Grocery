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
  /**
   * Assente per le voci manuali. Ogni tipo di verdura e di frutta è una voce a
   * sé, con categoria `verdura` o `frutta`.
   */
  categoria?: IdCategoria | IdGruppo
  origine: 'generata' | 'manuale'
  comprata: boolean
  /** Tipologie sostitutive proposte nella dropdown. */
  alternative?: string[]
}

export interface Lista {
  id: string
  creataIl: string
  stato: 'corrente' | 'archiviata'
  voci: Voce[]
}

/**
 * Una lista dell'archivio vista dall'elenco (F11): quanto basta a riconoscerla
 * e a sapere com'è andata, senza tirare su tutte le voci.
 */
export interface SintesiLista {
  id: string
  creataIl: string
  quanteVoci: number
  quanteComprate: number
}

/** Memoria della rotazione tra un ciclo e l'altro. */
export interface Rotazione {
  categoria: IdCategoria | IdGruppo
  /** Le tipologie proposte nell'ultimo ciclo: si evitano in quello nuovo (R3). */
  ultimi: string[]
}
