// La lista corrente per React: il lavoro lo fa il Sincronizzatore, che la
// tiene in pari tra schermo, dispositivo e database anche senza rete (Step 5,
// 15 e 16 di doc/12-piano-sviluppo.md). Qui si apre, si ascolta e si chiude.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lista } from '../domain/tipi'
import { storage } from '../storage'
import { memoriaDelBrowser } from '../storage/memoriaLocale'
import { Sincronizzatore, type Istantanea } from '../storage/sincronizzatore'

export type { StatoLista } from '../storage/sincronizzatore'

export interface ListaPersistita extends Istantanea {
  /** Applica una trasformazione pura alla lista e salva le voci che ha toccato. */
  modifica(trasforma: (lista: Lista) => Lista): void
  /**
   * Genera il ciclo nuovo: archivia la lista corrente e la sostituisce, con o
   * senza le voci rimaste da prendere (Step 9).
   */
  genera(portaAvanti: boolean): void
}

const ALL_INIZIO: Istantanea = { stato: { fase: 'caricamento' }, inAttesa: 0, senzaRete: false }

export function useLista(): ListaPersistita {
  const [istantanea, setIstantanea] = useState<Istantanea>(ALL_INIZIO)
  const sincronizzatore = useRef<Sincronizzatore | null>(null)

  useEffect(() => {
    const aperto = new Sincronizzatore({ storage, memoria: memoriaDelBrowser() })
    sincronizzatore.current = aperto
    aperto.iscriviti(setIstantanea)
    setIstantanea(aperto.leggi())
    void aperto.apri()
    return () => {
      aperto.chiudi()
      if (sincronizzatore.current === aperto) sincronizzatore.current = null
    }
  }, [])

  const modifica = useCallback((trasforma: (lista: Lista) => Lista) => {
    sincronizzatore.current?.modifica(trasforma)
  }, [])

  const genera = useCallback((portaAvanti: boolean) => {
    sincronizzatore.current?.genera(portaAvanti)
  }, [])

  return { ...istantanea, modifica, genera }
}
