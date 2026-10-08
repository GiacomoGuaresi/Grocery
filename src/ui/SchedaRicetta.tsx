import { useState } from 'react'
import { eQuantoBasta } from '../domain/ricette'
import type { Lista, Ricetta } from '../domain/tipi'
import { ErroreRete } from '../storage'
import { Icona } from './Icona'
import { ScegliIngredienti } from './ScegliIngredienti'

interface Props {
  ricetta: Ricetta
  lista: Lista | null
  onAggiungi: (testi: string[]) => void
  elimina: (id: string) => Promise<void>
  onIndietro: () => void
}

type Fase = 'scheda' | 'scelta' | 'conferma-elimina' | 'elimino'

/**
 * La scheda di una ricetta salvata (doc/14-piano-ricette.md): foto, categorie
 * e ingredienti; il procedimento sta sul sito, a un tocco. Da qui si
 * aggiungono gli ingredienti alla lista, anche più volte, e si elimina.
 */
export function SchedaRicetta({ ricetta, lista, onAggiungi, elimina, onIndietro }: Props) {
  const [fase, setFase] = useState<Fase>('scheda')
  const [errore, setErrore] = useState<string | null>(null)

  if (fase === 'scelta') {
    return (
      <ScegliIngredienti
        ricetta={ricetta}
        lista={lista}
        onAggiungi={onAggiungi}
        onAnnulla={() => setFase('scheda')}
      />
    )
  }

  const eliminaDavvero = async () => {
    setFase('elimino')
    setErrore(null)
    try {
      await elimina(ricetta.id)
      onIndietro()
    } catch (motivo) {
      console.error('Ricetta non eliminata', motivo)
      setErrore(
        motivo instanceof ErroreRete
          ? 'Senza rete non posso eliminarla. Riprova quando torna.'
          : 'Non sono riuscito a eliminarla. Riprova tra poco.',
      )
      setFase('scheda')
    }
  }

  return (
    <article className="scheda" aria-labelledby="scheda-titolo">
      <button className="scheda__indietro" type="button" onClick={onIndietro}>
        <Icona nome="indietro" /> Ricette
      </button>

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

      {errore && (
        <p className="scheda__errore" role="alert">
          {errore}
        </p>
      )}

      <div className="genera__scelte">
        <button className="bottone" type="button" onClick={() => setFase('scelta')}>
          Aggiungi ingredienti alla lista
        </button>
        {fase === 'conferma-elimina' || fase === 'elimino' ? (
          <div className="scheda__conferma" role="group" aria-label="Conferma eliminazione">
            <p className="scheda__conferma-testo">
              Elimino la ricetta? Gli ingredienti già in lista restano.
            </p>
            <div className="scheda__conferma-scelte">
              <button className="bottone bottone--discreto" type="button" onClick={() => setFase('scheda')} disabled={fase === 'elimino'}>
                Annulla
              </button>
              <button className="bottone bottone--elimina" type="button" onClick={eliminaDavvero} disabled={fase === 'elimino'}>
                {fase === 'elimino' ? 'Elimino…' : 'Elimina'}
              </button>
            </div>
          </div>
        ) : (
          <button className="scheda__elimina" type="button" onClick={() => setFase('conferma-elimina')}>
            Elimina ricetta
          </button>
        )}
      </div>
    </article>
  )
}
