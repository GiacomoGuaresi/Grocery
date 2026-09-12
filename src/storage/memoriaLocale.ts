// Quello che il dispositivo tiene per sé (Step 16): l'ultima lista vista e le
// scritture non ancora arrivate al database. Con queste l'app si apre anche
// senza rete, mostra la lista com'era e, al ritorno della rete, manda quello
// che era rimasto indietro.
//
// Sta in localStorage: la lista è piccola, e basta una lettura sincrona per
// averla a schermo prima ancora di sentire il database.

import type { Scrittura } from '../domain/sincronia'
import type { Lista, Voce } from '../domain/tipi'

/** Il pezzo di `localStorage` che serve qui: nei test lo fa una Map. */
export interface Scaffale {
  getItem(chiave: string): string | null
  setItem(chiave: string, valore: string): void
}

const CHIAVE_LISTA = 'grocery.lista'
const CHIAVE_CODA = 'grocery.coda'

export class MemoriaLocale {
  constructor(private readonly scaffale: Scaffale | null) {}

  /** L'ultima lista mostrata, con le modifiche fatte qui; `null` alla prima apertura. */
  leggiLista(): Lista | null {
    const lista = this.leggi<Lista | null>(CHIAVE_LISTA, null)
    if (!eLista(lista)) return null
    return { id: lista.id, creataIl: lista.creataIl, voci: lista.voci.map(senzaCampiV1) }
  }

  salvaLista(lista: Lista): void {
    this.scrivi(CHIAVE_LISTA, lista)
  }

  /**
   * Le scritture non ancora arrivate al database, dalla più vecchia. Quelle
   * rimaste dalla v1 perdono i campi che non esistono più; una scrittura senza
   * la forma giusta si lascia perdere, invece di bloccare le altre dietro.
   */
  leggiCoda(): Scrittura[] {
    const coda = this.leggi<unknown>(CHIAVE_CODA, [])
    if (!Array.isArray(coda)) return []
    return coda.filter(eScrittura).map(({ listaId, modifiche, quando }) => ({
      listaId,
      modifiche: { voci: modifiche.voci.map(senzaCampiV1), eliminate: modifiche.eliminate },
      quando,
    }))
  }

  salvaCoda(coda: Scrittura[]): void {
    this.scrivi(CHIAVE_CODA, coda)
  }

  /** Un valore illeggibile vale quanto uno assente: si riparte dal database. */
  private leggi<T>(chiave: string, altrimenti: T): T {
    try {
      const testo = this.scaffale?.getItem(chiave)
      return testo ? (JSON.parse(testo) as T) : altrimenti
    } catch (errore) {
      console.warn(`Memoria locale illeggibile: ${chiave}`, errore)
      return altrimenti
    }
  }

  /** Senza spazio (o in navigazione privata) si va avanti lo stesso, solo online. */
  private scrivi(chiave: string, valore: unknown): void {
    try {
      this.scaffale?.setItem(chiave, JSON.stringify(valore))
    } catch (errore) {
      console.warn(`Memoria locale non scrivibile: ${chiave}`, errore)
    }
  }
}

function eLista(valore: unknown): valore is Lista {
  const lista = valore as Lista | null
  return typeof lista?.id === 'string' && typeof lista.creataIl === 'string' && Array.isArray(lista.voci)
}

function eScrittura(valore: unknown): valore is Scrittura {
  const scrittura = valore as Scrittura | null
  return (
    typeof scrittura?.listaId === 'string' &&
    typeof scrittura.quando === 'string' &&
    Array.isArray(scrittura.modifiche?.voci) &&
    Array.isArray(scrittura.modifiche.eliminate)
  )
}

/** Via `alternative`, che nella v2 non esiste più (doc/06). */
function senzaCampiV1(voce: Voce): Voce {
  const { alternative: _, ...resto } = voce as Voce & { alternative?: unknown }
  return resto
}

/** La memoria di questo browser; senza `localStorage` non ricorda niente. */
export function memoriaDelBrowser(): MemoriaLocale {
  try {
    return new MemoriaLocale(globalThis.localStorage ?? null)
  } catch {
    // Alcuni browser, coi dati del sito bloccati, lanciano già leggendo la proprietà.
    return new MemoriaLocale(null)
  }
}
