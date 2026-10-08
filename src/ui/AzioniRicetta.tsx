import { useState } from 'react'
import type { Ricetta } from '../domain/tipi'
import { ErroreRete } from '../storage'
import { Icona } from './Icona'
import { PopupDalFondo } from './PopupDalFondo'

interface Props {
  ricetta: Ricetta
  elimina: (id: string) => Promise<void>
  /** Apre la scelta degli ingredienti; assente nella scheda, che ha già il suo bottone. */
  onAggiungi?: () => void
  /** La ricetta è eliminata e il popup è sceso. */
  onEliminata: () => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
}

type Fase = 'azioni' | 'conferma' | 'elimino'

/**
 * Il popup con le azioni di una ricetta, dall'elenco o dalla scheda: come
 * quello delle voci della lista (AzioniVoce), sale dal fondo. Eliminare una
 * ricetta non si annulla: la conferma sta qui dentro, e il popup resta aperto
 * finché il database non risponde, così un errore si legge dove si è toccato.
 */
export function AzioniRicetta({ ricetta, elimina, onAggiungi, onEliminata, onChiudi }: Props) {
  const [fase, setFase] = useState<Fase>('azioni')
  const [errore, setErrore] = useState<string | null>(null)

  return (
    <PopupDalFondo<'aggiungi' | 'eliminata'>
      etichetta={`azioni-ricetta-${ricetta.id}`}
      onUscito={(motivo) => {
        if (motivo === 'aggiungi') onAggiungi?.()
        else if (motivo === 'eliminata') onEliminata()
      }}
      onChiudi={onChiudi}
    >
      {({ chiudi, esci, trascina }) => {
        const eliminaDavvero = async () => {
          setFase('elimino')
          setErrore(null)
          try {
            await elimina(ricetta.id)
            esci('eliminata')
          } catch (motivo) {
            console.error('Ricetta non eliminata', motivo)
            setErrore(
              motivo instanceof ErroreRete
                ? 'Senza rete non posso eliminarla. Riprova quando torna.'
                : 'Non sono riuscito a eliminarla. Riprova tra poco.',
            )
            setFase('conferma')
          }
        }

        return (
          <div className="azioni-voce__corpo azioni-voce__afferra" {...trascina}>
            <span className="azioni-voce__maniglia" aria-hidden="true" />
            <h2 className="azioni-voce__titolo" id={`azioni-ricetta-${ricetta.id}`}>
              {ricetta.nome}
            </h2>

            {fase === 'azioni' ? (
              <>
                {onAggiungi && (
                  <button className="azioni-voce__bottone" type="button" onClick={() => esci('aggiungi')}>
                    Aggiungi ingredienti alla lista
                  </button>
                )}
                <a
                  className="azioni-voce__bottone azioni-voce__collegamento"
                  href={ricetta.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Procedimento sul sito <Icona nome="esterno" />
                </a>
                <button
                  className="azioni-voce__bottone azioni-voce__bottone--elimina"
                  type="button"
                  onClick={() => setFase('conferma')}
                >
                  Elimina
                </button>
              </>
            ) : (
              <div className="azioni-voce__campo" role="group" aria-label="Conferma eliminazione">
                <p className="azioni-voce__testo">
                  Elimino la ricetta? Gli ingredienti già in lista restano.
                </p>
                {errore && (
                  <p className="azioni-voce__errore" role="alert">
                    {errore}
                  </p>
                )}
                <div className="azioni-voce__coppia">
                  <button
                    className="azioni-voce__bottone"
                    type="button"
                    disabled={fase === 'elimino'}
                    onClick={() => {
                      setErrore(null)
                      setFase('azioni')
                    }}
                  >
                    Indietro
                  </button>
                  <button
                    className="azioni-voce__bottone azioni-voce__bottone--pericolo"
                    type="button"
                    disabled={fase === 'elimino'}
                    onClick={eliminaDavvero}
                  >
                    {fase === 'elimino' ? 'Elimino…' : 'Elimina'}
                  </button>
                </div>
              </div>
            )}

            <button className="azioni-voce__chiudi" type="button" onClick={chiudi}>
              Chiudi
            </button>
          </div>
        )
      }}
    </PopupDalFondo>
  )
}
