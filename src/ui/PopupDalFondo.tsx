import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useUscita } from './animazioni'
import { useTrascinaGiu } from './trascinaGiu'
import './AzioniVoce.css'

/** Quello che il contenuto del popup può fare: chiuderlo, o uscire con un motivo. */
export interface ControlliPopup<T extends string> {
  chiudi: () => void
  esci: (motivo: T | 'chiudi') => void
  /** I gestori del trascinamento in giù, da mettere dove si può afferrare. */
  trascina: ReturnType<typeof useTrascinaGiu>
}

interface Props<T extends string> {
  /** L'id del titolo, per `aria-labelledby`. */
  etichetta: string
  /** Il popup è sceso ed è chiuso: arriva il motivo dato a `esci`. */
  onUscito?: (motivo: T | 'chiudi') => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
  children: (controlli: ControlliPopup<T>) => ReactNode
}

/**
 * Il popup che sale dal fondo dello schermo (AzioniVoce, ConsigliVoce,
 * AzioniRicetta). È un `<dialog>` modale: il browser si occupa del fuoco, di
 * Esc e del velo sotto. Ogni chiusura passa da `close()`, che avvisa con
 * `onChiudi`.
 *
 * Prima di chiudersi ridiscende verso il fondo, in qualunque modo lo si chiuda
 * (Chiudi, tocco fuori, Esc, trascinandolo in giù: trascinaGiu.ts). Solo
 * dopo arriva `onUscito`, così chi aspetta (l'eliminazione di una voce) parte
 * a popup sceso.
 */
export function PopupDalFondo<T extends string = 'chiudi'>({
  etichetta,
  onUscito,
  onChiudi,
  children,
}: Props<T>) {
  const finestra = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = finestra.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const { uscita, esci, fine } = useUscita<T | 'chiudi'>((motivo) => {
    finestra.current?.close()
    onUscito?.(motivo)
  })
  const chiudi = () => esci('chiudi')
  const trascina = useTrascinaGiu(finestra, chiudi)

  return (
    <dialog
      ref={finestra}
      className={uscita ? 'azioni-voce azioni-voce--chiude' : 'azioni-voce'}
      aria-labelledby={etichetta}
      onClose={onChiudi}
      // Anche Esc passa dall'animazione di chiusura.
      onCancel={(evento) => {
        evento.preventDefault()
        chiudi()
      }}
      onAnimationEnd={(evento) => {
        if (evento.target === evento.currentTarget && evento.animationName === 'azioni-voce-scende')
          fine()
      }}
      // Il tocco sul velo arriva al dialog stesso: chiude, come fuori dal menu.
      onClick={(evento) => evento.target === evento.currentTarget && chiudi()}
    >
      {children({ chiudi, esci, trascina })}
    </dialog>
  )
}
