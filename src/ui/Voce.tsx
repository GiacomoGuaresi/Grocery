import { elementiAttivi, eRaggruppata } from '../domain/spunta'
import type { Voce as VoceLista } from '../domain/tipi'
import './Voce.css'

interface Props {
  voce: VoceLista
  /** Tocco sulla voce intera: la spunta, o la de-spunta se è tra i già presi. */
  onAlterna: (id: string) => void
  /** Tocco su un singolo elemento di Frutta o Verdura. */
  onAlternaElemento: (id: string, nome: string) => void
}

/**
 * Una voce della lista. Toccarla la segna comprata e la fa sparire dalla lista
 * attiva; nelle voci raggruppate (Frutta, Verdura) ogni elemento si spunta per
 * conto suo e sparisce da solo (doc/08-ui-ux.md).
 */
export function Voce({ voce, onAlterna, onAlternaElemento }: Props) {
  // Tra i già presi si rivede tutto quanto, per poterlo de-spuntare.
  const elementi = voce.comprata ? (voce.elementi ?? []) : elementiAttivi(voce)

  return (
    <li className="voce">
      <button
        className="voce__riga"
        type="button"
        aria-pressed={voce.comprata}
        onClick={() => onAlterna(voce.id)}
      >
        <span className="voce__segno" aria-hidden="true" />
        <span className="voce__nome">{voce.nome}</span>
      </button>
      {eRaggruppata(voce) && (
        <ul className="voce__elementi">
          {elementi.map((elemento) => (
            <li key={elemento.nome}>
              <button
                className="voce__elemento"
                type="button"
                aria-pressed={elemento.comprato}
                onClick={() => onAlternaElemento(voce.id, elemento.nome)}
              >
                {elemento.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
