import { useEffect, useRef, useState } from 'react'
import { rinominabile } from '../domain/modifica'
import type { Voce as VoceLista } from '../domain/tipi'
import './AzioniVoce.css'

interface Props {
  voce: VoceLista
  /** I tipi di Frutta o Verdura che si vedono nella riga. Vuoto per le voci semplici. */
  elementi: string[]
  /** Le tipologie con cui si può sostituire la voce intera (F6). */
  alternative: string[]
  /** Le alternative di stagione per un tipo dentro Frutta o Verdura. */
  alternativeDi: (nome: string) => string[]
  onElimina: () => void
  onRinomina: (nome: string) => void
  onSostituisci: (nome: string) => void
  onSostituisciElemento: (nome: string, nuovo: string) => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
}

/**
 * Il popup con le azioni di una voce: sostituirla con un'alternativa (F6),
 * cambiare un tipo di Frutta o Verdura con uno di stagione, rinominarla (solo
 * le voci manuali sotto "Altro", F6b) ed eliminarla. Nella riga della lista
 * resta solo la spunta, così le righe sono basse e in corsia non si cancella
 * niente per sbaglio.
 *
 * È un `<dialog>` modale: il browser si occupa del fuoco, di Esc e del velo
 * sopra la lista. Ogni chiusura passa da `close()`, che avvisa con `onChiudi`.
 */
export function AzioniVoce({
  voce,
  elementi,
  alternative,
  alternativeDi,
  onElimina,
  onRinomina,
  onSostituisci,
  onSostituisciElemento,
  onChiudi,
}: Props) {
  const finestra = useRef<HTMLDialogElement>(null)
  // Non nullo solo mentre si sta scrivendo il nome nuovo.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)

  useEffect(() => {
    const dialogo = finestra.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const chiudi = () => finestra.current?.close()

  const conAlternative = elementi
    .map((nome) => ({ nome, diStagione: alternativeDi(nome) }))
    .filter((e) => e.diStagione.length > 0)

  return (
    <dialog
      ref={finestra}
      className="azioni-voce"
      aria-labelledby={`azioni-${voce.id}`}
      onClose={onChiudi}
      // Il tocco sul velo arriva al dialog stesso: chiude, come fuori dal menu.
      onClick={(evento) => evento.target === evento.currentTarget && chiudi()}
    >
      <div className="azioni-voce__corpo">
        <h2 className="azioni-voce__titolo" id={`azioni-${voce.id}`}>
          {voce.nome}
        </h2>

        {nomeInCorso === null ? (
          <>
            {alternative.length > 0 && (
              <label className="azioni-voce__campo">
                <span className="azioni-voce__etichetta">Sostituisci con</span>
                <Alternative
                  testo="Scegli un'alternativa…"
                  alternative={alternative}
                  onScegli={(nome) => {
                    onSostituisci(nome)
                    chiudi()
                  }}
                />
              </label>
            )}

            {conAlternative.length > 0 && (
              <div className="azioni-voce__campo">
                <span className="azioni-voce__etichetta">Alternative di stagione</span>
                <ul className="azioni-voce__elementi">
                  {conAlternative.map(({ nome, diStagione }) => (
                    <li className="azioni-voce__elemento" key={nome}>
                      <span>{nome}</span>
                      <Alternative
                        etichetta={`Sostituisci ${nome}`}
                        testo="Cambia…"
                        alternative={diStagione}
                        // Resta aperto: si possono cambiare più tipi di fila.
                        onScegli={(nuovo) => onSostituisciElemento(nome, nuovo)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rinominabile(voce) && (
              <button
                className="azioni-voce__bottone"
                type="button"
                onClick={() => setNomeInCorso(voce.nome)}
              >
                Rinomina
              </button>
            )}
            <button
              className="azioni-voce__bottone azioni-voce__bottone--elimina"
              type="button"
              onClick={() => {
                onElimina()
                chiudi()
              }}
            >
              Elimina
            </button>
          </>
        ) : (
          <form
            className="azioni-voce__campo"
            onSubmit={(evento) => {
              evento.preventDefault()
              if (nomeInCorso.trim() === '') return
              onRinomina(nomeInCorso)
              chiudi()
            }}
          >
            <input
              className="azioni-voce__scelta azioni-voce__scelta--testo"
              type="text"
              value={nomeInCorso}
              onChange={(evento) => setNomeInCorso(evento.target.value)}
              aria-label={`Nuovo nome per ${voce.nome}`}
              autoComplete="off"
              enterKeyHint="done"
              autoFocus
            />
            <div className="azioni-voce__coppia">
              <button
                className="azioni-voce__bottone"
                type="button"
                onClick={() => setNomeInCorso(null)}
              >
                Indietro
              </button>
              <button
                className="azioni-voce__bottone azioni-voce__bottone--principale"
                type="submit"
                disabled={nomeInCorso.trim() === ''}
              >
                Salva
              </button>
            </div>
          </form>
        )}

        <button className="azioni-voce__chiudi" type="button" onClick={chiudi}>
          Chiudi
        </button>
      </div>
    </dialog>
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
}: {
  etichetta?: string
  testo: string
  alternative: string[]
  onScegli: (nome: string) => void
}) {
  return (
    <select
      className="azioni-voce__scelta"
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
