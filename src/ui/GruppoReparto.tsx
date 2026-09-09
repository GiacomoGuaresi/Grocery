import type { GruppoReparto as Gruppo } from '../domain/lista'
import { Voce } from './Voce'
import './GruppoReparto.css'

/** Un reparto della lista, col suo titolo e le sue voci. */
export function GruppoReparto({ gruppo }: { gruppo: Gruppo }) {
  return (
    <section className="reparto" aria-labelledby={`reparto-${gruppo.id}`}>
      <h2 className="reparto__titolo" id={`reparto-${gruppo.id}`}>
        {gruppo.nome}
      </h2>
      <ul className="reparto__voci">
        {gruppo.voci.map((voce) => (
          <Voce key={voce.id} voce={voce} />
        ))}
      </ul>
    </section>
  )
}
