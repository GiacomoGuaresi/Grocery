// Algoritmo di generazione della lista (Step 8 di doc/12-piano-sviluppo.md).
// Solo logica, nessuna UI: dalla routine, dai cataloghi e dalla stagionalità
// escono le voci di un ciclo di due settimane (doc/03-algoritmo-generazione.md).
//
// La scelta è **casuale**, non a giro fisso sul catalogo: scorrendo il catalogo
// in ordine capitavano cicli interi sullo stesso animale, cambiando solo il
// taglio (R2). Dalla v2 non c'è più memoria tra un ciclo e l'altro: le
// rotazioni sono tolte, e lo Step V3 riscrive la generazione per categorie.

import {
  categoria,
  categorie,
  diStagione,
  eGruppoFisso,
  giorniRoutine,
  type GruppoFisso,
  type Mese,
} from './dati'
import type { IdCategoria, Lista, Voce } from './tipi'

/** Tipi di verdura e di frutta per ciclo: resta finché lo Step V3 non riscrive la generazione. */
const tipiPerCiclo = 4

export interface OpzioniGenerazione {
  /** Determina il mese, e quindi la stagionalità. Default: adesso. */
  data?: Date
  /** Id della lista prodotta. Default: derivato dalla data. */
  id?: string
  /** La sorgente del caso, sostituibile nei test. Default: `Math.random`. */
  caso?: () => number
}

/** 1 = gennaio ... 12 = dicembre, dal fuso locale come il resto dell'app. */
export function meseDi(data: Date): Mese {
  return (data.getMonth() + 1) as Mese
}

/**
 * Quante voci servono per categoria in un ciclo di due settimane: le occorrenze
 * nella routine settimanale, moltiplicate per due (R1). Non è una tabella a
 * mano: cambiare `routine.json` cambia la copertura.
 */
export function occorrenzePerCiclo(): Map<IdCategoria, number> {
  const occorrenze = new Map<IdCategoria, number>()
  for (const giorno of giorniRoutine) {
    occorrenze.set(giorno.categoria, (occorrenze.get(giorno.categoria) ?? 0) + 2)
  }
  return occorrenze
}

/** Mescola una copia dell'elenco (Fisher-Yates), lasciando intatto l'originale. */
function mescola<T>(elenco: T[], caso: () => number): T[] {
  const mescolato = [...elenco]
  for (let i = mescolato.length - 1; i > 0; i--) {
    const j = Math.floor(caso() * (i + 1))
    ;[mescolato[i], mescolato[j]] = [mescolato[j], mescolato[i]]
  }
  return mescolato
}

/**
 * Pesca a caso fino a `quanti` elementi dai candidati, mai due volte lo stesso
 * (R4). Se i candidati sono meno delle voci da riempire — le uova, che hanno
 * una sola tipologia — escono tutti una volta sola: nella lista una voce non si
 * ripete mai (R8).
 */
function pesca<T>(candidati: T[], quanti: number, caso: () => number): T[] {
  return mescola(candidati, caso).slice(0, quanti)
}

/** Le voci di una categoria per il ciclo. */
function vociCategoria(id: IdCategoria, quante: number, caso: () => number): Voce[] {
  const catalogo = categorie.find((c) => c.id === id)
  if (!catalogo) return []

  // Le uova non hanno consigli: una voce sola col nome della categoria (R8).
  const candidati = catalogo.consigli.length === 0 ? [catalogo.etichetta.toLowerCase()] : catalogo.consigli
  return pesca(candidati, quante, caso).map((nome, posizione) => ({
    id: `${id}-${posizione + 1}`,
    nome,
    reparto: catalogo.reparto,
    categoria: id,
    origine: 'generata' as const,
    comprata: false,
  }))
}

/**
 * Le voci di verdura o frutta: `tipiPerCiclo` tipi di stagione, diversi tra
 * loro, pescati a caso tra quelli del mese (R5, R5b). Ogni tipo è una voce a
 * sé, che si spunta come le altre (R5d).
 */
function vociGruppo(gruppo: GruppoFisso, mese: Mese, caso: () => number): Voce[] {
  const reparto = categoria(gruppo)?.reparto ?? 'ortofrutta'
  return pesca(diStagione(gruppo, mese), tipiPerCiclo, caso).map((nome, posizione) => ({
    id: `${gruppo}-${posizione + 1}`,
    nome,
    reparto,
    categoria: gruppo,
    origine: 'generata' as const,
    comprata: false,
  }))
}

/**
 * La lista di un ciclo di due settimane. Non tocca la lista precedente:
 * riportare le voci non spuntate è compito di chi chiama (R6, Step 9).
 */
export function generaLista(opzioni: OpzioniGenerazione = {}): Lista {
  const data = opzioni.data ?? new Date()
  const caso = opzioni.caso ?? Math.random
  const mese = meseDi(data)

  const voci: Voce[] = []
  for (const gruppo of ['verdura', 'frutta'] as GruppoFisso[]) {
    voci.push(...vociGruppo(gruppo, mese, caso))
  }

  const occorrenze = occorrenzePerCiclo()
  for (const catalogo of categorie) {
    if (eGruppoFisso(catalogo.id)) continue
    voci.push(...vociCategoria(catalogo.id, occorrenze.get(catalogo.id) ?? 0, caso))
  }

  return {
    id: opzioni.id ?? `ciclo-${data.toISOString()}`,
    creataIl: data.toISOString(),
    voci,
  }
}
