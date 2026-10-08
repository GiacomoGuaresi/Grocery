import type { GruppoReparto as Gruppo } from '../domain/lista'
import type { IdReparto } from '../domain/tipi'
import { Voce, type Arrivo } from './Voce'
import './GruppoReparto.css'

interface Props {
  gruppo: Gruppo
  /** Le ultime voci arrivate nella lista, da far entrare con un'animazione. */
  arrivi: Arrivo[]
  /** Le voci che se ne vanno per un annulla o un ripristina. */
  escono: ReadonlySet<string>
  onAlterna: (id: string) => void
  onConta: (id: string, presi: number) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onCambiaReparto: (id: string, reparto: IdReparto) => void
}

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({
  gruppo,
  arrivi,
  escono,
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
            arrivi={arrivi}
            esce={escono.has(voce.id)}
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
