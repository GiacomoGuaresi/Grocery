// Implementazione di Storage su Supabase (Step 13): le tabelle e le funzioni
// sono in supabase/migrations. Le letture passano dalle tabelle; le scritture
// composte da funzioni Postgres, perché il client non apre transazioni.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IdReparto, Lista, Rotazione, SintesiLista, Voce } from '../domain/tipi'
import type { Storage } from './tipi'

/** Lo storage su un progetto Supabase, con la chiave pubblica del progetto. */
export function apriStorageSupabase(url: string, chiave: string): StorageSupabase {
  return new StorageSupabase(createClient(url, chiave))
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
