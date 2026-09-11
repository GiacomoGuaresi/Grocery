import type { Alternative } from '../domain/alternative'
import type { GruppoReparto as Gruppo } from '../domain/lista'
import type { Voce as VoceLista } from '../domain/tipi'
import { Voce, type Arrivo } from './Voce'
import './GruppoReparto.css'

interface Props {
  gruppo: Gruppo
  /** L'ultima voce arrivata nella lista, da far entrare con un'animazione. */
  arrivo: Arrivo | null
  onAlterna: (id: string) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onSostituisci: (id: string, nome: string) => void
  /** Le alternative per la voce (F6). */
  alternative: (voce: VoceLista) => Alternative
}

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({
  gruppo,
  arrivo,
  onAlterna,
  onElimina,
  onRinomina,
  onSostituisci,
  alternative,
}: Props) {
  return (
    <section className="reparto" aria-labelledby={`reparto-${gruppo.id}`}>
      <h2 className="reparto__titolo" id={`reparto-${gruppo.id}`}>
        {gruppo.nome}
      </h2>
      <ul className="reparto__voci">
        {gruppo.voci.map((voce) => (
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
    </section>
  )
}
