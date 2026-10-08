import { useState } from 'react'
import { ingredientiDaScegliere } from '../domain/ricette'
import type { Lista, Ricetta } from '../domain/tipi'
import { Icona } from './Icona'

interface Props {
  ricetta: Ricetta
  /** La lista di adesso, per dire cosa c'è già; `null` finché non è pronta. */
  lista: Lista | null
  /** Gli ingredienti scelti, col testo del sito, nell'ordine della ricetta. */
  onAggiungi: (testi: string[]) => void
  onAnnulla: () => void
}

/**
 * "Quali ingredienti aggiungo alla lista?" (doc/14-piano-ricette.md): tutti
 * spuntati, tranne i q.b.; si tolgono quelli che si hanno già in casa. Quelli
 * già da prendere nella lista hanno l'etichetta "già in lista", ma si possono
 * aggiungere lo stesso.
 */
export function ScegliIngredienti({ ricetta, lista, onAggiungi, onAnnulla }: Props) {
  const proposti = ingredientiDaScegliere(ricetta, lista)
  const [scelti, setScelti] = useState(() => proposti.map((i) => i.scelto))
  const quanti = scelti.filter(Boolean).length

  const alterna = (indice: number) =>
    setScelti((prima) => prima.map((scelto, i) => (i === indice ? !scelto : scelto)))

  return (
    <section className="scegli" aria-labelledby="scegli-titolo">
      <h2 className="scegli__titolo" id="scegli-titolo">
        Cosa aggiungo alla lista?
      </h2>
      <p className="scegli__testo">
        Togli quello che hai già in casa. Gli ingredienti finiscono in fondo alla lista, sotto{' '}
        <strong>{ricetta.nome}</strong>.
      </p>

      <div className="scegli__tutti">
        <button className="scegli__tutti-bottone" type="button" onClick={() => setScelti(scelti.map(() => true))}>
          Tutti
        </button>
        <button className="scegli__tutti-bottone" type="button" onClick={() => setScelti(scelti.map(() => false))}>
          Nessuno
        </button>
      </div>

      <ul className="scegli__ingredienti">
        {proposti.map((ingrediente, i) => (
          <li key={`${i}-${ingrediente.testo}`}>
            <button
              className="scegli__ingrediente"
              type="button"
              role="checkbox"
              aria-checked={scelti[i]}
              onClick={() => alterna(i)}
            >
              <span className="scegli__segno" aria-hidden="true">
                <Icona nome="spunta" />
              </span>
              <span className="scegli__nome">{ingrediente.testo}</span>
              {ingrediente.giaInLista && <span className="scegli__gia">già in lista</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="scegli__azioni">
        <button
          className="bottone"
          type="button"
          disabled={quanti === 0 || lista === null}
          onClick={() => onAggiungi(proposti.filter((_, i) => scelti[i]).map((p) => p.testo))}
        >
          {quanti === 0 ? 'Niente da aggiungere' : quanti === 1 ? 'Aggiungi 1 ingrediente' : `Aggiungi ${quanti} ingredienti`}
        </button>
        <button className="genera__annulla" type="button" onClick={onAnnulla}>
          Non aggiungere niente
        </button>
      </div>
    </section>
  )
}
