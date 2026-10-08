// La lista corrente per React: il lavoro lo fa il Sincronizzatore, che la
// tiene in pari tra schermo, dispositivo e database anche senza rete (Step 5,
// 15 e 16 di doc/12-piano-sviluppo.md). Qui si apre, si ascolta e si chiude.

import { useCallback, useEffect, useRef, useState } from 'react'
import { nuovoId } from '../domain/aggiunta'
import { Cronologia, type Mappa, type Passo, type Verso } from '../domain/cronologia'
import type { Lista } from '../domain/tipi'
import { storage } from '../storage'
import { memoriaDelBrowser } from '../storage/memoriaLocale'
import { Sincronizzatore, type Istantanea } from '../storage/sincronizzatore'

export type { StatoLista } from '../storage/sincronizzatore'

export interface ListaPersistita extends Istantanea {
  /** Applica una trasformazione pura alla lista e salva le voci che ha toccato. */
  modifica(trasforma: (lista: Lista) => Lista): void
  /**
   * Genera il ciclo nuovo: sostituisce la lista corrente, che si cancella, con
   * o senza le voci manuali rimaste. Funziona anche senza rete (Step V3).
   */
  genera(portaAvanti: boolean): void
  /**
   * Annulla e ripristina (doc/08-ui-ux.md): la cronologia delle modifiche fatte
   * qui in questa sessione. `prossimo` dice quale passo toccherebbe; `salta`
   * applica proprio quel passo, se è ancora in cronologia, e dice quali voci
   * sono tornate con un id nuovo (null se il passo non c'era più). Generare
   * una lista nuova la svuota.
   */
  cronologia: {
    puoAnnullare: boolean
    puoRipristinare: boolean
    prossimo(verso: Verso): Passo | null
    salta(verso: Verso, passo: Passo): Mappa | null
  }
  /** La lista di adesso, anche se React non l'ha ancora ridisegnata. */
  leggiLista(): Lista | null
}

const ALL_INIZIO: Istantanea = { stato: { fase: 'caricamento' }, inAttesa: 0, senzaRete: false }

export function useLista(): ListaPersistita {
  const [istantanea, setIstantanea] = useState<Istantanea>(ALL_INIZIO)
  const sincronizzatore = useRef<Sincronizzatore | null>(null)
  // Fuori da React, così `modifica` la aggiorna senza aspettare un render;
  // `setPile` serve solo a ridisegnare i tasti.
  const [cronologia] = useState(() => new Cronologia(nuovoId))
  const [pile, setPile] = useState({ puoAnnullare: false, puoRipristinare: false })
  const aggiornaPile = useCallback(
    () =>
      setPile({ puoAnnullare: cronologia.puoAnnullare, puoRipristinare: cronologia.puoRipristinare }),
    [cronologia],
  )

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

  // Una lista nuova, generata qui o sull'altro dispositivo: la cronologia era della vecchia.
  const listaId = istantanea.stato.fase === 'pronta' ? istantanea.stato.lista.id : null
  useEffect(() => {
    if (listaId === null) return
    cronologia.perLista(listaId)
    aggiornaPile()
  }, [listaId, cronologia, aggiornaPile])

  const modifica = useCallback(
    (trasforma: (lista: Lista) => Lista) => {
      sincronizzatore.current?.modifica((lista) => {
        const dopo = trasforma(lista)
        cronologia.registra(lista, dopo)
        return dopo
      })
      aggiornaPile()
    },
    [cronologia, aggiornaPile],
  )

  const genera = useCallback((portaAvanti: boolean) => {
    sincronizzatore.current?.genera(portaAvanti)
  }, [])

  const prossimo = useCallback((verso: Verso) => cronologia.prossimo(verso), [cronologia])

  const salta = useCallback(
    (verso: Verso, passo: Passo): Mappa | null => {
      let mappa: Mappa | null = null
      sincronizzatore.current?.modifica((lista) => {
        const fatto = cronologia.salta(lista, verso, passo)
        mappa = fatto?.mappa ?? null
        return fatto?.lista ?? lista
      })
      aggiornaPile()
      return mappa
    },
    [cronologia, aggiornaPile],
  )

  const leggiLista = useCallback(() => {
    const stato = sincronizzatore.current?.leggi().stato
    return stato?.fase === 'pronta' ? stato.lista : null
  }, [])

  return {
    ...istantanea,
    modifica,
    genera,
    cronologia: {
      ...pile,
      prossimo,
      salta,
    },
    leggiLista,
  }
}
