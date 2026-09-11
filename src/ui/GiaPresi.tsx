import { useEffect, useRef, useState } from 'react'
import type { Alternative } from '../domain/alternative'
import type { Voce as VoceLista } from '../domain/tipi'
import { movimentoRidotto } from './animazioni'
import { Icona } from './Icona'
import { Voce, type Arrivo } from './Voce'
import './GiaPresi.css'

interface Props {
  voci: VoceLista[]
  /** L'ultima voce arrivata nella lista, da far entrare con un'animazione. */
  arrivo: Arrivo | null
  onAlterna: (id: string) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onSostituisci: (id: string, nome: string) => void
  /** Le alternative per la voce (F6). */
  alternative: (voce: VoceLista) => Alternative
}

/**
 * Sezione ripiegata in fondo alla lista: quello che è già nel carrello.
 * Serve a rivedere e a de-spuntare quando si tocca per sbaglio.
 * Non è raggruppata per reparto: quel percorso ormai è alle spalle.
 *
 * Si apre e si ripiega a fisarmonica; il contatore fa un saltello quando
 * cambia, così si vede che la spunta è andata a finire qui.
 */
export function GiaPresi({
  voci,
  arrivo,
  onAlterna,
  onElimina,
  onRinomina,
  onSostituisci,
  alternative,
}: Props) {
  const [aperta, setAperta] = useState(false)
  const contatore = useRef<HTMLSpanElement>(null)
  const quantiPrima = useRef(voci.length)

  useEffect(() => {
    if (quantiPrima.current === voci.length) return
    quantiPrima.current = voci.length
    if (movimentoRidotto()) return
    contatore.current?.animate?.(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'ease-out' },
    )
  }, [voci.length])

  if (voci.length === 0) return null

  return (
    <section className="gia-presi">
      <button
        className="gia-presi__intestazione"
        type="button"
        aria-expanded={aperta}
        aria-controls="gia-presi-voci"
        onClick={() => setAperta((era) => !era)}
      >
        <Icona nome="avanti" className="gia-presi__freccia" />
        <span className="gia-presi__titolo">Già presi</span>
        <span className="gia-presi__quanti" ref={contatore}>
          {voci.length}
        </span>
      </button>
      <div
        className={aperta ? 'gia-presi__corpo gia-presi__corpo--aperto' : 'gia-presi__corpo'}
        id="gia-presi-voci"
      >
        <ul className="gia-presi__voci">
          {voci.map((voce) => (
            <Voce
              key={voce.id}
              voce={voce}
              alternative={alternative(voce)}
              arrivo={arrivo}
              onAlterna={onAlterna}
              onElimina={onElimina}
              onRinomina={onRinomina}
              onSostituisci={onSostituisci}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
