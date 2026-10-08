// Il Ricettario su Supabase (doc/14-piano-ricette.md): la tabella `ricette` e la
// Edge Function `importa-ricetta`, sullo stesso client (e sessione) della lista.

import {
  FunctionsFetchError,
  FunctionsHttpError,
  type PostgrestError,
  type SupabaseClient,
} from '@supabase/supabase-js'
import { nuovoIdRicetta } from '../domain/ricette'
import type { Ricetta, RicettaImportata } from '../domain/tipi'
import { ErroreImport, ErroreRete, type MotivoImport, type Ricettario } from './tipi'

interface RigaRicetta {
  id: string
  nome: string
  url: string
  immagine: string | null
  categorie: string[]
  ingredienti: string[]
  creata_il: string
}

const COLONNE = 'id, nome, url, immagine, categorie, ingredienti, creata_il'

const MOTIVI: readonly MotivoImport[] = ['nessun-link', 'non-ricetta', 'sito-irraggiungibile', 'non-autenticato']

export class RicettarioSupabase implements Ricettario {
  constructor(private readonly client: SupabaseClient) {}

  async leggiRicette(): Promise<Ricetta[]> {
    senzaRete()
    const { data, error, status } = await this.client
      .from('ricette')
      .select(COLONNE)
      .order('creata_il', { ascending: false })
    controlla(error, status)
    return (data as RigaRicetta[]).map(daRiga)
  }

  async salvaRicetta(ricetta: RicettaImportata): Promise<Ricetta> {
    senzaRete()
    const campi = {
      nome: ricetta.nome,
      immagine: ricetta.immagine ?? null,
      categorie: ricetta.categorie,
      ingredienti: ricetta.ingredienti,
    }
    const presente = await this.client.from('ricette').select('id').eq('url', ricetta.url).maybeSingle()
    controlla(presente.error, presente.status)

    const { data, error, status } = presente.data
      ? await this.client.from('ricette').update(campi).eq('id', presente.data.id).select(COLONNE).single()
      : await this.client
          .from('ricette')
          .insert({ ...campi, id: nuovoIdRicetta(), url: ricetta.url })
          .select(COLONNE)
          .single()
    controlla(error, status)
    return daRiga(data as RigaRicetta)
  }

  async eliminaRicetta(id: string): Promise<void> {
    senzaRete()
    const { error, status } = await this.client.from('ricette').delete().eq('id', id)
    controlla(error, status)
  }

  /**
   * La funzione risponde `{ ricetta }`, o `{ errore }` con uno stato 4xx/5xx:
   * il motivo passa nell'ErroreImport. Senza risposta è la rete che manca.
   */
  async importa(testo: string): Promise<RicettaImportata> {
    senzaRete()
    const { data, error } = await this.client.functions.invoke<{ ricetta: RicettaImportata }>(
      'importa-ricetta',
      { body: { testo } },
    )
    if (error instanceof FunctionsFetchError) throw new ErroreRete(error)
    if (error instanceof FunctionsHttpError) throw new ErroreImport(await motivo(error), error)
    if (error || !data?.ricetta) throw new ErroreImport('sconosciuto', error)
    return data.ricetta
  }
}

async function motivo(errore: FunctionsHttpError): Promise<MotivoImport> {
  try {
    const corpo = (await (errore.context as Response).json()) as { errore?: unknown }
    return MOTIVI.find((m) => m === corpo.errore) ?? 'sconosciuto'
  } catch {
    return 'sconosciuto'
  }
}

function daRiga(riga: RigaRicetta): Ricetta {
  return {
    id: riga.id,
    nome: riga.nome,
    url: riga.url,
    ...(riga.immagine ? { immagine: riga.immagine } : {}),
    categorie: riga.categorie,
    ingredienti: riga.ingredienti,
    creataIl: new Date(riga.creata_il).toISOString(),
  }
}

/** Come per la lista (supabase.ts): senza rete non si prova nemmeno. */
function senzaRete(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErroreRete()
}

function controlla(error: PostgrestError | null, status: number): void {
  if (!error) return
  if (status === 0) throw new ErroreRete(error)
  throw error
}
