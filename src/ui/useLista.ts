// La lista corrente presa dallo storage e tenuta in sincronia con lui:
// ogni modifica va prima nello stato React (l'interfaccia risponde subito) e
// poi sul database, così sopravvive al refresh (Step 5 di doc/12-piano-sviluppo.md).

import { useCallback, useEffect, useRef, useState } from 'react'
import { nuovoCiclo } from '../domain/ciclo'
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
  /**
   * Genera il ciclo nuovo: archivia la lista corrente e la sostituisce, con o
   * senza le voci rimaste da prendere (Step 9).
   */
  genera(portaAvanti: boolean): void
}

/** La lista con cui parte un dispositivo che non ha ancora niente di salvato. */
function listaVuota(): Lista {
  const adesso = new Date().toISOString()
  return { id: `lista-${adesso}`, creataIl: adesso, stato: 'corrente', voci: [] }
}

export function useLista(): ListaPersistita {
  const [stato, setStato] = useState<StatoLista>({ fase: 'caricamento' })
  // Le scritture vengono messe in fila: arrivano al database nell'ordine in
  // cui sono state fatte, anche quando i tocchi si susseguono in fretta.
  const coda = useRef<Promise<unknown>>(Promise.resolve())
  // L'ultima lista salvata, leggibile da dentro la coda: la generazione parte
  // da quella, non dal valore che aveva lo stato quando è stata chiesta.
  const ultima = useRef<Lista | null>(null)

  const tieni = useCallback((lista: Lista) => {
    ultima.current = lista
    setStato({ fase: 'pronta', lista })
  }, [])

  useEffect(() => {
    let vivo = true
    void (async () => {
      try {
        const archivio = await storage()
        // Alla prima apertura non c'è ancora niente: la lista nasce vuota e si
        // riempie generandola o aggiungendo a mano.
        const salvata = await archivio.leggiListaCorrente()
        const lista = salvata ?? listaVuota()
        if (!salvata) await archivio.salvaLista(lista)
        if (vivo) tieni(lista)
      } catch (errore) {
        console.error('Storage non disponibile', errore)
        if (vivo) setStato({ fase: 'errore' })
      }
    })()
    return () => {
      vivo = false
    }
  }, [tieni])

  const modifica = useCallback(
    (trasforma: (lista: Lista) => Lista) => {
      setStato((corrente) => {
        if (corrente.fase !== 'pronta') return corrente
        const lista = trasforma(corrente.lista)
        ultima.current = lista
        coda.current = coda.current
          .then(() => storage())
          .then((archivio) => archivio.salvaLista(lista))
          .catch((errore) => console.error('Salvataggio fallito', errore))
        return { fase: 'pronta', lista }
      })
    },
    [],
  )

  /**
   * La generazione, a differenza delle altre operazioni, ha bisogno del
   * database prima di poter calcolare qualcosa: le rotazioni salvate sono la
   * memoria dei cicli passati. Perciò passa tutta per la coda e lo stato si
   * aggiorna solo a scritture avvenute.
   */
  const genera = useCallback(
    (portaAvanti: boolean) => {
      coda.current = coda.current
        .then(async () => {
          const archivio = await storage()
          const rotazioni = await archivio.leggiRotazioni()
          // Una lista ancora vuota non vale la pena di archiviarla.
          const precedente = ultima.current?.voci.length ? ultima.current : null
          const ciclo = nuovoCiclo({ precedente, portaAvanti, rotazioni })

          if (ciclo.archiviata) await archivio.salvaLista(ciclo.archiviata)
          await archivio.salvaLista(ciclo.lista)
          await archivio.salvaRotazioni(ciclo.rotazioni)
          tieni(ciclo.lista)
        })
        .catch((errore) => console.error('Generazione fallita', errore))
    },
    [tieni],
  )

  return { stato, modifica, genera }
}
