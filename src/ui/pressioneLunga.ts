import { useEffect, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'

/** Quanto tenere premuto, e quanto si può scivolare col dito prima che diventi uno scroll. */
const DURATA = 500
const TOLLERANZA = 10

/**
 * Tenere premuto un elemento chiama `onPressioneLunga`. Restituisce i gestori
 * da mettere sull'elemento. Il tocco che finisce dopo la pressione lunga non
 * vale anche come click; il menu contestuale del browser (tasto destro, o la
 * pressione lunga su Android) fa la stessa cosa invece di aprirsi.
 */
export function usePressioneLunga(onPressioneLunga: () => void) {
  const timer = useRef<number | null>(null)
  const inizio = useRef<{ x: number; y: number } | null>(null)
  const scattata = useRef(false)
  const ultimo = useRef(onPressioneLunga)

  useEffect(() => {
    ultimo.current = onPressioneLunga
  })

  const annulla = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    inizio.current = null
  }

  useEffect(() => annulla, [])

  const scatta = () => {
    annulla()
    scattata.current = true
    ultimo.current()
  }

  return {
    onPointerDown: (evento: PointerEvent) => {
      if (evento.pointerType === 'mouse' && evento.button !== 0) return
      annulla()
      scattata.current = false
      inizio.current = { x: evento.clientX, y: evento.clientY }
      timer.current = window.setTimeout(scatta, DURATA)
    },
    onPointerMove: (evento: PointerEvent) => {
      if (!inizio.current) return
      const dx = evento.clientX - inizio.current.x
      const dy = evento.clientY - inizio.current.y
      if (Math.hypot(dx, dy) > TOLLERANZA) annulla()
    },
    onPointerUp: annulla,
    onPointerCancel: annulla,
    onPointerLeave: annulla,
    onContextMenu: (evento: MouseEvent) => {
      evento.preventDefault()
      if (!scattata.current) scatta()
    },
    onClickCapture: (evento: MouseEvent) => {
      if (!scattata.current) return
      scattata.current = false
      evento.preventDefault()
      evento.stopPropagation()
    },
  }
}
