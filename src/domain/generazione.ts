// Algoritmo di generazione della lista (Step 8 di doc/12-piano-sviluppo.md).
// Solo logica, nessuna UI: dalla routine, dai cataloghi e dalla stagionalità
// escono le voci di un ciclo di due settimane (doc/03-algoritmo-generazione.md).
//
// La scelta è **casuale**, non a giro fisso sul catalogo: scorrendo il catalogo
// in ordine capitavano cicli interi sullo stesso animale, cambiando solo il
// taglio (R2). L'unica memoria è l'elenco delle tipologie proposte l'ultima
// volta, che l'algoritmo restituisce aggiornato perché venga salvato: quelle si
// evitano al giro dopo (R3).

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
  /** La memoria del ciclo precedente. Assente = si pesca da tutto il catalogo. */
  rotazioni?: Rotazione[]
  /** Id della lista prodotta. Default: derivato dalla data. */
  id?: string
  /** La sorgente del caso, sostituibile nei test. Default: `Math.random`. */
  caso?: () => number
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

/** Le tipologie proposte l'ultima volta per questo catalogo, da evitare adesso. */
function ultimi(rotazioni: Rotazione[], chiave: ChiaveRotazione): Set<string> {
  return new Set(rotazioni.find((r) => r.categoria === chiave)?.ultimi ?? [])
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
 * Pesca a caso `quanti` elementi dai candidati, senza ripetizioni (R4). Quello
 * che era uscito l'ultima volta passa in coda: si ripesca solo se il catalogo
 * di stagione è troppo corto per farne a meno (R3). Se i candidati sono meno
 * delle voci da riempire — le uova, che hanno una sola tipologia — si ricomincia
 * da capo e la stessa voce si ripete.
 */
function pesca<T>(
  candidati: T[],
  quanti: number,
  nome: (voce: T) => string,
  daEvitare: Set<string>,
  caso: () => number,
): T[] {
  if (candidati.length === 0) return []
  const urna = [
    ...mescola(
      candidati.filter((voce) => !daEvitare.has(nome(voce))),
      caso,
    ),
    ...mescola(
      candidati.filter((voce) => daEvitare.has(nome(voce))),
      caso,
    ),
  ]
  return Array.from({ length: quanti }, (_, i) => urna[i % urna.length])
}

/** Le voci di una categoria per il ciclo, con le tipologie da ricordare. */
function vociCategoria(
  id: IdCategoria,
  quante: number,
  daEvitare: Set<string>,
  caso: () => number,
): { voci: Voce[]; ultimi: string[] } {
  const catalogo = categorie.find((c) => c.id === id)
  if (!catalogo) return { voci: [], ultimi: [] }

  const scelti = pesca(catalogo.tipi, quante, (tipo) => tipo.nome, daEvitare, caso)
  const voci = scelti.map((tipo, posizione) => ({
    id: `${id}-${posizione + 1}`,
    nome: tipo.nome,
    reparto: tipo.reparto,
    categoria: id,
    origine: 'generata' as const,
    comprata: false,
  }))
  // Le categorie fisse hanno una tipologia sola: non c'è niente da evitare (R8).
  return { voci, ultimi: catalogo.fisso ? [] : scelti.map((tipo) => tipo.nome) }
}

/**
 * La voce raggruppata di verdura o frutta: `tipiPerCiclo` tipi di stagione,
 * diversi tra loro, pescati a caso tra quelli del mese (R5, R5b, R5d).
 */
function voceGruppo(
  gruppo: GruppoFisso,
  mese: Mese,
  daEvitare: Set<string>,
  caso: () => number,
): { voce: Voce | null; ultimi: string[] } {
  const diStagione = Object.keys(stagionalita[gruppo]).filter((nome) =>
    stagionalita[gruppo][nome].includes(mese),
  )
  const { tipiPerCiclo, reparto } = gruppiFissi[gruppo]
  const scelti = pesca(diStagione, tipiPerCiclo, (nome) => nome, daEvitare, caso)
  if (scelti.length === 0) return { voce: null, ultimi: [] }

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
    ultimi: scelti,
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
  const caso = opzioni.caso ?? Math.random
  const mese = meseDi(data)

  const voci: Voce[] = []
  const rotazioni: Rotazione[] = []

  for (const gruppo of ['verdura', 'frutta'] as GruppoFisso[]) {
    const scelta = voceGruppo(gruppo, mese, ultimi(rotazioniPrecedenti, gruppo), caso)
    if (scelta.voce) voci.push(scelta.voce)
    rotazioni.push({ categoria: gruppo, ultimi: scelta.ultimi })
  }

  const occorrenze = occorrenzePerCiclo()
  for (const catalogo of categorie) {
    const quante = occorrenze.get(catalogo.id) ?? 0
    const scelta = vociCategoria(
      catalogo.id,
      quante,
      ultimi(rotazioniPrecedenti, catalogo.id),
      caso,
    )
    voci.push(...scelta.voci)
    rotazioni.push({ categoria: catalogo.id, ultimi: scelta.ultimi })
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
