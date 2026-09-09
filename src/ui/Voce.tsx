import { useState } from 'react'
import { rinominabile } from '../domain/modifica'
import { elementiAttivi, eRaggruppata } from '../domain/spunta'
import type { Voce as VoceLista } from '../domain/tipi'
import './Voce.css'

interface Props {
  voce: VoceLista
  /** Tocco sulla voce intera: la spunta, o la de-spunta se è tra i già presi. */
  onAlterna: (id: string) => void
  /** Tocco su un singolo elemento di Frutta o Verdura. */
  onAlternaElemento: (id: string, nome: string) => void
  /** Toglie la voce dalla lista. */
  onElimina: (id: string) => void
  /** Corregge il nome: solo per le voci manuali sotto "Altro". */
  onRinomina: (id: string, nome: string) => void
}

/**
 * Una voce della lista. Toccarla la segna comprata e la fa sparire dalla lista
 * attiva; nelle voci raggruppate (Frutta, Verdura) ogni elemento si spunta per
 * conto suo e sparisce da solo (doc/08-ui-ux.md).
 *
 * Le azioni stanno dietro un secondo tocco, così il bersaglio grande resta la
 * spunta e in corsia non si cancella niente per sbaglio. Ogni voce si elimina;
 * la rinomina compare solo dove ha senso, cioè sulle voci scritte a mano finite
 * in "Altro" (doc/04-funzionalita.md, F6b).
 */
export function Voce({ voce, onAlterna, onAlternaElemento, onElimina, onRinomina }: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)
  // Non nullo solo mentre si sta scrivendo il nome nuovo.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)

  // Tra i già presi si rivede tutto quanto, per poterlo de-spuntare.
  const elementi = voce.comprata ? (voce.elementi ?? []) : elementiAttivi(voce)

  const chiudi = () => {
    setNomeInCorso(null)
    setAzioniAperte(false)
  }

  const salvaNome = () => {
    if (nomeInCorso === null || nomeInCorso.trim() === '') return
    onRinomina(voce.id, nomeInCorso)
    chiudi()
  }

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
          aria-expanded={azioniAperte}
          aria-label={`Azioni per ${voce.nome}`}
          onClick={() => (azioniAperte ? chiudi() : setAzioniAperte(true))}
        >
          <span aria-hidden="true">⋯</span>
        </button>
      </div>

      {azioniAperte &&
        (nomeInCorso === null ? (
          <div className="voce__azioni">
            {rinominabile(voce) && (
              <button
                className="voce__azione"
                type="button"
                onClick={() => setNomeInCorso(voce.nome)}
              >
                Rinomina
              </button>
            )}
            <button
              className="voce__azione voce__azione--elimina"
              type="button"
              onClick={() => onElimina(voce.id)}
            >
              Elimina
            </button>
          </div>
        ) : (
          <form
            className="voce__rinomina"
            onSubmit={(evento) => {
              evento.preventDefault()
              salvaNome()
            }}
          >
            <input
              className="voce__campo"
              type="text"
              value={nomeInCorso}
              onChange={(evento) => setNomeInCorso(evento.target.value)}
              aria-label={`Nuovo nome per ${voce.nome}`}
              autoComplete="off"
              enterKeyHint="done"
              autoFocus
            />
            <button className="voce__azione" type="submit" disabled={nomeInCorso.trim() === ''}>
              Salva
            </button>
            <button className="voce__azione" type="button" onClick={chiudi}>
              Annulla
            </button>
          </form>
        ))}

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
