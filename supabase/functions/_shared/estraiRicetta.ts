// Dalla pagina di una ricetta ai dati che servono a Grocery (doc/14-piano-ricette.md).
// I siti di ricette (GialloZafferano, Fatto in casa da Benedetta, e quasi tutti
// gli altri) mettono nella pagina lo JSON-LD schema.org `Recipe`, per Google:
// si legge quello, invece di inseguire l'HTML di ogni sito.
//
// TypeScript senza dipendenze: lo usa la Edge Function `importa-ricetta` (Deno)
// e lo provano i test di Vitest.

/** Quello che la funzione restituisce all'app: la forma di `RicettaImportata` in src/domain/tipi.ts. */
export interface RicettaEstratta {
  nome: string
  /** Il link della ricetta: il canonical della pagina, se c'è. */
  url: string
  /** La foto, sul sito d'origine: non si copia. */
  immagine?: string
  /** Le categorie del sito ("Primi piatti", "Dolci"…), anche nessuna. */
  categorie: string[]
  /** Gli ingredienti col testo del sito, quantità comprese ("burro 125 g fuso"). */
  ingredienti: string[]
}

/**
 * Il link dentro il testo condiviso. L'app di GialloZafferano manda "titolo +
 * link", Chrome solo il link; un link di ricerca di Google (`google.com/url?q=`)
 * si scioglie nel sito a cui porta. Nessun link: `null`.
 */
export function estraiUrl(testo: string): string | null {
  const trovato = testo.match(/https?:\/\/[^\s<>"']+/i)?.[0]
  if (!trovato) return null
  let url: URL
  try {
    url = new URL(trovato.replace(/[).,;!?]+$/, ''))
  } catch {
    return null
  }
  if (/(^|\.)google\.[a-z.]+$/i.test(url.hostname) && url.pathname === '/url') {
    const destinazione = url.searchParams.get('q') ?? url.searchParams.get('url')
    if (destinazione) return estraiUrl(destinazione)
  }
  return url.toString()
}

/**
 * La ricetta descritta dalla pagina, oppure `null` se la pagina non ne ha una
 * (o non ha né nome né ingredienti). `url` è l'indirizzo da cui è arrivata la
 * pagina, dopo i redirect: vale se manca il canonical.
 */
export function estraiRicetta(html: string, url: string): RicettaEstratta | null {
  const ricetta = blocchiJsonLd(html).flatMap(nodi).find(eRicetta)
  if (!ricetta) return null

  const nome = testoPulito(ricetta.name)
  const ingredienti = elenco(ricetta.recipeIngredient).map(testoPulito).filter((i) => i !== '')
  if (nome === '' || ingredienti.length === 0) return null

  const immagine = immagineDi(ricetta.image)
  return {
    nome,
    url: canonical(html, url),
    ...(immagine ? { immagine } : {}),
    categorie: [...new Set(elenco(ricetta.recipeCategory).flatMap(categorieDi))],
    ingredienti,
  }
}

type Nodo = Record<string, unknown>

/** Il contenuto di ogni `<script type="application/ld+json">` leggibile; quelli rotti si saltano. */
function blocchiJsonLd(html: string): unknown[] {
  const blocchi: unknown[] = []
  const script = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
  for (const [, corpo] of html.matchAll(script)) {
    try {
      blocchi.push(JSON.parse(corpo.trim()))
    } catch {
      // Un blocco malformato non deve far perdere gli altri.
    }
  }
  return blocchi
}

/** Gli oggetti di un blocco: da solo, in un array o dentro `@graph` (Yoast, WP Recipe Maker). */
function nodi(valore: unknown): Nodo[] {
  if (Array.isArray(valore)) return valore.flatMap(nodi)
  if (!eOggetto(valore)) return []
  const grafo = valore['@graph']
  return Array.isArray(grafo) ? [valore, ...grafo.flatMap(nodi)] : [valore]
}

function eRicetta(nodo: Nodo): boolean {
  return elenco(nodo['@type']).some((tipo) => tipo === 'Recipe')
}

function eOggetto(valore: unknown): valore is Nodo {
  return typeof valore === 'object' && valore !== null && !Array.isArray(valore)
}

/** Un valore che può essere uno solo o un array, sempre come array. */
function elenco(valore: unknown): unknown[] {
  if (valore === undefined || valore === null) return []
  return Array.isArray(valore) ? valore : [valore]
}

/** "Primi piatti", ["Biscotti", "Dolci"] o "Dolci, Torte": sempre un elenco di nomi. */
function categorieDi(valore: unknown): string[] {
  return testoPulito(valore)
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c !== '')
}

/** La foto può essere un URL, un ImageObject o un elenco dei due: si prende la prima. */
function immagineDi(valore: unknown): string | undefined {
  for (const voce of elenco(valore)) {
    const candidato = eOggetto(voce) ? voce.url ?? voce.contentUrl : voce
    if (typeof candidato === 'string' && /^https?:\/\//i.test(candidato)) return candidato
  }
  return undefined
}

function canonical(html: string, url: string): string {
  for (const [link] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["']?canonical\b/i.test(link)) continue
    const href = link.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!href) continue
    try {
      return new URL(decodificaEntita(href), url).toString()
    } catch {
      // Un canonical illeggibile vale quanto nessuno.
    }
  }
  return url
}

/** Un testo dello JSON-LD come si legge: senza tag, entità sciolte, spazi in ordine. */
function testoPulito(valore: unknown): string {
  if (typeof valore !== 'string' && typeof valore !== 'number') return ''
  return decodificaEntita(String(valore).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const ENTITA: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—',
  agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  Agrave: 'À', Egrave: 'È', Eacute: 'É', Igrave: 'Ì', Ograve: 'Ò', Ugrave: 'Ù',
  deg: '°', frac12: '½', frac14: '¼', frac34: '¾',
}

/** Le entità HTML che i siti lasciano nello JSON-LD ("1&frasl;2", "l&rsquo;uovo"). */
function decodificaEntita(testo: string): string {
  return testo.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (intera, corpo: string) => {
    if (corpo[0] === '#') {
      const codice = corpo[1] === 'x' || corpo[1] === 'X' ? parseInt(corpo.slice(2), 16) : parseInt(corpo.slice(1), 10)
      return Number.isFinite(codice) && codice > 0 && codice <= 0x10ffff ? String.fromCodePoint(codice) : intera
    }
    if (corpo === 'frasl') return '/'
    return ENTITA[corpo] ?? intera
  })
}
