// Implementazione di Storage su Supabase (Step 13): le tabelle e le funzioni
// sono in supabase/migrations. Le letture passano dalle tabelle; le scritture
// composte da funzioni Postgres, perché il client non apre transazioni.

import { createBrowserClient } from '@supabase/ssr'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Modifiche } from '../domain/sincronia'
import type { IdReparto, Lista, Voce } from '../domain/tipi'
import { AccessoSupabase } from './accesso'
import { ErroreRete, type Storage } from './tipi'

/**
 * Storage e accesso sullo stesso client, così le letture viaggiano con la
 * sessione aperta dalla passphrase. `createBrowserClient` tiene la sessione nei
 * cookie (400 giorni, rinnovati a ogni uso) con percorso `/`: Projects sta sulla
 * stessa origine e sullo stesso progetto Supabase, così le due app condividono
 * la sessione (entri in una, sei dentro anche nell'altra).
 */
export function connettiSupabase(url: string, chiave: string, email: string) {
  dimenticaSessioneDelPercorsoApp()
  const client = createBrowserClient(url, chiave, {
    cookieOptions: { path: '/' },
  })
  return { storage: new StorageSupabase(client), accesso: new AccessoSupabase(client, email) }
}

/**
 * Fino al 2026-09-13 i cookie della sessione stavano sul percorso dell'app
 * (`/Grocery/`). Se restassero, il browser avrebbe due sessioni con lo stesso
 * nome e il client potrebbe leggere quella vecchia, coi token ormai scaduti.
 * Si cancellano: al primo avvio si rientra con la passphrase, una volta sola.
 */
function dimenticaSessioneDelPercorsoApp() {
  const percorso = import.meta.env.BASE_URL
  if (typeof document === 'undefined' || percorso === '/') return
  for (const coppia of document.cookie.split('; ')) {
    const nome = coppia.split('=')[0]
    if (nome.startsWith('sb-')) document.cookie = `${nome}=; path=${percorso}; max-age=0`
  }
}

interface RigaVoce {
  id: string
  nome: string
  reparto: string
  categoria: string | null
  origine: Voce['origine']
  comprata: boolean
  quantita: number | null
  presi: number | null
}

interface RigaLista {
  id: string
  creata_il: string
  voci: RigaVoce[]
}

const COLONNE_LISTA =
  'id, creata_il, voci(id, nome, reparto, categoria, origine, comprata, quantita, presi)'

export class StorageSupabase implements Storage {
  constructor(private readonly client: SupabaseClient) {}

  /** Di liste ce n'è al più una: la garantisce un indice unico. */
  async leggiListaCorrente(): Promise<Lista | null> {
    senzaRete()
    const { data, error, status } = await this.client
      .from('liste')
      .select(COLONNE_LISTA)
      .order('posizione', { referencedTable: 'voci' })
      .maybeSingle()
    controlla(error, status)
    if (!data) return null

    const riga = data as RigaLista
    return {
      id: riga.id,
      creataIl: dataIso(riga.creata_il),
      voci: riga.voci.map(daRigaVoce),
    }
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
   * ne aggiorna la riga (`aggiornata_il`), e la nascita di una lista nuova ne
   * inserisce una. Le voci arrivano poi con la rilettura. Così dal canale non
   * passa mai il contenuto della lista, nemmeno quello delle voci cancellate,
   * che Postgres manderebbe senza guardare le policy.
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
  if (riga.quantita !== null) voce.quantita = riga.quantita
  if (riga.presi !== null) voce.presi = riga.presi
  return voce
}

/**
 * Postgres restituisce `2026-09-07T08:00:00+00:00`; l'app scrive e confronta
 * nella forma di `toISOString()`, e così torna.
 */
function dataIso(timestamp: string): string {
  return new Date(timestamp).toISOString()
}
