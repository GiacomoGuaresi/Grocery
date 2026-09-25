import type { GruppoReparto as Gruppo } from '../domain/lista'
import type { IdReparto } from '../domain/tipi'
import { Voce, type Arrivo } from './Voce'
import './GruppoReparto.css'

interface Props {
  gruppo: Gruppo
  /** L'ultima voce arrivata nella lista, da far entrare con un'animazione. */
  arrivo: Arrivo | null
  onAlterna: (id: string) => void
  onConta: (id: string, presi: number) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onCambiaReparto: (id: string, reparto: IdReparto) => void
}

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({
  gruppo,
  arrivo,
  onAlterna,
  onConta,
  onElimina,
  onRinomina,
  onCambiaReparto,
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
            arrivo={arrivo}
            onAlterna={onAlterna}
            onConta={onConta}
            onElimina={onElimina}
            onRinomina={onRinomina}
            onCambiaReparto={onCambiaReparto}
          />
        ))}
      </ul>
    </section>
  )
}
