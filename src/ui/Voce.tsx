import { useState } from 'react'
import { rinominabile } from '../domain/modifica'
import { elementiAttivi, eRaggruppata } from '../domain/spunta'
import type { Voce as VoceLista } from '../domain/tipi'
import './Voce.css'

interface Props {
  voce: VoceLista
  /** Le tipologie con cui si può sostituire la voce intera (F6). Vuoto = niente dropdown. */
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
 * Le azioni stanno dietro un secondo tocco, così il bersaglio grande resta la
 * spunta e in corsia non si cancella niente per sbaglio. Ogni voce si elimina;
 * la rinomina compare solo dove ha senso, cioè sulle voci scritte a mano finite
 * in "Altro" (doc/04-funzionalita.md, F6b).
 *
 * Le voci generate non si rinominano: si sostituiscono con la dropdown delle
 * alternative (F6). Nelle voci raggruppate la dropdown sta su ogni tipo e
 * propone le alternative di stagione.
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
            {alternative.length > 0 && (
              <Alternative
                etichetta={`Sostituisci ${voce.nome}`}
                testo="Sostituisci con…"
                alternative={alternative}
                onScegli={(nome) => {
                  onSostituisci(voce.id, nome)
                  chiudi()
                }}
              />
            )}
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
          {elementi.map((elemento) => {
            const diStagione = alternativeDi(elemento.nome)
            return (
              <li className="voce__elemento-riga" key={elemento.nome}>
                <button
                  className="voce__elemento"
                  type="button"
                  aria-pressed={elemento.comprato}
                  onClick={() => onAlternaElemento(voce.id, elemento.nome)}
                >
                  {elemento.nome}
                </button>
                {diStagione.length > 0 && (
                  <Alternative
                    etichetta={`Sostituisci ${elemento.nome}`}
                    testo="▾"
                    compatta
                    alternative={diStagione}
                    onScegli={(nuovo) => onSostituisciElemento(voce.id, elemento.nome, nuovo)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

/**
 * La dropdown delle alternative. È un `select` di sistema apposta: sul telefono
 * apre la ruota nativa, che con una mano sola è la cosa più comoda che ci sia.
 * Non ha uno stato suo: mostra sempre il segnaposto e riparte da lì, perché il
 * valore scelto diventa il nome della voce, non la selezione della dropdown.
 */
function Alternative({
  etichetta,
  testo,
  alternative,
  onScegli,
  compatta = false,
}: {
  etichetta: string
  testo: string
  alternative: string[]
  onScegli: (nome: string) => void
  compatta?: boolean
}) {
  return (
    <select
      className={compatta ? 'voce__alternative voce__alternative--compatta' : 'voce__alternative'}
      aria-label={etichetta}
      value=""
      onChange={(evento) => {
        if (evento.target.value !== '') onScegli(evento.target.value)
      }}
    >
      <option value="">{testo}</option>
      {alternative.map((nome) => (
        <option key={nome} value={nome}>
          {nome}
        </option>
      ))}
    </select>
  )
}
