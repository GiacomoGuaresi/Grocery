import { useAggiornamento } from './aggiornamento'
import './PopupAggiornamento.css'

/**
 * L'avviso di una versione nuova, in basso sopra la safe area: "Aggiorna" la
 * carica subito, "Più tardi" lo zittisce fino alla versione dopo. Non sparisce
 * da solo: un aggiornamento perso resta perso fino alla prossima apertura.
 */
export function PopupAggiornamento() {
  const { disponibile, aggiorna, rimanda } = useAggiornamento()
  if (!disponibile) return null

  return (
    <div className="aggiornamento">
      <div className="aggiornamento__scheda" role="status">
        <span className="aggiornamento__testo">È disponibile una nuova versione</span>
        <button type="button" className="aggiornamento__pulsante" onClick={rimanda}>
          Più tardi
        </button>
        <button type="button" className="aggiornamento__pulsante aggiornamento__pulsante--principale" onClick={aggiorna}>
          Aggiorna
        </button>
      </div>
    </div>
  )
}
