// Il contatore delle voci generate (Step V4 di doc/13-piano-v2.md, F15).
// Funzioni pure come quelle della spunta: ogni operazione restituisce una
// lista nuova e lascia intatta quella di partenza. `comprata` non si tocca a
// mano: la decide il numero, completa quando i presi arrivano al totale.

import type { Lista, Voce } from './tipi'

/** Una voce col contatore: le generate v2. Le manuali e le rimaste dalla v1 si spuntano. */
export function haContatore(voce: Voce): voce is Voce & { quantita: number; presi: number } {
  return voce.quantita !== undefined
}

/**
 * La voce con `presi` portato a `numero`, tenuto tra 0 e il totale. Un numero
 * non valido, o una voce senza contatore, la lasciano com'è (lo stesso oggetto,
 * così `differenze` non la manda al database).
 */
export function contaVoce(voce: Voce, numero: number): Voce {
  if (!haContatore(voce) || !Number.isFinite(numero)) return voce
  const presi = Math.min(Math.max(Math.trunc(numero), 0), voce.quantita)
  const comprata = presi === voce.quantita
  if (presi === voce.presi && comprata === voce.comprata) return voce
  return { ...voce, presi, comprata }
}

function mappaVoce(lista: Lista, id: string, f: (voce: Voce) => Voce): Lista {
  let cambiata = false
  const voci = lista.voci.map((voce) => {
    if (voce.id !== id) return voce
    const nuova = f(voce)
    if (nuova !== voce) cambiata = true
    return nuova
  })
  return cambiata ? { ...lista, voci } : lista
}

/** Scrive il numero dei presi: a totale la voce è comprata, sotto no. */
export function impostaPresi(lista: Lista, id: string, numero: number): Lista {
  return mappaVoce(lista, id, (voce) => contaVoce(voce, numero))
}

/** Un pasto preso in più, fino al totale. */
export function aumenta(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => contaVoce(voce, (voce.presi ?? 0) + 1))
}

/** Un pasto in meno, fino a 0: da completa la voce torna da prendere. */
export function diminuisci(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => contaVoce(voce, (voce.presi ?? 0) - 1))
}
