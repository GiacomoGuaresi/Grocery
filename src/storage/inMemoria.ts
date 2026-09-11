// Storage tenuto in memoria, con le stesse regole delle funzioni di Supabase.
// Serve ai test: fa da database condiviso per più dispositivi finti, ognuno col
// suo `Collegamento` che si stacca dalla rete a comando (Step 16). Per essere
// sicuri che si comporti come il database vero passa il contratto di Storage
// (inMemoria.test.ts).

import type { Modifiche } from '../domain/sincronia'
import type { Lista, Rotazione, SintesiLista } from '../domain/tipi'
import { ErroreRete, type Storage } from './tipi'

export class StorageInMemoria implements Storage {
  private liste = new Map<string, Lista>()
  /** `lista/voce` → ora dell'ultima modifica che l'ha scritta (`modificata_il`). */
  private modificate = new Map<string, string>()
  /** `lista/voce` delle voci eliminate (`voci_eliminate`). */
  private eliminate = new Set<string>()
  private rotazioni: Rotazione[] = []
  private ascolti = new Set<() => void>()

  async leggiListaCorrente(): Promise<Lista | null> {
    const corrente = [...this.liste.values()].find((lista) => lista.stato === 'corrente')
    return corrente ? structuredClone(corrente) : null
  }

  async leggiLista(id: string): Promise<Lista | null> {
    const lista = this.liste.get(id)
    return lista ? structuredClone(lista) : null
  }

  /** Come `salva_lista`: sostituisce la lista e archivia le altre correnti. */
  async salvaLista(lista: Lista): Promise<void> {
    if (lista.stato === 'corrente') {
      for (const altra of this.liste.values()) {
        if (altra.id !== lista.id && altra.stato === 'corrente') altra.stato = 'archiviata'
      }
    }
    const restano = new Set(lista.voci.map((voce) => chiave(lista.id, voce.id)))
    for (const quale of this.modificate.keys()) {
      if (quale.startsWith(`${lista.id}/`) && !restano.has(quale)) this.modificate.delete(quale)
    }
    this.liste.set(lista.id, structuredClone(lista))
    this.suona()
  }

  /** Come `salva_voci`: vince la modifica più recente, le eliminate non tornano. */
  async salvaVoci(listaId: string, { voci, eliminate }: Modifiche, quando: string): Promise<void> {
    const lista = this.liste.get(listaId)
    if (lista?.stato !== 'corrente') return

    for (const id of eliminate) this.eliminate.add(chiave(listaId, id))
    lista.voci = lista.voci.filter((voce) => !this.eliminate.has(chiave(listaId, voce.id)))

    for (const voce of voci) {
      const quale = chiave(listaId, voce.id)
      if (this.eliminate.has(quale)) continue
      const precedente = this.modificate.get(quale)
      if (precedente !== undefined && precedente > quando) continue
      const posto = lista.voci.findIndex((presente) => presente.id === voce.id)
      if (posto >= 0) lista.voci[posto] = structuredClone(voce)
      else lista.voci.push(structuredClone(voce))
      this.modificate.set(quale, quando)
    }
    this.suona()
  }

  async leggiArchivio(): Promise<SintesiLista[]> {
    return [...this.liste.values()]
      .filter((lista) => lista.stato === 'archiviata')
      .sort((a, b) => b.creataIl.localeCompare(a.creataIl))
      .map((lista) => ({
        id: lista.id,
        creataIl: lista.creataIl,
        quanteVoci: lista.voci.length,
        quanteComprate: lista.voci.filter((voce) => voce.comprata).length,
      }))
  }

  async leggiRotazioni(): Promise<Rotazione[]> {
    return structuredClone(this.rotazioni).sort((a, b) => a.categoria.localeCompare(b.categoria))
  }

  async salvaRotazioni(rotazioni: Rotazione[]): Promise<void> {
    this.rotazioni = structuredClone(rotazioni)
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

  leggiLista(id: string) {
    return this.passa(() => this.db.leggiLista(id))
  }

  salvaLista(lista: Lista) {
    return this.passa(() => this.db.salvaLista(lista))
  }

  salvaVoci(listaId: string, modifiche: Modifiche, quando: string) {
    return this.passa(() => this.db.salvaVoci(listaId, modifiche, quando))
  }

  leggiArchivio() {
    return this.passa(() => this.db.leggiArchivio())
  }

  leggiRotazioni() {
    return this.passa(() => this.db.leggiRotazioni())
  }

  salvaRotazioni(rotazioni: Rotazione[]) {
    return this.passa(() => this.db.salvaRotazioni(rotazioni))
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

function chiave(listaId: string, voceId: string): string {
  return `${listaId}/${voceId}`
}
