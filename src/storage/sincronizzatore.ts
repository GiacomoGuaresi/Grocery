// La lista corrente tenuta in pari tra lo schermo, il dispositivo e il database
// (Step 5, 15 e 16 di doc/12-piano-sviluppo.md). Niente React qui dentro, così
// il ciclo offline → online si prova nei test; `useLista` ci si appoggia.
//
// Ogni modifica va subito a schermo e nella memoria del dispositivo, poi in
// coda verso il database. La coda sopravvive alla chiusura dell'app: senza
// rete le scritture aspettano, e partono appena lo storage avvisa che qualcosa
// può essere cambiato (la rete che torna, il realtime che si riconnette, l'app
// che torna in primo piano). Ognuna porta l'ora in cui è stata fatta: sulla
// stessa voce vince la più recente, anche se arriva per ultima quella vecchia.

import { nuovoCiclo } from '../domain/generazione'
import { differenze, nessunaModifica, unisci, vociInAttesa, type Scrittura } from '../domain/sincronia'
import type { Lista } from '../domain/tipi'
import type { MemoriaLocale } from './memoriaLocale'
import { ErroreRete, type Storage } from './tipi'

export type StatoLista =
  | { fase: 'caricamento' }
  | { fase: 'pronta'; lista: Lista }
  | { fase: 'errore' }

export interface Istantanea {
  stato: StatoLista
  /** Le modifiche fatte qui e non ancora arrivate al database. */
  inAttesa: number
  /** L'ultimo tentativo di parlare col database è fallito per mancanza di rete. */
  senzaRete: boolean
}

export interface Opzioni {
  storage: () => Promise<Storage>
  memoria: MemoriaLocale
  /** L'orologio del dispositivo: dà l'ora alle modifiche. */
  adesso?: () => Date
  /** Una generazione, altrove, arriva come una raffica di avvisi: si rilegge una volta sola. */
  pausa?: number
}

const PAUSA_RILETTURA = 250

/** La lista con cui parte un dispositivo quando il database non ne ha ancora una. */
function listaVuota(adesso: Date): Lista {
  const quando = adesso.toISOString()
  return { id: `lista-${quando}`, creataIl: quando, voci: [] }
}

export class Sincronizzatore {
  private lista: Lista | null = null
  private fallita = false
  private senzaRete = false
  private coda: Scrittura[]
  /** L'id della lista generata qui e non ancora arrivata al database. */
  private generata: string | null
  private istantanea: Istantanea
  // Tutto quello che parla col database passa di qui, uno alla volta: le
  // scritture arrivano nell'ordine in cui sono state fatte, e una rilettura
  // parte dopo le scritture già avviate invece di cancellarle dallo schermo.
  private fila: Promise<void> = Promise.resolve()
  private ascolti = new Set<(istantanea: Istantanea) => void>()
  private smetti?: () => void
  private attesa?: ReturnType<typeof setTimeout>
  private chiuso = false

  constructor(private readonly opzioni: Opzioni) {
    this.coda = opzioni.memoria.leggiCoda()
    this.generata = opzioni.memoria.leggiGenerata()
    this.istantanea = this.fotografa()
  }

  leggi(): Istantanea {
    return this.istantanea
  }

  /** `ascolta` riceve ogni istantanea nuova. Restituisce come smettere. */
  iscriviti(ascolta: (istantanea: Istantanea) => void): () => void {
    this.ascolti.add(ascolta)
    return () => this.ascolti.delete(ascolta)
  }

  /**
   * Mostra subito la lista rimasta sul dispositivo, se c'è, poi si mette in
   * ascolto dello storage e va a vedere cosa c'è sul database.
   */
  async apri(): Promise<void> {
    const salvata = this.opzioni.memoria.leggiLista()
    if (salvata) this.tieni(salvata)
    let storage: Storage
    try {
      storage = await this.opzioni.storage()
    } catch (errore) {
      console.error('Storage non disponibile', errore)
      this.fallita = true
      this.pubblica()
      return
    }
    if (this.chiuso) return
    this.smetti = storage.quandoCambia(() => {
      clearTimeout(this.attesa)
      this.attesa = setTimeout(() => void this.aggiorna(), this.opzioni.pausa ?? PAUSA_RILETTURA)
    })
    await this.aggiorna()
  }

  /**
   * Manda quello che è in coda e rilegge la lista. Per le voci con una
   * scrittura ancora in coda (rimasta indietro per la rete) vale la versione di
   * qui; se il database non ha ancora una lista corrente, gli si dà questa.
   */
  aggiorna(): Promise<void> {
    return this.inFila('Rilettura fallita', async (storage) => {
      await this.svuotaCoda(storage)
      const letta = await storage.leggiListaCorrente()
      if (letta) {
        const locale = this.lista
        // Generata qui mentre questa rilettura era già partita: vale la nuova,
        // che parte per il database subito dopo.
        if (this.generata && locale?.id === this.generata) return

        this.tieni(locale ? unisci(letta, locale, vociInAttesa(this.coda, locale.id)) : letta)
        return
      }
      const lista = this.lista ?? listaVuota(this.adesso())
      await storage.salvaLista(lista)
      this.tieni(lista)
    })
  }

