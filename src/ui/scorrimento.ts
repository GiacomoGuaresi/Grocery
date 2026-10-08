import { useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'

/** Quanto scorrere, in proporzione alla riga, perché l'azione parta. */
const SOGLIA = 0.35
/** Quanto muovere il dito prima di decidere se si scorre di lato o in verticale. */
const AVVIO = 10
/** Dal bordo dello schermo parte il "indietro" di Android: lì non si scorre. */
const BORDO = 24

interface Opzioni {
  attivo: boolean
  onDestra: () => void
  onSinistra: () => void
}

/**
 * Scorrere una riga col dito: verso destra o verso sinistra, oltre la soglia,
 * parte l'azione di quel lato; sotto la soglia la riga torna al suo posto. La
 * direzione si decide al primo movimento: se è verticale la lista scorre come
 * sempre (la riga ha `touch-action: pan-y`). Solo col dito: col mouse ci sono
 * i bottoni.
 *
 * `spostamento` è di quanto è spostata la riga; `oltre` dice se, lasciando ora,
 * l'azione partirebbe.
 */
export function useScorrimento({ attivo, onDestra, onSinistra }: Opzioni) {
  const [spostamento, setSpostamento] = useState(0)
  const [rientra, setRientra] = useState(false)
  const [larghezza, setLarghezza] = useState(0)
  const gesto = useRef<{ id: number; x: number; y: number; laterale: boolean | null } | null>(null)
  const trascinato = useRef(false)

  const torna = () => {
    setRientra(true)
    setSpostamento(0)
  }

  const oltre = larghezza > 0 && Math.abs(spostamento) >= larghezza * SOGLIA

  const gestori = {
    onPointerDown: (evento: PointerEvent<HTMLElement>) => {
      trascinato.current = false
      if (!attivo || evento.pointerType === 'mouse') return
      if ((evento.target as Element).closest('dialog, input')) return
      if (evento.clientX < BORDO || evento.clientX > window.innerWidth - BORDO) return
      gesto.current = { id: evento.pointerId, x: evento.clientX, y: evento.clientY, laterale: null }
      setLarghezza(evento.currentTarget.getBoundingClientRect().width)
    },
    onPointerMove: (evento: PointerEvent<HTMLElement>) => {
      const corrente = gesto.current
      if (!corrente || evento.pointerId !== corrente.id) return
      const dx = evento.clientX - corrente.x
      const dy = evento.clientY - corrente.y
      if (corrente.laterale === null) {
        if (Math.hypot(dx, dy) < AVVIO) return
        corrente.laterale = Math.abs(dx) > Math.abs(dy)
        if (!corrente.laterale) return
        evento.currentTarget.setPointerCapture?.(evento.pointerId)
        trascinato.current = true
        setRientra(false)
      }
      if (corrente.laterale) setSpostamento(dx)
    },
    onPointerUp: (evento: PointerEvent<HTMLElement>) => {
      const corrente = gesto.current
      if (!corrente || evento.pointerId !== corrente.id) return
      gesto.current = null
      if (!corrente.laterale) return
      // Il click che segue il rilascio arriva prima di questo timer, e viene scartato.
      window.setTimeout(() => (trascinato.current = false), 0)
      if (!oltre) return torna()
      // La riga resta spostata mentre se ne va; se invece resta, torna al suo posto.
      if (spostamento > 0) onDestra()
      else onSinistra()
      window.setTimeout(torna, 1000)
    },
    onPointerCancel: () => {
      if (!gesto.current) return
      gesto.current = null
      torna()
    },
    // Lo scorrimento finito sopra un bottone non vale anche come tocco.
    onClickCapture: (evento: MouseEvent) => {
      if (!trascinato.current) return
      trascinato.current = false
      evento.preventDefault()
      evento.stopPropagation()
    },
  }

  return { spostamento, oltre, rientra, gestori }
}
