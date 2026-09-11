// La lista condivisa tra due dispositivi (F7, Step 15 di doc/12-piano-sviluppo.md).
// Funzioni pure: cosa mandare al database dopo una modifica, come applicarlo, e
// come mettere insieme la lista riletta con quello che da qui non è ancora
// arrivato.
//
// I conflitti si risolvono *last-write-wins* per singola voce (doc/07): si
// scrivono solo le voci toccate, quindi due persone che spuntano cose diverse
// non si pestano i piedi, e sulla stessa voce vince l'ultima scrittura.

import type { Lista, Voce } from './tipi'

/** Quello che una modifica ha cambiato: le voci nuove o toccate, e quelle tolte. */
export interface Modifiche {
  voci: Voce[]
  eliminate: string[]
}

/**
 * Le voci cambiate tra `prima` e `dopo`. Le transizioni del dominio lasciano
 * intatti gli oggetti delle voci che non toccano, quindi basta confrontare i
 * riferimenti: al peggio una voce uguale viene riscritta, e non fa danni.
 */
export function differenze(prima: Lista, dopo: Lista): Modifiche {
  const vecchie = new Map(prima.voci.map((voce) => [voce.id, voce]))
  const restano = new Set(dopo.voci.map((voce) => voce.id))
  return {
    voci: dopo.voci.filter((voce) => vecchie.get(voce.id) !== voce),
    eliminate: prima.voci.filter((voce) => !restano.has(voce.id)).map((voce) => voce.id),
  }
}

export function nessunaModifica({ voci, eliminate }: Modifiche): boolean {
  return voci.length === 0 && eliminate.length === 0
}

/**
 * Applica le modifiche alla lista: le voci toccate cambiano al loro posto, le
 * nuove vanno in fondo, le tolte spariscono. Una voce sia toccata sia tolta
 * resta tolta, come nella funzione `salva_voci` di Supabase.
 */
export function applicaModifiche(lista: Lista, { voci, eliminate }: Modifiche): Lista {
  const via = new Set(eliminate)
  const toccate = new Map(voci.map((voce) => [voce.id, voce]))
  const presenti = new Set(lista.voci.map((voce) => voce.id))
  return {
    ...lista,
    voci: [
      ...lista.voci.filter((voce) => !via.has(voce.id)).map((voce) => toccate.get(voce.id) ?? voce),
      ...voci.filter((voce) => !presenti.has(voce.id) && !via.has(voce.id)),
    ],
  }
}

/**
 * La lista riletta dal database, tranne le voci `inVolo`: quelle cambiate qui e
 * non ancora scritte, per cui vale la versione locale — presente o tolta che
 * sia. Altrimenti una rilettura capitata a metà farebbe tornare indietro per un
 * attimo la spunta appena data. Se nel frattempo è nata una lista nuova (generata
 * sull'altro dispositivo) vale quella: le modifiche in volo erano per la vecchia.
 */
export function unisci(letta: Lista, locale: Lista, inVolo: ReadonlySet<string>): Lista {
  if (letta.id !== locale.id || inVolo.size === 0) return letta
  const locali = new Map(locale.voci.map((voce) => [voce.id, voce]))
  const lette = new Set(letta.voci.map((voce) => voce.id))
  return {
    ...letta,
    voci: [
      ...letta.voci.flatMap((voce) => {
        if (!inVolo.has(voce.id)) return [voce]
        const mia = locali.get(voce.id)
        return mia ? [mia] : []
      }),
      ...locale.voci.filter((voce) => inVolo.has(voce.id) && !lette.has(voce.id)),
    ],
  }
}
