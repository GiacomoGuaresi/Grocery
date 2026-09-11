import { useCallback, useEffect, useRef, useState } from 'react'

/** Chi ha chiesto meno movimento nelle impostazioni del telefono. */
export function movimentoRidotto(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Un'uscita animata (doc/08-ui-ux.md, "Animazioni"): `esci` segna il motivo,
 * che chi usa l'hook trasforma in una classe CSS; `fine`, da chiamare quando
 * l'animazione finisce, esegue `concludi` una volta sola. Se l'animazione non
 * finisce mai (browser vecchio, scheda in secondo piano) `concludi` parte lo
 * stesso dopo `riserva` ms: la modifica alla lista non resta appesa a
 * un'animazione. Mentre si esce, altri `esci` vengono ignorati.
 */
export function useUscita<T extends string>(concludi: (motivo: T) => void, riserva = 1000) {
  const [uscita, setUscita] = useState<T | null>(null)
  const motivo = useRef<T | null>(null)
  const concluso = useRef(false)
  const ultimoConcludi = useRef(concludi)

  useEffect(() => {
    ultimoConcludi.current = concludi
  })

  const fine = useCallback(() => {
    if (motivo.current === null || concluso.current) return
    concluso.current = true
    ultimoConcludi.current(motivo.current)
  }, [])

  useEffect(() => {
    if (uscita === null) return
    const timer = window.setTimeout(fine, riserva)
    return () => window.clearTimeout(timer)
  }, [uscita, fine, riserva])

  const esci = useCallback((nuovo: T) => {
    if (motivo.current !== null) return
    motivo.current = nuovo
    setUscita(nuovo)
  }, [])

  return { uscita, esci, fine }
}
