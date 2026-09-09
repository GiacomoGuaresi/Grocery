import type { GruppoReparto as Gruppo } from '../domain/lista'
import type { Voce as VoceLista } from '../domain/tipi'
import { Voce } from './Voce'
import './GruppoReparto.css'

interface Props {
  gruppo: Gruppo
  onAlterna: (id: string) => void
  onAlternaElemento: (id: string, nome: string) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onSostituisci: (id: string, nome: string) => void
  onSostituisciElemento: (id: string, nome: string, nuovo: string) => void
  /** Le alternative per la voce intera e per un suo tipo (F6). */
  alternative: (voce: VoceLista) => string[]
  alternativeElemento: (voce: VoceLista, nome: string) => string[]
}

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({
  gruppo,
  onAlterna,
  onAlternaElemento,
  onElimina,
  onRinomina,
  onSostituisci,
  onSostituisciElemento,
  alternative,
  alternativeElemento,
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
            alternativeDi={(nome) => alternativeElemento(voce, nome)}
            onAlterna={onAlterna}
            onAlternaElemento={onAlternaElemento}
            onElimina={onElimina}
            onRinomina={onRinomina}
            onSostituisci={onSostituisci}
            onSostituisciElemento={onSostituisciElemento}
          />
        ))}
      </ul>
    </section>
  )
}
