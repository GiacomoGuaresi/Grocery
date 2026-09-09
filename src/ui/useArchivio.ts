// L'archivio letto dallo storage (Step 12 di doc/12-piano-sviluppo.md).
// Sola lettura: qui non si salva mai niente, le liste passate sono chiuse.

import { useCallback, useEffect, useState } from 'react'
import type { Lista, SintesiLista } from '../domain/tipi'
import { storage } from '../storage'

export type StatoArchivio =
  | { fase: 'caricamento' }
  | { fase: 'pronto'; liste: SintesiLista[] }
  | { fase: 'errore' }

export type StatoApertura =
  | { fase: 'chiusa' }
  | { fase: 'apertura'; id: string }
  | { fase: 'aperta'; lista: Lista }
  | { fase: 'errore' }

export interface Archivio {
  stato: StatoArchivio
  apertura: StatoApertura
  /** Carica una lista passata per intero e la mostra. */
  apri(id: string): void
  /** Torna all'elenco. */
  chiudi(): void
}

export function useArchivio(): Archivio {
  const [stato, setStato] = useState<StatoArchivio>({ fase: 'caricamento' })
  const [apertura, setApertura] = useState<StatoApertura>({ fase: 'chiusa' })

  useEffect(() => {
    let vivo = true
    void (async () => {
      try {
        const archivio = await storage()
        const liste = await archivio.leggiArchivio()
        if (vivo) setStato({ fase: 'pronto', liste })
      } catch (errore) {
        console.error('Archivio non disponibile', errore)
        if (vivo) setStato({ fase: 'errore' })
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const apri = useCallback((id: string) => {
    setApertura({ fase: 'apertura', id })
    void (async () => {
      try {
        const archivio = await storage()
        const lista = await archivio.leggiLista(id)
        // Se nel frattempo si è tornati all'elenco o si è chiesta un'altra
        // lista, quella che arriva adesso è vecchia: si butta.
        setApertura((corrente) => {
          if (corrente.fase !== 'apertura' || corrente.id !== id) return corrente
          return lista ? { fase: 'aperta', lista } : { fase: 'errore' }
        })
      } catch (errore) {
        console.error('Apertura della lista archiviata fallita', errore)
        setApertura((corrente) =>
          corrente.fase === 'apertura' && corrente.id === id ? { fase: 'errore' } : corrente,
        )
      }
    })()
  }, [])

  const chiudi = useCallback(() => setApertura({ fase: 'chiusa' }), [])

  return { stato, apertura, apri, chiudi }
}
