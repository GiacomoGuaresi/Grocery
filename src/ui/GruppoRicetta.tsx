import type { GruppoRicetta as Gruppo } from '../domain/lista'
import type { IdReparto } from '../domain/tipi'
import { Icona } from './Icona'
import { Voce, type Arrivo } from './Voce'
import './GruppoReparto.css'
import './GruppoRicetta.css'

interface Props {
  gruppo: Gruppo
  /** L'ultima voce arrivata nella lista, da far entrare con un'animazione. */
  arrivo: Arrivo | null
  /** Tocco sul titolo: la scheda della ricetta. */
  onApriRicetta: (id: string) => void
  onAlterna: (id: string) => void
  onConta: (id: string, presi: number) => void
  onElimina: (id: string) => void
  onRinomina: (id: string, nome: string) => void
  onCambiaReparto: (id: string, reparto: IdReparto) => void
}

/**
 * Gli ingredienti di una ricetta (doc/14-piano-ricette.md), dopo i reparti:
 * come un reparto, ma col nome della ricetta, che apre la sua scheda. Un nome
 * lungo si tronca coi puntini.
 */
export function GruppoRicetta({ gruppo, arrivo, onApriRicetta, ...azioni }: Props) {
  const id = `ricetta-${gruppo.ricetta.id}`
  return (
    <section className="reparto reparto--ricetta" aria-labelledby={id}>
      <h2 className="reparto__titolo" id={id}>
        <button
          className="reparto__ricetta"
          type="button"
          title={gruppo.ricetta.nome}
          onClick={() => onApriRicetta(gruppo.ricetta.id)}
        >
          <Icona nome="libro" className="reparto__ricetta-icona" />
          <span className="reparto__ricetta-nome">{gruppo.ricetta.nome}</span>
        </button>
      </h2>
      <ul className="reparto__voci">
        {gruppo.voci.map((voce) => (
          <Voce key={voce.id} voce={voce} arrivo={arrivo} {...azioni} />
        ))}
      </ul>
    </section>
  )
}
