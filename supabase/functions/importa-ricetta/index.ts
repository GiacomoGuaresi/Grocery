// Edge Function `importa-ricetta` (doc/14-piano-ricette.md): scarica la pagina
// di una ricetta e ne restituisce nome, foto, categorie e ingredienti. Esiste
// perché il browser non può leggere le pagine di altri siti (niente CORS): la
// PWA, statica su GitHub Pages, le chiede a lei.
//
// Solo per la sessione autenticata dell'app: la controlla qui, chiedendo a
// Supabase Auth chi è il token (verify_jwt è spento in config.toml, così vale
// anche con le chiavi di firma nuove).
//
// Deploy, su tutti e due i progetti (doc/07):
//   supabase functions deploy importa-ricetta

import { estraiRicetta, estraiUrl } from '../_shared/estraiRicetta.ts'

const ORIGINI = ['https://giacomoguaresi.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173']
const TEMPO_MASSIMO_MS = 8000
const PESO_MASSIMO = 3 * 1024 * 1024
const REDIRECT_MASSIMI = 5
// Alcuni siti rispondono diverso (o non rispondono) a chi non sembra un browser.
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'

type Errore = 'non-autenticato' | 'nessun-link' | 'non-ricetta' | 'sito-irraggiungibile'

Deno.serve(async (richiesta) => {
  const cors = intestazioniCors(richiesta)
  if (richiesta.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (richiesta.method !== 'POST') return risposta({ errore: 'nessun-link' }, 405, cors)

  if (!(await autenticata(richiesta))) return errore('non-autenticato', 401, cors)

  let testo: unknown
  try {
    testo = ((await richiesta.json()) as { testo?: unknown }).testo
  } catch {
    return errore('nessun-link', 400, cors)
  }
  const url = typeof testo === 'string' ? estraiUrl(testo) : null
  if (!url || !indirizzoPubblico(new URL(url))) return errore('nessun-link', 422, cors)

  let pagina: { html: string; url: string }
  try {
    pagina = await scarica(url)
  } catch (motivo) {
    console.warn('Pagina non scaricata', url, motivo)
    return errore('sito-irraggiungibile', 502, cors)
  }

  const ricetta = estraiRicetta(pagina.html, pagina.url)
  if (!ricetta) return errore('non-ricetta', 422, cors)
  return risposta({ ricetta }, 200, cors)
})

/** Il token della richiesta è una sessione valida di questo progetto. */
async function autenticata(richiesta: Request): Promise<boolean> {
  const token = richiesta.headers.get('authorization')
  const chiave = richiesta.headers.get('apikey')
  const progetto = Deno.env.get('SUPABASE_URL')
  if (!token || !chiave || !progetto) return false
  const utente = await fetch(`${progetto}/auth/v1/user`, {
    headers: { authorization: token, apikey: chiave },
  })
  return utente.ok
}

/**
 * La pagina, seguendo i redirect a mano (i link brevi come `share.google/…`),
 * così ogni tappa passa dal controllo dell'indirizzo. Tempo e peso limitati.
 */
async function scarica(partenza: string): Promise<{ html: string; url: string }> {
  const segnale = AbortSignal.timeout(TEMPO_MASSIMO_MS)
  let url = new URL(partenza)
  for (let salti = 0; salti <= REDIRECT_MASSIMI; salti++) {
    if (!indirizzoPubblico(url)) throw new Error(`Indirizzo non ammesso: ${url}`)
    const pagina = await fetch(url, {
      redirect: 'manual',
      signal: segnale,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml', 'accept-language': 'it-IT,it' },
    })
    const destinazione = pagina.headers.get('location')
    if (pagina.status >= 300 && pagina.status < 400 && destinazione) {
      await pagina.body?.cancel()
      url = new URL(destinazione, url)
      continue
    }
    // Sito giù, o che respinge chi non è un browser: "irraggiungibile". Una
    // pagina che non c'è (404…) si legge lo stesso, e non avendo una ricetta
    // finisce in "non-ricetta".
    if (pagina.status >= 500 || pagina.status === 403 || pagina.status === 429) {
      await pagina.body?.cancel()
      throw new Error(`HTTP ${pagina.status}`)
    }
    return { html: await leggiFinoA(pagina, PESO_MASSIMO), url: url.toString() }
  }
  throw new Error('Troppi redirect')
}

/** Il corpo come testo, fermandosi al peso massimo: lo JSON-LD sta nella `<head>`. */
async function leggiFinoA(pagina: Response, massimo: number): Promise<string> {
  const lettore = pagina.body?.getReader()
  if (!lettore) return ''
  const pezzi: Uint8Array[] = []
  let letti = 0
  while (letti < massimo) {
    const { done, value } = await lettore.read()
    if (done) break
    pezzi.push(value)
    letti += value.byteLength
  }
  await lettore.cancel()
  const tutto = new Uint8Array(letti)
  let posto = 0
  for (const pezzo of pezzi) {
    tutto.set(pezzo, posto)
    posto += pezzo.byteLength
  }
  return new TextDecoder().decode(tutto)
}

/**
 * Solo siti pubblici in http(s): niente localhost, reti private o indirizzi
 * della piattaforma, perché la funzione non diventi un modo per guardarci dentro.
 */
function indirizzoPubblico(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.username || url.password) return false
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (host.endsWith('.local') || host.endsWith('.internal')) return false
  if (!host.includes('.') && !host.includes(':')) return false
  if (host.includes(':')) return !/^(::1?|f[cd][0-9a-f]{2}:|fe80:|::ffff:)/.test(host)
  const ottetti = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)?.slice(1).map(Number)
  if (!ottetti) return true
  const [a, b] = ottetti
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function intestazioniCors(richiesta: Request): Record<string, string> {
  const origine = richiesta.headers.get('origin') ?? ''
  return {
    'access-control-allow-origin': ORIGINI.includes(origine) ? origine : ORIGINI[0],
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    vary: 'origin',
  }
}

function errore(codice: Errore, stato: number, cors: Record<string, string>): Response {
  return risposta({ errore: codice }, stato, cors)
}

function risposta(corpo: unknown, stato: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8' },
  })
}
