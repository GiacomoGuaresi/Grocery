// Implementazione di Storage su Supabase (Step 13): le tabelle e le funzioni
// sono in supabase/migrations. Le letture passano dalle tabelle; le scritture
// composte da funzioni Postgres, perché il client non apre transazioni.

import { createBrowserClient } from '@supabase/ssr'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Modifiche } from '../domain/sincronia'
import type { IdReparto, Lista, Rotazione, SintesiLista, Voce } from '../domain/tipi'
import { AccessoSupabase } from './accesso'
import { ErroreRete, type Storage } from './tipi'

/**
 * Storage e accesso sullo stesso client, così le letture viaggiano con la
 * sessione aperta dalla passphrase. `createBrowserClient` tiene la sessione nei
 * cookie (400 giorni, rinnovati a ogni uso), limitati al percorso dell'app.
 */
export function connettiSupabase(url: string, chiave: string, email: string) {
  const client = createBrowserClient(url, chiave, {
    cookieOptions: { path: import.meta.env.BASE_URL },
  })
  return { storage: new StorageSupabase(client), accesso: new AccessoSupabase(client, email) }
}

interface RigaVoce {
  id: string
  nome: string
  reparto: string
  categoria: string | null
  origine: Voce['origine']
  comprata: boolean
  alternative: string[] | null
}

interface RigaLista {
  id: string
  creata_il: string
  stato: Lista['stato']
  voci: RigaVoce[]
}

const COLONNE_LISTA =
  'id, creata_il, stato, voci(id, nome, reparto, categoria, origine, comprata, alternative)'

export class StorageSupabase implements Storage {
  constructor(private readonly client: SupabaseClient) {}

  async leggiListaCorrente(): Promise<Lista | null> {
    // Di correnti ce n'è al più una: la garantisce un indice unico.
    return this.lista('stato', 'corrente')
  }

  async leggiLista(id: string): Promise<Lista | null> {
    return this.lista('id', id)
  }

  /** Dalla vista `archivio`, che conta le voci senza tirarle su (F11). */
  async leggiArchivio(): Promise<SintesiLista[]> {
    senzaRete()
    const { data, error, status } = await this.client
      .from('archivio')
      .select('id, creata_il, quante_voci, quante_comprate')
      .order('creata_il', { ascending: false })
    controlla(error, status)
    return data!.map((riga) => ({
      id: riga.id,
      creataIl: dataIso(riga.creata_il),
      quanteVoci: riga.quante_voci,
      quanteComprate: riga.quante_comprate,
    }))
  }

  /** Tutto in una transazione, dentro `salva_lista`: vedi la migrazione. */
  async salvaLista(lista: Lista): Promise<void> {
    senzaRete()
    const { error, status } = await this.client.rpc('salva_lista', { lista })
    controlla(error, status)
  }

  /**
   * In `salva_voci`: si scrivono solo le voci toccate, e sulla stessa voce
   * vince la modifica più recente; le eliminate non tornano.
   */
  async salvaVoci(listaId: string, { voci, eliminate }: Modifiche, quando: string): Promise<void> {
    senzaRete()
    const { error, status } = await this.client.rpc('salva_voci', {
      id_lista: listaId,
      modificate: voci,
      eliminate,
      quando,
    })
    controlla(error, status)
  }

  /**
   * Il realtime ascolta solo la tabella `liste`: ogni scrittura sulla lista
   * corrente ne aggiorna la riga (`aggiornata_il`), e la nascita di una lista
   * nuova ne inserisce una. Le voci arrivano poi con la rilettura. Così dal
   * canale non passa mai il contenuto della lista, nemmeno quello delle voci
   * cancellate, che Postgres manderebbe senza guardare le policy.
   *
   * Il realtime non ripete quello che si è perso: si avvisa anche a ogni
   * (ri)connessione del canale, quando l'app torna in primo piano e quando
   * torna la rete, perché il telefono in tasca chiude il socket senza dirlo a
   * nessuno.
   */
  quandoCambia(avvisa: () => void): () => void {
    const canale = this.client
      // Un nome nuovo per ogni ascolto: con lo stesso nome il client
      // restituirebbe il canale di prima, magari ancora in chiusura.
      .channel(`lista-corrente-${++StorageSupabase.canali}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'liste' }, () => avvisa())
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') avvisa()
      })

    const tornando = () => {
      if (document.visibilityState === 'visible') avvisa()
    }
    const nelBrowser = typeof window !== 'undefined'
    if (nelBrowser) {
      document.addEventListener('visibilitychange', tornando)
      window.addEventListener('online', avvisa)
    }

    return () => {
      if (nelBrowser) {
        document.removeEventListener('visibilitychange', tornando)
        window.removeEventListener('online', avvisa)
      }
      void this.client.removeChannel(canale)
    }
  }

  private static canali = 0

  async leggiRotazioni(): Promise<Rotazione[]> {
    senzaRete()
    const { data, error, status } = await this.client
      .from('rotazioni')
      .select('categoria, ultimi')
      .order('categoria')
    controlla(error, status)
    return data as Rotazione[]
  }

  async salvaRotazioni(rotazioni: Rotazione[]): Promise<void> {
    senzaRete()
    const { error, status } = await this.client.rpc('salva_rotazioni', { rotazioni })
    controlla(error, status)
  }

  /** La lista con la colonna uguale al valore, voci comprese; `null` se non c'è. */
  private async lista(colonna: 'id' | 'stato', valore: string): Promise<Lista | null> {
    senzaRete()
    const { data, error, status } = await this.client
      .from('liste')
      .select(COLONNE_LISTA)
      .eq(colonna, valore)
      .order('posizione', { referencedTable: 'voci' })
      .maybeSingle()
    controlla(error, status)
    if (!data) return null

    const riga = data as RigaLista
    return {
      id: riga.id,
      creataIl: dataIso(riga.creata_il),
      stato: riga.stato,
      voci: riga.voci.map(daRigaVoce),
    }
  }
}

/**
 * Se il browser sa già di essere senza rete non si prova nemmeno: le letture
 * di PostgREST, prima di arrendersi, ritentano per qualche secondo. Il
 * contrario non vale: `onLine` vero non garantisce che la rete ci sia.
 */
function senzaRete(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErroreRete()
}

/**
 * Gli errori del database passano come sono. Una richiesta che non ha avuto
 * risposta — PostgREST la restituisce con stato 0 — diventa `ErroreRete`.
 */
function controlla(error: PostgrestError | null, status: number): void {
  if (!error) return
  if (status === 0) throw new ErroreRete(error)
  throw error
}

/** I campi opzionali assenti restano assenti, non `null`. */
function daRigaVoce(riga: RigaVoce): Voce {
  const voce: Voce = {
    id: riga.id,
    nome: riga.nome,
    reparto: riga.reparto as IdReparto,
    origine: riga.origine,
    comprata: riga.comprata,
  }
  if (riga.categoria !== null) voce.categoria = riga.categoria as Voce['categoria']
  if (riga.alternative !== null) voce.alternative = riga.alternative
  return voce
}

/**
 * Postgres restituisce `2026-09-07T08:00:00+00:00`; l'app scrive e confronta
 * nella forma di `toISOString()`, e così torna.
 */
function dataIso(timestamp: string): string {
  return new Date(timestamp).toISOString()
}
