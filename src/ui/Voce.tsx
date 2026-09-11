import { useState } from 'react'
import { elementiAttivi, eRaggruppata } from '../domain/spunta'
import type { Voce as VoceLista } from '../domain/tipi'
import { AzioniVoce } from './AzioniVoce'
import './Voce.css'

interface Props {
  voce: VoceLista
  /** Le tipologie con cui si può sostituire la voce intera (F6). */
  alternative: string[]
  /** Le alternative di stagione per un tipo dentro Frutta o Verdura. */
  alternativeDi: (nome: string) => string[]
  /** Tocco sulla voce intera: la spunta, o la de-spunta se è tra i già presi. */
  onAlterna: (id: string) => void
  /** Tocco su un singolo elemento di Frutta o Verdura. */
  onAlternaElemento: (id: string, nome: string) => void
  /** Toglie la voce dalla lista. */
  onElimina: (id: string) => void
  /** Corregge il nome: solo per le voci manuali sotto "Altro". */
  onRinomina: (id: string, nome: string) => void
  /** Mette al posto della voce un'altra tipologia della sua categoria. */
  onSostituisci: (id: string, nome: string) => void
  /** Scambia un tipo dentro Frutta o Verdura con un altro di stagione. */
  onSostituisciElemento: (id: string, nome: string, nuovo: string) => void
}

/**
 * Una voce della lista. Toccarla la segna comprata e la fa sparire dalla lista
 * attiva; nelle voci raggruppate (Frutta, Verdura) ogni elemento si spunta per
 * conto suo e sparisce da solo (doc/08-ui-ux.md).
 *
 * Nella riga c'è solo la spunta. Tutto il resto — alternative, rinomina,
 * elimina — sta nel popup che si apre col ⋯ (AzioniVoce).
 */
export function Voce({
  voce,
  alternative,
  alternativeDi,
  onAlterna,
  onAlternaElemento,
  onElimina,
  onRinomina,
  onSostituisci,
  onSostituisciElemento,
}: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)

  // Tra i già presi si rivede tutto quanto, per poterlo de-spuntare.
  const elementi = voce.comprata ? (voce.elementi ?? []) : elementiAttivi(voce)

  return (
    <li className="voce">
      <div className="voce__testata">
        <button
          className="voce__riga"
          type="button"
          aria-pressed={voce.comprata}
          onClick={() => onAlterna(voce.id)}
        >
          <span className="voce__segno" aria-hidden="true" />
          <span className="voce__nome">{voce.nome}</span>
        </button>
        <button
          className="voce__azioni-apri"
          type="button"
          aria-haspopup="dialog"
          aria-label={`Azioni per ${voce.nome}`}
          onClick={() => setAzioniAperte(true)}
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </div>

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

      {azioniAperte && (
        <AzioniVoce
          voce={voce}
          elementi={elementi.map((e) => e.nome)}
          alternative={alternative}
          alternativeDi={alternativeDi}
          onElimina={() => onElimina(voce.id)}
          onRinomina={(nome) => onRinomina(voce.id, nome)}
          onSostituisci={(nome) => onSostituisci(voce.id, nome)}
          onSostituisciElemento={(nome, nuovo) => onSostituisciElemento(voce.id, nome, nuovo)}
          onChiudi={() => setAzioniAperte(false)}
        />
      )}
    </li>
  )
}
