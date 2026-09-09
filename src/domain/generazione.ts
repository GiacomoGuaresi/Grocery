// Algoritmo di generazione della lista (Step 8 di doc/12-piano-sviluppo.md).
// Solo logica, nessuna UI: dalla routine, dai cataloghi e dalla stagionalità
// escono le voci di un ciclo di due settimane (doc/03-algoritmo-generazione.md).
//
// Tutto è deterministico: a parità di data e di rotazioni in ingresso esce
// sempre la stessa lista. L'unica memoria è `ultimoIndice`, una posizione per
// catalogo, che l'algoritmo restituisce aggiornata perché venga salvata (R3).

import {
  categorie,
  giorniRoutine,
  gruppiFissi,
  stagionalita,
  type GruppoFisso,
  type Mese,
} from './dati'
import type { Elemento, IdCategoria, Lista, Rotazione, Voce } from './tipi'

/** Le righe di rotazione hanno una chiave per categoria e una per gruppo fisso. */
export type ChiaveRotazione = IdCategoria | GruppoFisso

export interface OpzioniGenerazione {
  /** Determina il mese, e quindi la stagionalità. Default: adesso. */
  data?: Date
  /** La memoria dei cicli precedenti. Assente = si parte dall'inizio dei cataloghi. */
  rotazioni?: Rotazione[]
  /** Id della lista prodotta. Default: derivato dalla data. */
  id?: string
}

export interface Generazione {
  lista: Lista
  /** Le rotazioni da persistere: sostituiscono per intero quelle in ingresso. */
  rotazioni: Rotazione[]
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

/** La posizione salvata per questo catalogo, o -1 se non si è mai generato. */
function ultimoIndice(rotazioni: Rotazione[], chiave: ChiaveRotazione): number {
  return rotazioni.find((r) => r.categoria === chiave)?.ultimoIndice ?? -1
}

/**
 * Avanza nel catalogo di `quanti` passi a partire dalla posizione salvata,
 * girando in tondo e saltando le posizioni non ammesse (R2). Finché le voci
 * ammesse sono più di quante ne servono le estrazioni sono tutte diverse tra
 * loro (R4); quando sono meno — le uova, che hanno una sola tipologia — il
 * giro ricomincia e la stessa voce si ripete.
 */
function ruota<T>(
  elenco: T[],
  precedente: number,
  quanti: number,
  ammesso: (voce: T) => boolean = () => true,
): { scelti: T[]; indice: number } {
  const posizioni = elenco.map((_, i) => i).filter((i) => ammesso(elenco[i]))
  if (posizioni.length === 0) return { scelti: [], indice: precedente }

  const scelti: T[] = []
  let indice = precedente
  for (let passo = 0; passo < quanti; passo++) {
    indice = posizioni.find((posizione) => posizione > indice) ?? posizioni[0]
    scelti.push(elenco[indice])
  }
  return { scelti, indice }
}

/** Le voci di una categoria per il ciclo, con la posizione raggiunta nel catalogo. */
function vociCategoria(
  id: IdCategoria,
  quante: number,
  precedente: number,
): { voci: Voce[]; indice: number } {
  const catalogo = categorie.find((c) => c.id === id)
  if (!catalogo) return { voci: [], indice: precedente }

  const { scelti, indice } = ruota(catalogo.tipi, precedente, quante)
  const voci = scelti.map((tipo, posizione) => ({
    id: `${id}-${posizione + 1}`,
    nome: tipo.nome,
    reparto: tipo.reparto,
    categoria: id,
    origine: 'generata' as const,
    comprata: false,
  }))
  // Le categorie fisse non ruotano: la posizione salvata resta com'era (R8).
  return { voci, indice: catalogo.fisso ? precedente : indice }
}

/**
 * La voce raggruppata di verdura o frutta: `tipiPerCiclo` tipi di stagione,
 * diversi tra loro, scelti a rotazione (R5, R5b, R5d). La posizione è tenuta
 * sul catalogo intero, non sui soli tipi del mese: così la rotazione prosegue
 * anche quando si cambia mese e la stagionalità sotto cambia.
 */
function voceGruppo(
  gruppo: GruppoFisso,
  mese: Mese,
  precedente: number,
): { voce: Voce | null; indice: number } {
  const catalogo = Object.keys(stagionalita[gruppo])
  const { tipiPerCiclo, reparto } = gruppiFissi[gruppo]
  const { scelti, indice } = ruota(catalogo, precedente, tipiPerCiclo, (nome) =>
    stagionalita[gruppo][nome].includes(mese),
  )
  if (scelti.length === 0) return { voce: null, indice: precedente }

  const elementi: Elemento[] = scelti.map((nome) => ({ nome, comprato: false }))
  return {
    voce: {
      id: gruppo,
      nome: gruppo === 'verdura' ? 'Verdura' : 'Frutta',
      reparto,
      origine: 'generata',
      comprata: false,
      elementi,
    },
    indice,
  }
}

/**
 * La lista di un ciclo di due settimane, con le rotazioni aggiornate da
 * salvare. Non tocca la lista precedente: archiviarla e riportare le voci non
 * spuntate è compito di chi chiama (R6, Step 9).
 */
export function generaLista(opzioni: OpzioniGenerazione = {}): Generazione {
  const data = opzioni.data ?? new Date()
  const rotazioniPrecedenti = opzioni.rotazioni ?? []
  const mese = meseDi(data)

  const voci: Voce[] = []
  const rotazioni: Rotazione[] = []

  for (const gruppo of ['verdura', 'frutta'] as GruppoFisso[]) {
    const { voce, indice } = voceGruppo(gruppo, mese, ultimoIndice(rotazioniPrecedenti, gruppo))
    if (voce) voci.push(voce)
    rotazioni.push({ categoria: gruppo, ultimoIndice: indice })
  }

  const occorrenze = occorrenzePerCiclo()
  for (const catalogo of categorie) {
    const quante = occorrenze.get(catalogo.id) ?? 0
    const precedente = ultimoIndice(rotazioniPrecedenti, catalogo.id)
    const { voci: vociDellaCategoria, indice } = vociCategoria(catalogo.id, quante, precedente)
    voci.push(...vociDellaCategoria)
    rotazioni.push({ categoria: catalogo.id, ultimoIndice: indice })
  }

  return {
    lista: {
      id: opzioni.id ?? `ciclo-${data.toISOString()}`,
      creataIl: data.toISOString(),
      stato: 'corrente',
      voci,
    },
    rotazioni,
  }
}
