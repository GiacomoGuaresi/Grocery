// Ricette (doc/14-piano-ricette.md): dagli ingredienti di una ricetta salvata
// alle voci della lista, e la ricerca nella sezione Ricette. Funzioni pure,
// come quelle della spunta: restituiscono una lista nuova.
//
// In lista l'ingrediente tiene il testo del sito ("burro 125 g fuso") e sta
// sotto il nome della sua ricetta, non in un reparto.

import { normalizza, nuovoId } from './aggiunta'
import type { Lista, Ricetta, RiferimentoRicetta, Voce } from './tipi'

/** Un ingrediente nel passo "quali aggiungo alla lista?". */
export interface IngredienteDaScegliere {
  testo: string
  /** Spuntato all'inizio: tutti, tranne i q.b. (sale, pepe, olio…) che di solito ci sono. */
  scelto: boolean
  /** C'è già una voce da prendere con lo stesso nome: lo si dice, si aggiunge lo stesso. */
  giaInLista: boolean
}

/** Vero per gli ingredienti "q.b.", "qb" o "quanto basta". */
export function eQuantoBasta(testo: string): boolean {
  const chiave = normalizza(testo)
  return /(^|[^a-z])q\.?\s?b\.?($|[^a-z])/.test(chiave) || chiave.includes('quanto basta')
}

// Quello che in un ingrediente non è il suo nome: numeri, frazioni e unità.
const UNITA = new Set([
  'g', 'gr', 'grammi', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'lt', 'litri', 'litro',
  'cucchiaio', 'cucchiai', 'cucchiaino', 'cucchiaini', 'tazza', 'tazze', 'tazzina', 'tazzine',
  'bicchiere', 'bicchieri', 'pizzico', 'pizzichi', 'spicchio', 'spicchi', 'foglia', 'foglie',
  'rametto', 'rametti', 'ciuffo', 'mazzetto', 'bustina', 'bustine', 'fetta', 'fette',
  'pz', 'n', 'nr', 'qb', 'q', 'b', 'circa',
])

/**
 * Il nome dell'ingrediente, per confrontarlo con le voci della lista: senza
 * parentesi, quantità e unità. "Pecorino Romano DOP 50 g" → "pecorino romano dop".
 */
export function nomeIngrediente(testo: string): string {
  return normalizza(testo.replace(/\([^)]*\)/g, ' '))
    .split(/[\s,.;:]+/)
    .filter((parola) => parola !== '' && !/^[\d/½¼¾.,-]+$/.test(parola) && !UNITA.has(parola))
    .join(' ')
}

/**
 * Vero se nella lista c'è già da prendere una voce con questo nome: uguale, o
 * l'una l'inizio dell'altra a parole intere ("pecorino" e "pecorino romano").
 */
function giaDaPrendere(lista: Lista, testo: string): boolean {
  const chiave = nomeIngrediente(testo)
  if (chiave === '') return false
  return lista.voci.some((voce) => {
    if (voce.comprata) return false
    const nome = voce.ricetta ? nomeIngrediente(voce.nome) : normalizza(voce.nome)
    return nome === chiave || chiave.startsWith(`${nome} `) || nome.startsWith(`${chiave} `)
  })
}

/** Gli ingredienti della ricetta da proporre, nell'ordine del sito. */
export function ingredientiDaScegliere(ricetta: Ricetta, lista: Lista | null): IngredienteDaScegliere[] {
  return ricetta.ingredienti.map((testo) => ({
    testo,
    scelto: !eQuantoBasta(testo),
    giaInLista: lista ? giaDaPrendere(lista, testo) : false,
  }))
}

/**
 * Aggiunge in fondo alla lista gli ingredienti scelti, col testo del sito,
 * sotto la loro ricetta. Non vale la regola "le voci non si ripetono" delle
 * aggiunte a mano: ogni ricetta tiene i suoi ingredienti. `ids` li sceglie chi
 * chiama, per sapere quali righe far arrivare.
 */
export function aggiungiIngredienti(
  lista: Lista,
  ricetta: RiferimentoRicetta,
  testi: string[],
  ids: string[] = testi.map(() => nuovoId()),
): Lista {
  const nuove: Voce[] = []
  testi.forEach((testo, i) => {
    const nome = testo.trim().replace(/\s+/g, ' ')
    if (nome === '') return
    nuove.push({
      id: ids[i] ?? nuovoId(),
      nome,
      reparto: 'altro',
      origine: 'manuale',
      comprata: false,
      ricetta: { id: ricetta.id, nome: ricetta.nome },
    })
  })
  return nuove.length === 0 ? lista : { ...lista, voci: [...lista.voci, ...nuove] }
}

/** Un id per una ricetta nuova, distinto da quelli delle voci. */
export function nuovoIdRicetta(): string {
  return `ricetta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Le categorie delle ricette salvate, senza doppioni, in ordine alfabetico: i chip del filtro. */
export function categorieRicette(ricette: Ricetta[]): string[] {
  const viste = new Map<string, string>()
  for (const ricetta of ricette)
    for (const categoria of ricetta.categorie) {
      const chiave = normalizza(categoria)
      if (!viste.has(chiave)) viste.set(chiave, categoria)
    }
  return [...viste.values()].sort((a, b) => a.localeCompare(b, 'it'))
}

/**
 * Le ricette col nome che contiene il testo cercato (tollerante come il
 * catalogo) e, se c'è, della categoria scelta. L'ordine resta quello dato.
 */
export function filtraRicette(ricette: Ricetta[], testo: string, categoria: string | null): Ricetta[] {
  const cercato = normalizza(testo)
  const nellaCategoria = categoria === null ? null : normalizza(categoria)
  return ricette.filter(
    (ricetta) =>
      normalizza(ricetta.nome).includes(cercato) &&
      (nellaCategoria === null || ricetta.categorie.some((c) => normalizza(c) === nellaCategoria)),
  )
}
