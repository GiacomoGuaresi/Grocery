// Archivio delle liste passate (Step 12 di doc/12-piano-sviluppo.md): solo le
// etichette con cui l'elenco si legge a colpo d'occhio. Le liste archiviate
// non si toccano più (F11), quindi qui non ci sono transizioni di stato:
// tutto quello che segue è formattazione.

import type { Lista, SintesiLista } from './tipi'

/** La data di una lista come si scrive: "7 settembre 2026". */
export function etichettaData(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Com'è andata quella spesa, in una riga: "12 voci · 10 prese". Quando si è
 * preso tutto lo si dice e basta, che è l'informazione vera.
 */
export function riepilogo(sintesi: SintesiLista): string {
  const voci = `${sintesi.quanteVoci} ${sintesi.quanteVoci === 1 ? 'voce' : 'voci'}`
  if (sintesi.quanteVoci === 0) return 'nessuna voce'
  if (sintesi.quanteComprate === sintesi.quanteVoci) return `${voci} · tutte prese`
  if (sintesi.quanteComprate === 0) return `${voci} · nessuna presa`
  return `${voci} · ${sintesi.quanteComprate} prese`
}

/** La sintesi di una lista già caricata: l'elenco e la lista aperta dicono le stesse cose. */
export function sintesi(lista: Lista): SintesiLista {
  return {
    id: lista.id,
    creataIl: lista.creataIl,
    quanteVoci: lista.voci.length,
    quanteComprate: lista.voci.filter((voce) => voce.comprata).length,
  }
}
