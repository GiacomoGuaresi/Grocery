import { useState } from 'react'
import type { Alternative } from '../domain/alternative'
import type { Voce as VoceLista } from '../domain/tipi'
import { Icona } from './Icona'
import { Voce } from './Voce'
import './GiaPresi.css'

interface Props {
  voci: VoceLista[]
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
 */
export function GiaPresi({
  voci,
  onAlterna,
  onElimina,
  onRinomina,
  onSostituisci,
  alternative,
}: Props) {
  const [aperta, setAperta] = useState(false)

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
        <span className="gia-presi__quanti">{voci.length}</span>
      </button>
      <ul className="gia-presi__voci" id="gia-presi-voci" hidden={!aperta}>
        {voci.map((voce) => (
          <Voce
            key={voce.id}
            voce={voce}
            alternative={alternative(voce)}
            onAlterna={onAlterna}
            onElimina={onElimina}
            onRinomina={onRinomina}
            onSostituisci={onSostituisci}
          />
        ))}
      </ul>
    </section>
  )
}
