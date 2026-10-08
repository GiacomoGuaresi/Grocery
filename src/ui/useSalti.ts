import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { destinazione, type Passo, type Verso } from '../domain/cronologia'
import type { Voce } from '../domain/tipi'
import { movimentoRidotto } from './animazioni'
import type { ListaPersistita } from './useLista'
import type { Arrivo } from './Voce'

/** Quanto dura l'uscita di una riga: --durata-voce in tema.css. */
const DURATA_USCITA = 240
/** Dopo quanto un arrivo è vecchio: l'animazione più lunga (apertura e lampo) è finita. */
const DURATA_ARRIVO = 1500

const NESSUNA: ReadonlySet<string> = new Set()

/**
 * Le righe che stanno uscendo per un'azione loro (spunta, contatore, elimina):
 * la modifica alla lista arriva solo alla fine dell'animazione. Voce avvisa
 * con `inizia`, che restituisce come dire che ha finito; intanto annulla e
 * ripristina aspettano, così non scavalcano una modifica che sta per arrivare.
 */
export interface RegistroUscite {
  inizia(): () => void
}

export const RegistroUscite = createContext<RegistroUscite>({ inizia: () => () => {} })

/** Dove sta una voce nella lista: cambia reparto, ricetta o parte, e la riga si sposta. */
function posto(voce: Voce): string {
  return `${voce.comprata}|${voce.ricetta?.id ?? voce.reparto}`
}

/**
 * Le animazioni della lista: le voci che arrivano (aggiunte, spostate) e, per
 * annulla e ripristina, quelle che se ne vanno. Annullando o ripristinando le
 * righe che spariscono o cambiano posto prima escono, poi la modifica arriva
 * alla lista e le voci toccate lampeggiano dove sono finite.
 *
 * I tocchi su annulla e ripristina vanno in coda e si fanno uno alla volta,
 * ognuno dopo l'animazione di quello prima e dopo le righe che stavano già
 * uscendo: toccati in fretta, non se ne perde nessuno e non si mescolano.
 */
export function useSalti(lista: ListaPersistita) {
  const [arrivi, setArrivi] = useState<Arrivo[]>([])
  const [escono, setEscono] = useState<ReadonlySet<string>>(NESSUNA)
  const { cronologia, leggiLista } = lista

  const coda = useRef<Verso[]>([])
  // Il salto che sta facendo uscire le sue righe, e come finirlo subito.
  const inCorso = useRef<{ timer: number; applica: () => void } | null>(null)
  const uscitePendenti = useRef(0)
  const timerArrivi = useRef<number | undefined>(undefined)

  // Gli arrivi si dimenticano a animazione finita: una riga che si ridisegna
  // da capo dopo (si torna alla lista da un'altra schermata) non li rifà.
  const mostraArrivi = useCallback((nuovi: Arrivo[]) => {
    window.clearTimeout(timerArrivi.current)
    setArrivi(nuovi)
    timerArrivi.current = window.setTimeout(() => setArrivi([]), DURATA_ARRIVO)
  }, [])

  const segnaArrivo = useCallback((arrivo: Arrivo) => mostraArrivi([arrivo]), [mostraArrivi])

  // In una ref: i timer e le righe che finiscono di uscire chiamano sempre l'ultima.
  const prossimo = useRef<() => void>(() => {})
  prossimo.current = () => {
    if (inCorso.current || uscitePendenti.current > 0) return
    const verso = coda.current.shift()
    if (!verso) return
    const passo = cronologia.prossimo(verso)
    const attuale = leggiLista()
    if (!passo || !attuale) return prossimo.current()
    avvia(verso, passo, attuale.voci)
  }

  const avvia = (verso: Verso, passo: Passo, voci: Voce[]) => {
    const attuali = new Map(voci.map((voce) => [voce.id, voce]))
    const uscite = new Set<string>()
    const nuovi: Arrivo[] = []
    for (const cambio of passo.cambi) {
      const attuale = attuali.get(cambio.id)
      const voce = destinazione(cambio, verso)
      const sposta = !attuale || !voce || posto(attuale) !== posto(voce)
      if (attuale && sposta) uscite.add(cambio.id)
      if (voce) nuovi.push({ id: voce.id, tipo: sposta ? 'aggiunta' : 'ripresa', comprata: voce.comprata })
    }

    const applica = () => {
      if (inCorso.current) window.clearTimeout(inCorso.current.timer)
      inCorso.current = null
      const mappa = cronologia.salta(verso, passo)
      setEscono(NESSUNA)
      // Le voci tornate in lista hanno un id nuovo (cronologia.ts).
      if (mappa) mostraArrivi(nuovi.map((arrivo) => ({ ...arrivo, id: mappa.get(arrivo.id) ?? arrivo.id })))
      prossimo.current()
    }

    if (uscite.size === 0 || movimentoRidotto()) return applica()
    setEscono(uscite)
    inCorso.current = { timer: window.setTimeout(applica, DURATA_USCITA), applica }
  }

  const chiedi = (verso: Verso) => {
    coda.current.push(verso)
    prossimo.current()
  }

  const registro = useRef<RegistroUscite>({
    inizia: () => {
      uscitePendenti.current += 1
      let finita = false
      return () => {
        if (finita) return
        finita = true
        uscitePendenti.current -= 1
        prossimo.current()
      }
    },
  }).current

  // Se l'app si chiude a metà salto, il salto si completa lo stesso.
  useEffect(
    () => () => {
      inCorso.current?.applica()
      window.clearTimeout(timerArrivi.current)
    },
    [],
  )

  // In coda ci possono essere più tocchi che passi: quelli di troppo non fanno niente.
  return {
    arrivi,
    escono,
    segnaArrivo,
    registro,
    annulla: () => chiedi('annulla'),
    ripristina: () => chiedi('ripristina'),
    puoAnnullare: cronologia.puoAnnullare,
    puoRipristinare: cronologia.puoRipristinare,
  }
}

export type Salti = ReturnType<typeof useSalti>
