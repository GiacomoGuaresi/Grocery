import { useState } from 'react'
import { eQuantoBasta } from '../domain/ricette'
import type { Ricetta } from '../domain/tipi'
import { AzioniRicetta } from './AzioniRicetta'
import { Icona } from './Icona'

interface Props {
  ricetta: Ricetta
  /** Apre la scelta degli ingredienti da aggiungere alla lista. */
  onScegli: () => void
  elimina: (id: string) => Promise<void>
  onIndietro: () => void
}

/**
 * La scheda di una ricetta salvata (doc/14-piano-ricette.md): foto, categorie
 * e ingredienti; il procedimento sta sul sito, a un tocco. Da qui si
 * aggiungono gli ingredienti alla lista, anche più volte. Le altre azioni,
 * eliminare compreso, stanno nel popup che si apre col ⋯ (AzioniRicetta),
 * come per le voci della lista.
 */
export function SchedaRicetta({ ricetta, onScegli, elimina, onIndietro }: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)

  return (
    <article className="scheda" aria-labelledby="scheda-titolo">
      <div className="scheda__barra">
        <button className="scheda__indietro" type="button" onClick={onIndietro}>
          <Icona nome="indietro" /> Ricette
        </button>
        <button
          className="ricetta__azioni-apri"
          type="button"
          aria-haspopup="dialog"
          aria-label={`Azioni per ${ricetta.nome}`}
          onClick={() => setAzioniAperte(true)}
        >
          <Icona nome="altro" />
        </button>
      </div>

      {ricetta.immagine && (
        <img className="scheda__foto" src={ricetta.immagine} alt="" referrerPolicy="no-referrer" />
      )}

      <h2 className="scheda__titolo" id="scheda-titolo">
        {ricetta.nome}
      </h2>
      {ricetta.categorie.length > 0 && (
        <ul className="scheda__categorie" aria-label="Categorie">
          {ricetta.categorie.map((categoria) => (
            <li key={categoria} className="scheda__categoria">
              {categoria}
            </li>
          ))}
        </ul>
      )}

      <a className="scheda__sito" href={ricetta.url} target="_blank" rel="noreferrer noopener">
        Procedimento sul sito ({new URL(ricetta.url).hostname.replace(/^www\./, '')})
        <Icona nome="esterno" />
      </a>

      <h3 className="scheda__sottotitolo">Ingredienti</h3>
      <ul className="scheda__ingredienti">
        {ricetta.ingredienti.map((ingrediente, i) => (
          <li
            key={`${i}-${ingrediente}`}
            className={eQuantoBasta(ingrediente) ? 'scheda__ingrediente scheda__ingrediente--qb' : 'scheda__ingrediente'}
          >
            {ingrediente}
          </li>
        ))}
      </ul>

      <div className="genera__scelte">
        <button className="bottone" type="button" onClick={onScegli}>
          Aggiungi ingredienti alla lista
        </button>
      </div>

      {azioniAperte && (
        <AzioniRicetta
          ricetta={ricetta}
          elimina={elimina}
          onEliminata={onIndietro}
          onChiudi={() => setAzioniAperte(false)}
        />
      )}
    </article>
  )
}
