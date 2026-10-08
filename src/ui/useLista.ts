// La lista corrente per React: il lavoro lo fa il Sincronizzatore, che la
// tiene in pari tra schermo, dispositivo e database anche senza rete (Step 5,
// 15 e 16 di doc/12-piano-sviluppo.md). Qui si apre, si ascolta e si chiude.

import { useCallback, useEffect, useRef, useState } from 'react'
import { LUNGHEZZA_CRONOLOGIA, passoTra, riporta, type Passo, type Verso } from '../domain/cronologia'
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
   * qui in questa sessione. `prossimo` dice quale passo toccherebbe, `salta` lo
   * fa. Generare una lista nuova la svuota.
   */
  cronologia: {
    puoAnnullare: boolean
    puoRipristinare: boolean
    prossimo(verso: Verso): Passo | null
    salta(verso: Verso): void
  }
}

const ALL_INIZIO: Istantanea = { stato: { fase: 'caricamento' }, inAttesa: 0, senzaRete: false }

export function useLista(): ListaPersistita {
  const [istantanea, setIstantanea] = useState<Istantanea>(ALL_INIZIO)
  const sincronizzatore = useRef<Sincronizzatore | null>(null)
  // Le pile stanno in ref, così `modifica` le aggiorna senza aspettare React;
  // `setPile` serve solo a ridisegnare i tasti.
  const indietro = useRef<Passo[]>([])
  const avanti = useRef<Passo[]>([])
  const [pile, setPile] = useState({ indietro: 0, avanti: 0 })
  const aggiornaPile = useCallback(
    () => setPile({ indietro: indietro.current.length, avanti: avanti.current.length }),
    [],
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
    indietro.current = []
    avanti.current = []
    aggiornaPile()
  }, [listaId, aggiornaPile])

  const modifica = useCallback(
    (trasforma: (lista: Lista) => Lista) => {
      sincronizzatore.current?.modifica((lista) => {
        const dopo = trasforma(lista)
        const passo = passoTra(lista, dopo)
        if (passo) {
          indietro.current = [...indietro.current, passo].slice(-LUNGHEZZA_CRONOLOGIA)
          avanti.current = []
          aggiornaPile()
        }
        return dopo
      })
    },
    [aggiornaPile],
  )

  const genera = useCallback((portaAvanti: boolean) => {
    sincronizzatore.current?.genera(portaAvanti)
  }, [])

  const prossimo = useCallback(
    (verso: Verso) => (verso === 'annulla' ? indietro.current.at(-1) : avanti.current.at(-1)) ?? null,
    [],
  )

  const salta = useCallback(
    (verso: Verso) => {
      const da = verso === 'annulla' ? indietro : avanti
      const a = verso === 'annulla' ? avanti : indietro
      const passo = da.current.at(-1)
      if (!passo) return
      da.current = da.current.slice(0, -1)
      a.current = [...a.current, passo]
      aggiornaPile()
      sincronizzatore.current?.modifica((lista) => riporta(lista, passo, verso))
    },
    [aggiornaPile],
  )

  return {
    ...istantanea,
    modifica,
    genera,
    cronologia: {
      puoAnnullare: pile.indietro > 0,
      puoRipristinare: pile.avanti > 0,
      prossimo,
      salta,
    },
  }
}
