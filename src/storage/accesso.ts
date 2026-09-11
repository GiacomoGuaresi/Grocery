// Accesso con passphrase (F8, Step 14): un solo account condiviso, la
// passphrase ne è la password. Come per Storage, il resto dell'app conosce
// solo l'interfaccia: con SQLite lo stato non esce dal dispositivo e si entra
// sempre; con Supabase serve la sessione, che le policy pretendono.

import type { SupabaseClient } from '@supabase/supabase-js'

export type EsitoAccesso = 'dentro' | 'passphrase-sbagliata' | 'errore'

export interface Accesso {
  /** Vero se su questo dispositivo si è già entrati: la passphrase non si richiede. */
  haSessione(): Promise<boolean>
  entra(passphrase: string): Promise<EsitoAccesso>
  /** `avvisa` scatta quando la sessione finisce (revocata, scaduta). Restituisce come smettere. */
  quandoEsce(avvisa: () => void): () => void
}

/** Lo storage locale di sviluppo non ha niente da proteggere. */
export const accessoLibero: Accesso = {
  haSessione: async () => true,
  entra: async () => 'dentro',
  quandoEsce: () => () => {},
}

export class AccessoSupabase implements Accesso {
  constructor(
    private readonly client: SupabaseClient,
    /** L'email dell'unico account: chi entra scrive solo la passphrase. */
    private readonly email: string,
  ) {}

  async haSessione(): Promise<boolean> {
    const { data, error } = await this.client.auth.getSession()
    if (data.session) return true
    // Senza rete il rinnovo del token fallisce, ma la sessione resta nei
    // cookie: a chi è già entrato non si chiede la passphrase in corsia.
    return error?.name === 'AuthRetryableFetchError'
  }

  async entra(passphrase: string): Promise<EsitoAccesso> {
    const { error } = await this.client.auth.signInWithPassword({
      email: this.email,
      password: passphrase,
    })
    if (!error) return 'dentro'
    if (error.code === 'invalid_credentials') return 'passphrase-sbagliata'
    console.error('Accesso non riuscito', error)
    return 'errore'
  }

  quandoEsce(avvisa: () => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') avvisa()
    })
    return () => data.subscription.unsubscribe()
  }
}
