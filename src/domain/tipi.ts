// Modello dati — vedi doc/06-modello-dati.md

export type IdReparto =
  | 'ortofrutta' | 'macelleria' | 'pescheria' | 'salumi_formaggi'
  | 'latticini_uova' | 'dispensa' | 'surgelati' | 'casa_igiene' | 'altro'

export type IdCategoria =
  | 'carne_rossa' | 'carne_bianca' | 'pesce' | 'formaggio' | 'affettati' | 'uova'

/** Un tipo dentro una voce raggruppata (Frutta / Verdura): sostituibile e spuntabile da solo. */
export interface Elemento {
  nome: string
  comprato: boolean
}

export interface Voce {
  id: string
  nome: string
  reparto: IdReparto
  /** Assente per le voci manuali. */
  categoria?: IdCategoria
  origine: 'generata' | 'manuale'
  comprata: boolean
  /** Tipologie sostitutive proposte nella dropdown. */
  alternative?: string[]
  /** Solo per le voci raggruppate Frutta e Verdura. */
  elementi?: Elemento[]
}

export interface Lista {
  id: string
  creataIl: string
  stato: 'corrente' | 'archiviata'
  voci: Voce[]
}

/** Memoria della rotazione tra un ciclo e l'altro. */
export interface Rotazione {
  categoria: IdCategoria | 'verdura' | 'frutta'
  ultimoIndice: number
}
