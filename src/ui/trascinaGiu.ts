import { useRef } from 'react'
import type { MouseEvent, PointerEvent, RefObject } from 'react'

/** Quanto trascinare in giù, in px, perché il popup si chiuda. */
const SOGLIA = 80
/** Oppure quanto veloce, in px/ms: un colpetto deciso basta. */
const VELOCITA = 0.5
/** Sotto questo movimento è un tocco, non un trascinamento. */
const AVVIO = 8

/**
 * Trascinare in giù un popup che sale dal fondo (AzioniVoce, ConsigliVoce)
 * per chiuderlo. I gestori vanno sulla parte da cui si può afferrare (con
 * `touch-action: none` nel CSS): il popup segue il dito e, lasciato abbastanza
 * in basso o con un colpetto, si chiude con la sua animazione, che parte da
 * dove è arrivato. Altrimenti torna su.
 */
export function useTrascinaGiu(finestra: RefObject<HTMLElement | null>, onChiudi: () => void) {
  const gesto = useRef<{ id: number; y: number; tempo: number; dy: number } | null>(null)
  const trascinato = useRef(false)

  const sposta = (dy: number, rientra = false) => {
    const elemento = finestra.current
    if (!elemento) return
    elemento.style.transition = rientra ? 'transform 180ms ease-out' : ''
    elemento.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  }

  return {
    onPointerDown: (evento: PointerEvent<HTMLElement>) => {
      trascinato.current = false
      if (evento.pointerType === 'mouse' && evento.button !== 0) return
      if ((evento.target as Element).closest('input, select, textarea')) return
      gesto.current = { id: evento.pointerId, y: evento.clientY, tempo: evento.timeStamp, dy: 0 }
    },
    onPointerMove: (evento: PointerEvent<HTMLElement>) => {
      const corrente = gesto.current
      if (!corrente || evento.pointerId !== corrente.id) return
      corrente.dy = evento.clientY - corrente.y
      if (!trascinato.current) {
        if (corrente.dy < AVVIO) return
        trascinato.current = true
        evento.currentTarget.setPointerCapture?.(evento.pointerId)
      }
      sposta(corrente.dy)
    },
    onPointerUp: (evento: PointerEvent<HTMLElement>) => {
      const corrente = gesto.current
      if (!corrente || evento.pointerId !== corrente.id) return
      gesto.current = null
      if (!trascinato.current) return
      const velocita = corrente.dy / Math.max(evento.timeStamp - corrente.tempo, 1)
      if (corrente.dy > SOGLIA || velocita > VELOCITA) onChiudi()
      else sposta(0, true)
    },
    onPointerCancel: () => {
      if (!gesto.current) return
      gesto.current = null
      sposta(0, true)
    },
    // Il trascinamento finito sopra un bottone non vale anche come tocco.
    onClickCapture: (evento: MouseEvent) => {
      if (!trascinato.current) return
      trascinato.current = false
      evento.preventDefault()
      evento.stopPropagation()
    },
  }
}
