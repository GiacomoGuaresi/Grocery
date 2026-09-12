import { useEffect, useRef } from 'react'
import { movimentoRidotto } from './animazioni'
import { Icona } from './Icona'
import './Contatore.css'

interface Props {
  /** Il nome della voce, per le etichette dei tasti. */
  nome: string
  presi: number
  quantita: number
  /** Il numero nuovo dei presi; i limiti li tiene il dominio (contatore.ts). */
  onCambia: (presi: number) => void
  /** In grande, largo quanto chi lo contiene: quello del popup dei consigli. */
  grande?: boolean
}

/**
 * Il contatore `[−] presi/totale [+]` delle voci generate (F15): prende il
 * posto della spunta. I tasti vanno di uno; il numero si legge soltanto.
 *
 * Quando il numero cambia fa un piccolo scatto, verso l'alto se sale e verso
 * il basso se scende.
 */
export function Contatore({ nome, presi, quantita, onCambia, grande = false }: Props) {
  const numero = useRef<HTMLSpanElement>(null)
  const prima = useRef(presi)

  useEffect(() => {
    if (prima.current === presi) return
    const sale = presi > prima.current
    prima.current = presi
    if (movimentoRidotto()) return
    numero.current?.animate?.(
      [
        { transform: `translateY(${sale ? '40%' : '-40%'})`, opacity: 0.2 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 200, easing: 'ease-out' },
    )
  }, [presi])

  return (
    <div className={grande ? 'contatore contatore--grande' : 'contatore'} role="group" aria-label={`Pasti di ${nome}`}>
      <button
        className="contatore__tasto"
        type="button"
        aria-label={`Un pasto in meno di ${nome}`}
        disabled={presi <= 0}
        onClick={() => onCambia(presi - 1)}
      >
        <Icona nome="meno" />
      </button>
      <span className="contatore__valore" aria-label={`Presi ${presi} pasti su ${quantita} di ${nome}`}>
        <span className="contatore__presi" ref={numero}>
          {presi}
        </span>
        <span className="contatore__totale">/{quantita}</span>
      </span>
      <button
        className="contatore__tasto"
        type="button"
        aria-label={`Un pasto in più di ${nome}`}
        disabled={presi >= quantita}
        onClick={() => onCambia(presi + 1)}
      >
        <Icona nome="piu" />
      </button>
    </div>
  )
}
