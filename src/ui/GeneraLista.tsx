import { useState } from 'react'
import type { Voce } from '../domain/tipi'
import './GeneraLista.css'

interface Props {
  /** Quello che nella lista corrente è rimasto da prendere (R6). */
  rimaste: Voce[]
  /** Genera il nuovo ciclo, portando avanti o no le voci rimaste. */
  onGenera: (portaAvanti: boolean) => void
}

/**
 * Il bottone "Genera lista" della schermata vuota, dove è l'azione principale.
 * Con una lista in corso ci si arriva invece dal menu laterale, che apre
 * direttamente la conferma.
 */
export function GeneraLista({ rimaste, onGenera }: Props) {
  const [conferma, setConferma] = useState(false)

  if (conferma) {
    return (
      <ConfermaGenera
        rimaste={rimaste}
        onGenera={(portaAvanti) => {
          setConferma(false)
          onGenera(portaAvanti)
        }}
        onAnnulla={() => setConferma(false)}
      />
    )
  }

  return (
    <div className="genera">
      <button className="bottone" type="button" onClick={() => setConferma(true)}>
        Genera lista
      </button>
    </div>
  )
}

/**
 * La conferma che apre il ciclo nuovo di due settimane (doc/08-ui-ux.md, §3).
 * C'è sempre, perché la lista di adesso si cancella: non esiste un "rigenera".
 *
 * Se è rimasto qualcosa da prendere la conferma diventa una domanda: portarlo
 * nella lista nuova oppure no. È così che quello che si è aggiunto a mano tra
 * una spesa e l'altra arriva alla spesa dopo (F1, R6).
 */
export function ConfermaGenera({
  rimaste,
  onGenera,
  onAnnulla,
}: Props & { onAnnulla: () => void }) {
  return (
    <section className="genera genera--conferma" role="dialog" aria-label="Genera una nuova lista">
      <h2 className="genera__titolo">Genero una lista nuova?</h2>
      <p className="genera__testo">
        La lista di adesso viene cancellata: da lì in poi si compra su quella nuova.
      </p>

      {rimaste.length > 0 && (
        <>
          <p className="genera__testo">
            Nella lista di adesso {rimaste.length === 1 ? "c'è" : 'ci sono'}{' '}
            <strong>
              {rimaste.length} {rimaste.length === 1 ? 'voce' : 'voci'}
            </strong>{' '}
            da prendere. {rimaste.length === 1 ? 'La porto' : 'Le porto'} nella lista nuova?
          </p>
          <ul className="genera__rimaste">
            {rimaste.map((voce) => (
              <li key={voce.id}>{voce.nome}</li>
            ))}
          </ul>
        </>
      )}

      <div className="genera__scelte">
        {rimaste.length > 0 ? (
          <>
            <button className="bottone" type="button" onClick={() => onGenera(true)}>
              Sì, portale avanti
            </button>
            <button
              className="bottone bottone--discreto"
              type="button"
              onClick={() => onGenera(false)}
            >
              No, lista pulita
            </button>
          </>
        ) : (
          <button className="bottone" type="button" onClick={() => onGenera(false)}>
            Genera
          </button>
        )}
        <button className="genera__annulla" type="button" onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </section>
  )
}
