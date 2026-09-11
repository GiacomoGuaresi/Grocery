// Implementazione di Storage su Supabase (Step 13): le tabelle e le funzioni
// sono in supabase/migrations. Le letture passano dalle tabelle; le scritture
// composte da funzioni Postgres, perché il client non apre transazioni.

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Modifiche } from '../domain/sincronia'
import type { IdReparto, Lista, Rotazione, SintesiLista, Voce } from '../domain/tipi'
import { AccessoSupabase } from './accesso'
import type { Storage } from './tipi'

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
    const { data, error } = await this.client
      .from('archivio')
      .select('id, creata_il, quante_voci, quante_comprate')
      .order('creata_il', { ascending: false })
    if (error) throw error
    return data.map((riga) => ({
      id: riga.id,
      creataIl: dataIso(riga.creata_il),
      quanteVoci: riga.quante_voci,
      quanteComprate: riga.quante_comprate,
    }))
  }

  /** Tutto in una transazione, dentro `salva_lista`: vedi la migrazione. */
  async salvaLista(lista: Lista): Promise<void> {
    const { error } = await this.client.rpc('salva_lista', { lista })
    if (error) throw error
  }

  /** In `salva_voci`: si scrivono solo le voci toccate, e vince l'ultima scrittura. */
  async salvaVoci(listaId: string, { voci, eliminate }: Modifiche): Promise<void> {
    const { error } = await this.client.rpc('salva_voci', {
      id_lista: listaId,
      modificate: voci,
      eliminate,
    })
    if (error) throw error
  }

  /**
   * Il realtime ascolta solo la tabella `liste`: ogni scrittura sulla lista
   * corrente ne aggiorna la riga (`aggiornata_il`), e la nascita di una lista
   * nuova ne inserisce una. Le voci arrivano poi con la rilettura. Così dal
   * canale non passa mai il contenuto della lista, nemmeno quello delle voci
   * cancellate, che Postgres manderebbe senza guardare le policy.
   *
   * Il realtime non ripete quello che si è perso: si avvisa anche a ogni
   * (ri)connessione del canale e quando l'app torna in primo piano, perché il
   * telefono in tasca chiude il socket senza dirlo a nessuno.
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
    const conDocumento = typeof document !== 'undefined'
    if (conDocumento) document.addEventListener('visibilitychange', tornando)

    return () => {
      if (conDocumento) document.removeEventListener('visibilitychange', tornando)
      void this.client.removeChannel(canale)
    }
  }

  private static canali = 0

  async leggiRotazioni(): Promise<Rotazione[]> {
    const { data, error } = await this.client
      .from('rotazioni')
      .select('categoria, ultimi')
      .order('categoria')
    if (error) throw error
    return data as Rotazione[]
  }

  async salvaRotazioni(rotazioni: Rotazione[]): Promise<void> {
    const { error } = await this.client.rpc('salva_rotazioni', { rotazioni })
    if (error) throw error
  }

  /** La lista con la colonna uguale al valore, voci comprese; `null` se non c'è. */
  private async lista(colonna: 'id' | 'stato', valore: string): Promise<Lista | null> {
    const { data, error } = await this.client
      .from('liste')
      .select(COLONNE_LISTA)
      .eq(colonna, valore)
      .order('posizione', { referencedTable: 'voci' })
      .maybeSingle()
    if (error) throw error
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

/** Come StorageSqlite: i campi opzionali assenti restano assenti, non `null`. */
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
