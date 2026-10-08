// Le ricette salvate per React (doc/14-piano-ricette.md). A schermo va subito
// l'elenco visto l'ultima volta, tenuto sul dispositivo; poi si rilegge dal
// database. Importare ed eliminare vogliono la rete.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ricetta } from '../domain/tipi'
import { ricettario } from '../storage'
import { memoriaDelBrowser } from '../storage/memoriaLocale'

export interface RicettePersistite {
  ricette: Ricetta[]
  /** Vero finché il database non ha risposto almeno una volta. */
  inLettura: boolean
  /** Vero se l'ultima lettura non è arrivata: l'elenco è quello salvato qui. */
  nonAggiornate: boolean
  /**
   * Importa la ricetta dal link nel testo e la salva (o aggiorna quella con lo
   * stesso link). Lancia ErroreImport o ErroreRete. Due chiamate con lo stesso
   * testo, mentre la prima è in corso, aspettano la stessa risposta.
   */
  importa(testo: string): Promise<Ricetta>
  elimina(id: string): Promise<void>
}

const memoria = memoriaDelBrowser()

export function useRicette(): RicettePersistite {
  const [ricette, setRicette] = useState<Ricetta[]>(() => memoria.leggiRicette())
  const [inLettura, setInLettura] = useState(true)
  const [nonAggiornate, setNonAggiornate] = useState(false)
  const inCorso = useRef(new Map<string, Promise<Ricetta>>())

  const aggiorna = useCallback((nuove: Ricetta[]) => {
    memoria.salvaRicette(nuove)
    setRicette(nuove)
  }, [])

  useEffect(() => {
    let vivo = true
    ricettario()
      .leggiRicette()
      .then((lette) => {
        if (!vivo) return
        aggiorna(lette)
        setNonAggiornate(false)
      })
      .catch((errore) => {
        console.warn('Ricette non lette: resta la copia sul dispositivo', errore)
        if (vivo) setNonAggiornate(true)
      })
      .finally(() => vivo && setInLettura(false))
    return () => {
      vivo = false
    }
  }, [aggiorna])

  const importa = useCallback(
    (testo: string) => {
      const gia = inCorso.current.get(testo)
      if (gia) return gia
      const porta = ricettario()
      const promessa = porta
        .importa(testo)
        .then((importata) => porta.salvaRicetta(importata))
        .then((salvata) => {
          setRicette((prima) => {
            const nuove = [salvata, ...prima.filter((r) => r.id !== salvata.id)]
            memoria.salvaRicette(nuove)
            return nuove
          })
          return salvata
        })
        .finally(() => inCorso.current.delete(testo))
      inCorso.current.set(testo, promessa)
      return promessa
    },
    [],
  )

  const elimina = useCallback(async (id: string) => {
    await ricettario().eliminaRicetta(id)
    setRicette((prima) => {
      const nuove = prima.filter((r) => r.id !== id)
      memoria.salvaRicette(nuove)
      return nuove
    })
  }, [])

  return { ricette, inLettura, nonAggiornate, importa, elimina }
}
