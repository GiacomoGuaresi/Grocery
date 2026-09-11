// La lista corrente presa dallo storage e tenuta in sincronia con lui e con
// l'altro dispositivo: ogni modifica va prima nello stato React (l'interfaccia
// risponde subito) e poi sul database, dove si scrivono solo le voci toccate.
// Quando la lista cambia altrove si rilegge (Step 5 e 15 di doc/12-piano-sviluppo.md).

import { useCallback, useEffect, useRef, useState } from 'react'
import { nuovoCiclo } from '../domain/ciclo'
import { differenze, nessunaModifica, unisci } from '../domain/sincronia'
import type { Lista } from '../domain/tipi'
import { storage } from '../storage'

export type StatoLista =
  | { fase: 'caricamento' }
  | { fase: 'pronta'; lista: Lista }
  | { fase: 'errore' }

export interface ListaPersistita {
  stato: StatoLista
  /** Applica una trasformazione pura alla lista e salva le voci che ha toccato. */
  modifica(trasforma: (lista: Lista) => Lista): void
  /**
   * Genera il ciclo nuovo: archivia la lista corrente e la sostituisce, con o
   * senza le voci rimaste da prendere (Step 9).
   */
  genera(portaAvanti: boolean): void
}

/** Una generazione, altrove, arriva come una raffica di avvisi: si rilegge una volta sola. */
const PAUSA_RILETTURA = 250

/** La lista con cui parte un dispositivo che non ha ancora niente di salvato. */
function listaVuota(): Lista {
  const adesso = new Date().toISOString()
  return { id: `lista-${adesso}`, creataIl: adesso, stato: 'corrente', voci: [] }
}

/** Aggiunge o toglie una scrittura in volo alle voci indicate. */
function conta(inVolo: Map<string, number>, ids: string[], passo: 1 | -1): void {
  for (const id of ids) {
    const quante = (inVolo.get(id) ?? 0) + passo
    if (quante > 0) inVolo.set(id, quante)
    else inVolo.delete(id)
  }
}

export function useLista(): ListaPersistita {
  const [stato, setStato] = useState<StatoLista>({ fase: 'caricamento' })
  // Le scritture vengono messe in fila: arrivano al database nell'ordine in
  // cui sono state fatte, anche quando i tocchi si susseguono in fretta.
  const coda = useRef<Promise<unknown>>(Promise.resolve())
  // L'ultima lista mostrata, leggibile da dentro la coda: la generazione parte
  // da quella, non dal valore che aveva lo stato quando è stata chiesta.
  const ultima = useRef<Lista | null>(null)
  // Le voci cambiate qui e non ancora scritte, con quante scritture le
  // aspettano: finché ce n'è una, rileggendo vale la versione di qui.
  const inVolo = useRef(new Map<string, number>())

  const tieni = useCallback((lista: Lista) => {
    ultima.current = lista
    setStato({ fase: 'pronta', lista })
  }, [])

  /**
   * Rilegge la lista dal database. Passa dalla coda anche lei: parte dopo le
   * scritture già avviate, e le ritrova lì invece di cancellarle dallo schermo.
   */
  const ricarica = useCallback(() => {
    coda.current = coda.current
      .then(async () => {
        const letta = await (await storage()).leggiListaCorrente()
        if (letta && ultima.current) {
          tieni(unisci(letta, ultima.current, new Set(inVolo.current.keys())))
        }
      })
      .catch((errore) => console.error('Rilettura fallita', errore))
  }, [tieni])

  useEffect(() => {
    let vivo = true
    let smetti: (() => void) | undefined
    let attesa: ReturnType<typeof setTimeout> | undefined
    void (async () => {
      try {
        const archivio = await storage()
        // Alla prima apertura non c'è ancora niente: la lista nasce vuota e si
        // riempie generandola o aggiungendo a mano.
        const salvata = await archivio.leggiListaCorrente()
        const lista = salvata ?? listaVuota()
        if (!salvata) await archivio.salvaLista(lista)
        if (!vivo) return
        tieni(lista)
        smetti = archivio.quandoCambia(() => {
          clearTimeout(attesa)
          attesa = setTimeout(ricarica, PAUSA_RILETTURA)
        })
      } catch (errore) {
        console.error('Storage non disponibile', errore)
        if (vivo) setStato({ fase: 'errore' })
      }
    })()
    return () => {
      vivo = false
      smetti?.()
      clearTimeout(attesa)
    }
  }, [tieni, ricarica])

  const modifica = useCallback(
    (trasforma: (lista: Lista) => Lista) => {
      const prima = ultima.current
      if (!prima) return
      const dopo = trasforma(prima)
      const modifiche = differenze(prima, dopo)
      if (nessunaModifica(modifiche)) return

      tieni(dopo)
      const toccate = [...modifiche.voci.map((voce) => voce.id), ...modifiche.eliminate]
      conta(inVolo.current, toccate, 1)
      coda.current = coda.current
        .then(() => storage())
        .then((archivio) => archivio.salvaVoci(prima.id, modifiche))
        .catch((errore) => console.error('Salvataggio fallito', errore))
        .finally(() => conta(inVolo.current, toccate, -1))
    },
    [tieni],
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
