import type { GruppoReparto as Gruppo } from '../domain/lista'
import { Voce } from './Voce'
import './GruppoReparto.css'

interface Props {
  gruppo: Gruppo
  onAlterna: (id: string) => void
  onAlternaElemento: (id: string, nome: string) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
}

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({ gruppo, onAlterna, onAlternaElemento, onElimina, onRinomina }: Props) {
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
            onAlterna={onAlterna}
            onAlternaElemento={onAlternaElemento}
            onElimina={onElimina}
            onRinomina={onRinomina}
          />
        ))}
      </ul>
    </section>
  )
}
