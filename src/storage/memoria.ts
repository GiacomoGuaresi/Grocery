// Persistenza in memoria: niente sopravvive alla chiusura della pagina.
// Serve nei test e come ripiego quando IndexedDB non è disponibile.

import type { Persistenza } from './tipi'

export class PersistenzaMemoria implements Persistenza {
  private dati: Uint8Array | null = null

  async carica(): Promise<Uint8Array | null> {
    return this.dati
  }

  async salva(dati: Uint8Array): Promise<void> {
    this.dati = dati.slice()
  }
}
