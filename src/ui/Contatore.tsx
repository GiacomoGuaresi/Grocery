import { useEffect, useRef, useState } from 'react'
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
}

/**
 * Il contatore `[−] presi/totale [+]` delle voci generate (F15): prende il
 * posto della spunta. I tasti vanno di uno; toccando il numero lo si scrive,
 * con la tastiera numerica. Invio o tocco fuori salvano, Esc o un campo vuoto
 * lasciano tutto com'era.
 *
 * Quando il numero cambia fa un piccolo scatto, verso l'alto se sale e verso
 * il basso se scende.
 */
export function Contatore({ nome, presi, quantita, onCambia }: Props) {
  // Non nullo solo mentre si sta scrivendo il numero.
  const [scritto, setScritto] = useState<string | null>(null)
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

  const salva = () => {
    const valore = Number.parseInt(scritto ?? '', 10)
    if (!Number.isNaN(valore) && valore !== presi) onCambia(valore)
    setScritto(null)
  }

  const totale = (
    <>
      <span className="contatore__totale">/{quantita}</span>
      <span className="contatore__unita">pasti</span>
    </>
  )

  return (
    <div className="contatore" role="group" aria-label={`Pasti di ${nome}`}>
      <button
        className="contatore__tasto"
        type="button"
        aria-label={`Un pasto in meno di ${nome}`}
        disabled={presi <= 0}
        onClick={() => onCambia(presi - 1)}
      >
        <Icona nome="meno" />
      </button>
      {scritto !== null ? (
        <span className="contatore__valore">
          <input
            className="contatore__campo"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={scritto}
            onChange={(evento) => setScritto(evento.target.value.replace(/\D/g, '').slice(0, 3))}
            onFocus={(evento) => evento.currentTarget.select()}
            onBlur={salva}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') evento.currentTarget.blur()
              if (evento.key === 'Escape') setScritto(null)
            }}
            aria-label={`Pasti presi di ${nome}, su ${quantita}`}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
          />
          {totale}
        </span>
      ) : (
        <button
          className="contatore__valore"
          type="button"
          aria-label={`Presi ${presi} pasti su ${quantita} di ${nome}: tocca per scrivere il numero`}
          onClick={() => setScritto(String(presi))}
        >
          <span className="contatore__presi" ref={numero}>
            {presi}
          </span>
          {totale}
        </button>
      )}
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