  /** Applica una trasformazione pura alla lista e mette in coda le voci che ha toccato. */
  modifica(trasforma: (lista: Lista) => Lista): void {
    const prima = this.lista
    if (!prima) return
    const dopo = trasforma(prima)
    const modifiche = differenze(prima, dopo)
    if (nessunaModifica(modifiche)) return

    // Prima la coda, poi la lista: se l'app si chiude in mezzo, la modifica
    // arriva lo stesso al database e da lì torna a schermo.
    const scrittura = { listaId: prima.id, modifiche, quando: this.adesso().toISOString() }
    this.coda = [...this.coda, scrittura]
    this.opzioni.memoria.salvaCoda(this.coda)
    this.tieni(dopo)
    void this.inFila('Salvataggio fallito', (storage) => this.svuotaCoda(storage))
  }

  /**
   * Genera il ciclo nuovo: la lista nuova, con o senza le voci manuali rimaste
   * (R5), prende il posto di quella di adesso, che si cancella. Gira anche
   * senza rete (Step V3): la lista va subito a schermo e nella memoria, e parte
   * per il database appena si può, prima delle modifiche fatte dopo.
   */
  genera(portaAvanti: boolean): void {
    const lista = nuovoCiclo({ precedente: this.lista, portaAvanti, data: this.adesso() })
    // Come per le modifiche: prima il segno che manca il salvataggio, poi la lista.
    this.generata = lista.id
    this.opzioni.memoria.salvaGenerata(lista.id)
    this.tieni(lista)
    void this.inFila('Generazione fallita', (storage) => this.svuotaCoda(storage))
  }

  /** Quando tutto quello che è partito finora ha finito, riuscito o no. */
  finito(): Promise<void> {
    return this.fila
  }

  /** Smette di ascoltare e di scrivere: le scritture rimaste restano in memoria. */
  chiudi(): void {
    this.chiuso = true
    this.smetti?.()
    clearTimeout(this.attesa)
    this.ascolti.clear()
  }

  /**
   * Manda le scritture in coda, dalla più vecchia. Senza rete si ferma e le
   * tiene tutte; una scrittura che il database rifiuta invece si lascia
   * perdere, perché riprovarla darebbe lo stesso errore e bloccherebbe le
   * altre dietro di lei.
   */
  private async svuotaCoda(storage: Storage): Promise<void> {
    // Una lista generata qui senza rete va salvata per intero, con le
    // modifiche fatte nel frattempo; le scritture in coda per lei poi
    // riscrivono voci già giuste, quelle per la lista di prima non toccano niente.
    if (this.generata) {
      if (this.lista?.id === this.generata) await storage.salvaLista(this.lista)
      if (this.chiuso) return
      this.generata = null
      this.opzioni.memoria.salvaGenerata(null)
      this.pubblica()
    }
    while (this.coda.length > 0 && !this.chiuso) {
      const { listaId, modifiche, quando } = this.coda[0]
      try {
        await storage.salvaVoci(listaId, modifiche, quando)
      } catch (errore) {
        if (errore instanceof ErroreRete) throw errore
        console.error('Scrittura rifiutata dal database, la lascio perdere', errore)
      }
      if (this.chiuso) return
      this.coda = this.coda.slice(1)
      this.opzioni.memoria.salvaCoda(this.coda)
      this.pubblica()
    }
  }

  private inFila(cosa: string, lavoro: (storage: Storage) => Promise<void>): Promise<void> {
    this.fila = this.fila.then(async () => {
      if (this.chiuso) return
      try {
        await lavoro(await this.opzioni.storage())
        this.senzaRete = false
      } catch (errore) {
        if (errore instanceof ErroreRete) this.senzaRete = true
        else console.error(cosa, errore)
        // Senza una lista da mostrare, non resta che dirlo.
        if (!this.lista) this.fallita = true
      }
      if (!this.chiuso) this.pubblica()
    })
    return this.fila
  }

  private tieni(lista: Lista): void {
    this.lista = lista
    this.fallita = false
    this.opzioni.memoria.salvaLista(lista)
    this.pubblica()
  }

  private adesso(): Date {
    return this.opzioni.adesso?.() ?? new Date()
  }

  private fotografa(): Istantanea {
    const stato: StatoLista = this.lista
      ? { fase: 'pronta', lista: this.lista }
      : { fase: this.fallita ? 'errore' : 'caricamento' }
    const inAttesa = this.coda.length + (this.generata ? 1 : 0)
    return { stato, inAttesa, senzaRete: this.senzaRete }
  }

  private pubblica(): void {
    this.istantanea = this.fotografa()
    for (const ascolta of this.ascolti) ascolta(this.istantanea)
  }
}
