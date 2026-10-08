import { useCallback, useRef, useState } from 'react'
import { destinazione, type Verso } from '../domain/cronologia'
import type { Voce } from '../domain/tipi'
import { movimentoRidotto } from './animazioni'
import type { ListaPersistita } from './useLista'
import type { Arrivo } from './Voce'

/** Quanto dura l'uscita di una riga: --durata-voce in tema.css. */
const DURATA_USCITA = 240

const NESSUNA = new Set<string>()

/** Dove sta una voce nella lista: cambia reparto, ricetta o parte, e la riga si sposta. */
function posto(voce: Voce): string {
  return `${voce.comprata}|${voce.ricetta?.id ?? voce.reparto}`
}

/**
 * Le animazioni della lista: le voci che arrivano (aggiunte, spostate) e, per
 * annulla e ripristina, quelle che se ne vanno. Annullando o ripristinando le
 * righe che spariscono o cambiano posto prima escono, poi la modifica arriva
 * alla lista e le voci toccate lampeggiano dove sono finite.
 */
export function useSalti(lista: ListaPersistita) {
  const [arrivi, setArrivi] = useState<Arrivo[]>([])
  const [escono, setEscono] = useState<ReadonlySet<string>>(NESSUNA)
  const inCorso = useRef(false)
  const { stato, cronologia } = lista

  const segnaArrivo = useCallback((arrivo: Arrivo) => setArrivi([arrivo]), [])

  const salta = (verso: Verso) => {
    const passo = cronologia.prossimo(verso)
    if (inCorso.current || !passo || stato.fase !== 'pronta') return
    const attuali = new Map(stato.lista.voci.map((voce) => [voce.id, voce]))

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
      cronologia.salta(verso)
      setArrivi(nuovi)
      setEscono(NESSUNA)
      inCorso.current = false
    }
    if (uscite.size === 0 || movimentoRidotto()) return applica()
    inCorso.current = true
    setEscono(uscite)
    window.setTimeout(applica, DURATA_USCITA)
  }

  return {
    arrivi,
    escono,
    segnaArrivo,
    annulla: () => salta('annulla'),
    ripristina: () => salta('ripristina'),
    puoAnnullare: cronologia.puoAnnullare,
    puoRipristinare: cronologia.puoRipristinare,
  }
}

export type Salti = ReturnType<typeof useSalti>
