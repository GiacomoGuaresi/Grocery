// Piano settimanale (Step 11 di doc/12-piano-sviluppo.md): la tabella dei pasti
// di doc/02-routine-alimentare.md, in sola consultazione.
//
// Mostra la **categoria** del giorno ("mercoledì: pesce"), non la tipologia:
// l'algoritmo assegna le tipologie ai giorni solo per costruire la lista, e
// mangiare l'orata sabato invece che mercoledì è irrilevante (doc/08-ui-ux.md).

import { categoria, giorniRoutine } from './dati'
import type { IdCategoria } from './tipi'

/** Un giorno della tabella, pronto da mostrare. */
export interface GiornoPiano {
  /** 1 = lunedì ... 7 = domenica. */
  giorno: number
  /** Il nome del giorno come si scrive: "mercoledì". */
  etichetta: string
  categoria: IdCategoria
  /** L'etichetta della categoria dal catalogo: "Pesce". */
  etichettaCategoria: string
}

/** I nomi dei giorni con gli accenti, indicizzati da 1 a 7 come nella routine. */
const etichette: Record<number, string> = {
  1: 'lunedì',
  2: 'martedì',
  3: 'mercoledì',
  4: 'giovedì',
  5: 'venerdì',
  6: 'sabato',
  7: 'domenica',
}

/**
 * Il giorno della settimana di una data, da lunedì (1) a domenica (7).
 * `getDay()` conta da domenica: qui si riporta alla numerazione della routine.
 */
export function giornoDellaSettimana(data: Date = new Date()): number {
  return data.getDay() === 0 ? 7 : data.getDay()
}

/**
 * La settimana intera, da lunedì a domenica. Dati statici: è sempre la stessa
 * tabella, non dipende dalla lista né dalle rotazioni.
 */
export function pianoSettimanale(): GiornoPiano[] {
  return [...giorniRoutine]
    .sort((a, b) => a.giorno - b.giorno)
    .map((giorno) => ({
      giorno: giorno.giorno,
      etichetta: etichette[giorno.giorno] ?? giorno.nome,
      categoria: giorno.categoria,
      etichettaCategoria: categoria(giorno.categoria)?.etichetta ?? giorno.categoria,
    }))
}
