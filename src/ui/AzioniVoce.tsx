import { useEffect, useRef, useState } from 'react'
import { rinominabile } from '../domain/modifica'
import type { Voce as VoceLista } from '../domain/tipi'
import './AzioniVoce.css'

interface Props {
  voce: VoceLista
  /** Le tipologie con cui si può sostituire la voce (F6); di stagione per frutta e verdura. */
  alternative: string[]
  onElimina: () => void
  onRinomina: (nome: string) => void
  onSostituisci: (nome: string) => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
}

/**
 * Il popup con le azioni di una voce: sostituirla con un'alternativa (F6) —
 * per un tipo di frutta o verdura, con un altro di stagione — rinominarla
 * (solo le voci manuali sotto "Altro", F6b) ed eliminarla. Nella riga della
 * lista restano la spunta e il nome, così le righe sono basse e in corsia non
 * si cancella niente per sbaglio.
 *
 * È un `<dialog>` modale: il browser si occupa del fuoco, di Esc e del velo
 * sopra la lista. Ogni chiusura passa da `close()`, che avvisa con `onChiudi`.
 */
export function AzioniVoce({
  voce,
  alternative,
  onElimina,
  onRinomina,
  onSostituisci,
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
  testo,
  alternative,
  onScegli,
}: {
  testo: string
  alternative: string[]
  onScegli: (nome: string) => void
}) {
  return (
    <select
      className="azioni-voce__scelta"
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
