// Storage tenuto in memoria, con le stesse regole delle funzioni di Supabase.
// Serve ai test: fa da database condiviso per più dispositivi finti, ognuno col
// suo `Collegamento` che si stacca dalla rete a comando (Step 16). Per essere
// sicuri che si comporti come il database vero passa il contratto di Storage
// (inMemoria.test.ts).

import type { Modifiche } from '../domain/sincronia'
import type { Lista } from '../domain/tipi'
import { ErroreRete, type Storage } from './tipi'

export class StorageInMemoria implements Storage {
  private lista: Lista | null = null
  /** Id della voce → ora dell'ultima modifica che l'ha scritta (`modificata_il`). */
  private modificate = new Map<string, string>()
  /** Id delle voci eliminate dalla lista (`voci_eliminate`). */
  private eliminate = new Set<string>()
  private ascolti = new Set<() => void>()

  async leggiListaCorrente(): Promise<Lista | null> {
    return this.lista ? structuredClone(this.lista) : null
  }

  /** Come `salva_lista`: sostituisce la lista; se è un'altra, la vecchia sparisce con tutto. */
  async salvaLista(lista: Lista): Promise<void> {
    if (this.lista?.id !== lista.id) {
      this.modificate.clear()
      this.eliminate.clear()
    }
    const restano = new Set(lista.voci.map((voce) => voce.id))
    for (const id of this.modificate.keys()) {
      if (!restano.has(id)) this.modificate.delete(id)
    }
    this.lista = structuredClone(lista)
    this.suona()
  }

  /** Come `salva_voci`: vince la modifica più recente, le eliminate non tornano. */
  async salvaVoci(listaId: string, { voci, eliminate }: Modifiche, quando: string): Promise<void> {
    const lista = this.lista
    if (lista?.id !== listaId) return

    for (const id of eliminate) this.eliminate.add(id)
    lista.voci = lista.voci.filter((voce) => !this.eliminate.has(voce.id))

    for (const voce of voci) {
      if (this.eliminate.has(voce.id)) continue
      const precedente = this.modificate.get(voce.id)
      if (precedente !== undefined && precedente > quando) continue
      const posto = lista.voci.findIndex((presente) => presente.id === voce.id)
      if (posto >= 0) lista.voci[posto] = structuredClone(voce)
      else lista.voci.push(structuredClone(voce))
      this.modificate.set(voce.id, quando)
    }
    this.suona()
  }

  /** Avvisa a ogni scrittura di liste o voci, come il campanello del realtime. */
  quandoCambia(avvisa: () => void): () => void {
    this.ascolti.add(avvisa)
    return () => this.ascolti.delete(avvisa)
  }

  private suona(): void {
    for (const avvisa of this.ascolti) avvisa()
  }
}

/**
 * Un dispositivo attaccato al database in memoria, con la sua rete. Staccata,
 * ogni chiamata fallisce con `ErroreRete` e gli avvisi non arrivano;
 * riattaccata, avvisa come il realtime che si riconnette.
 */
export class Collegamento implements Storage {
  private inRete = true
  private ascolti = new Set<() => void>()

  constructor(private readonly db: StorageInMemoria) {}

  stacca(): void {
    this.inRete = false
  }

  riattacca(): void {
    this.inRete = true
    for (const avvisa of this.ascolti) avvisa()
  }

  leggiListaCorrente() {
    return this.passa(() => this.db.leggiListaCorrente())
  }

  salvaLista(lista: Lista) {
    return this.passa(() => this.db.salvaLista(lista))
  }

  salvaVoci(listaId: string, modifiche: Modifiche, quando: string) {
    return this.passa(() => this.db.salvaVoci(listaId, modifiche, quando))
  }

  quandoCambia(avvisa: () => void): () => void {
    const smetti = this.db.quandoCambia(() => {
      if (this.inRete) avvisa()
    })
    this.ascolti.add(avvisa)
    return () => {
      smetti()
      this.ascolti.delete(avvisa)
    }
  }

  private async passa<T>(chiamata: () => Promise<T>): Promise<T> {
    if (!this.inRete) throw new ErroreRete()
    return chiamata()
  }
}
