import type { Voce as VoceLista } from '../domain/tipi'
import './Voce.css'

/**
 * Una voce della lista. Le voci raggruppate (Frutta, Verdura) elencano i
 * propri elementi: allo Step 4 ognuno avrà la sua spunta.
 */
export function Voce({ voce }: { voce: VoceLista }) {
  return (
    <li className="voce">
      <span className="voce__nome">{voce.nome}</span>
      {voce.elementi && (
        <ul className="voce__elementi">
          {voce.elementi.map((elemento) => (
            <li className="voce__elemento" key={elemento.nome}>
              {elemento.nome}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
