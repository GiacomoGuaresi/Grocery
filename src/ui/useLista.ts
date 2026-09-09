// La lista corrente presa dallo storage e tenuta in sincronia con lui:
// ogni modifica va prima nello stato React (l'interfaccia risponde subito) e
// poi sul database, così sopravvive al refresh (Step 5 di doc/12-piano-sviluppo.md).

import { useCallback, useEffect, useRef, useState } from 'react'
import { listaEsempio } from '../domain/listaEsempio'
import type { Lista } from '../domain/tipi'
import { storage } from '../storage'

export type StatoLista =
  | { fase: 'caricamento' }
  | { fase: 'pronta'; lista: Lista }
  | { fase: 'errore' }

export interface ListaPersistita {
  stato: StatoLista
  /** Applica una trasformazione pura alla lista e la salva. */
  modifica(trasforma: (lista: Lista) => Lista): void
}

export function useLista(): ListaPersistita {
  const [stato, setStato] = useState<StatoLista>({ fase: 'caricamento' })
  // Le scritture vengono messe in fila: arrivano al database nell'ordine in
  // cui sono state fatte, anche quando i tocchi si susseguono in fretta.
  const coda = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    let vivo = true
    void (async () => {
      try {
        const archivio = await storage()
        // Finché non c'è la generazione (Step 9) la prima apertura parte
        // dalla lista di esempio, che da qui in poi è a tutti gli effetti
        // la lista corrente.
        const salvata = await archivio.leggiListaCorrente()
        const lista = salvata ?? listaEsempio
        if (!salvata) await archivio.salvaLista(lista)
        if (vivo) setStato({ fase: 'pronta', lista })
      } catch (errore) {
        console.error('Storage non disponibile', errore)
        if (vivo) setStato({ fase: 'errore' })
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const modifica = useCallback((trasforma: (lista: Lista) => Lista) => {
    setStato((corrente) => {
      if (corrente.fase !== 'pronta') return corrente
      const lista = trasforma(corrente.lista)
      coda.current = coda.current
        .then(() => storage())
        .then((archivio) => archivio.salvaLista(lista))
        .catch((errore) => console.error('Salvataggio fallito', errore))
      return { fase: 'pronta', lista }
    })
  }, [])

  return { stato, modifica }
}
