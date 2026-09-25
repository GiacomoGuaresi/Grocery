import { useEffect, useRef, useState } from 'react'
import { rinominabile, repartiSceglibili } from '../domain/modifica'
import type { IdReparto, Voce as VoceLista } from '../domain/tipi'
import { useUscita } from './animazioni'
import './AzioniVoce.css'

interface Props {
  voce: VoceLista
  onElimina: () => void
  onRinomina: (nome: string) => void
  /** Mette nel reparto scelto una voce senza reparto. */
  onCambiaReparto: (reparto: IdReparto) => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
}

/**
 * Il popup con le azioni di una voce: rinominarla e sceglierle il reparto
 * (solo le voci manuali sotto "Altro", F6b) ed eliminarla. Nella riga della lista restano la spunta o il
 * contatore e il nome, così le righe sono basse e in corsia non si cancella
 * niente per sbaglio. I consigli delle voci generate hanno un popup loro
 * (ConsigliVoce), che si apre dal nome.
 *
 * È un `<dialog>` modale: il browser si occupa del fuoco, di Esc e del velo
 * sopra la lista. Ogni chiusura passa da `close()`, che avvisa con `onChiudi`.
 *
 * Prima di chiudersi ridiscende verso il fondo. L'eliminazione aspetta che sia
 * sceso, così dopo si vede la riga che se ne va.
 */
export function AzioniVoce({ voce, onElimina, onRinomina, onCambiaReparto, onChiudi }: Props) {
  const finestra = useRef<HTMLDialogElement>(null)
  // Non nullo solo mentre si sta scrivendo il nome nuovo.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)
  // Vero mentre si sceglie il reparto tra quelli esistenti.
  const [sceltaReparto, setSceltaReparto] = useState(false)

  useEffect(() => {
    const dialogo = finestra.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const { uscita, esci, fine } = useUscita<'chiudi' | 'elimina'>((motivo) => {
    finestra.current?.close()
    if (motivo === 'elimina') onElimina()
  })
  const chiudi = () => esci('chiudi')

  return (
    <dialog
      ref={finestra}
      className={uscita ? 'azioni-voce azioni-voce--chiude' : 'azioni-voce'}
      aria-labelledby={`azioni-${voce.id}`}
      onClose={onChiudi}
      // Anche Esc passa dall'animazione di chiusura.
      onCancel={(evento) => {
        evento.preventDefault()
        chiudi()
      }}
      onAnimationEnd={(evento) => {
        if (evento.target === evento.currentTarget && evento.animationName === 'azioni-voce-scende')
          fine()
      }}
      // Il tocco sul velo arriva al dialog stesso: chiude, come fuori dal menu.
      onClick={(evento) => evento.target === evento.currentTarget && chiudi()}
    >
      <div className="azioni-voce__corpo">
        <h2 className="azioni-voce__titolo" id={`azioni-${voce.id}`}>
          {voce.nome}
        </h2>

        {sceltaReparto ? (
          <div className="azioni-voce__campo">
            <span className="azioni-voce__etichetta" id={`reparti-${voce.id}`}>
              Reparto
            </span>
            <div className="azioni-voce__reparti" role="group" aria-labelledby={`reparti-${voce.id}`}>
              {repartiSceglibili.map((reparto) => (
                <button
                  key={reparto.id}
                  className="azioni-voce__bottone"
                  type="button"
                  onClick={() => {
                    onCambiaReparto(reparto.id)
                    chiudi()
                  }}
                >
                  {reparto.nome}
                </button>
              ))}
            </div>
            <button
              className="azioni-voce__bottone"
              type="button"
              onClick={() => setSceltaReparto(false)}
            >
              Indietro
            </button>
          </div>
        ) : nomeInCorso === null ? (
          <>
            {rinominabile(voce) && (
              <>
                <button
                  className="azioni-voce__bottone"
                  type="button"
                  onClick={() => setNomeInCorso(voce.nome)}
                >
                  Rinomina
                </button>
                <button
                  className="azioni-voce__bottone"
                  type="button"
                  onClick={() => setSceltaReparto(true)}
                >
                  Scegli reparto
                </button>
              </>
            )}
            <button
              className="azioni-voce__bottone azioni-voce__bottone--elimina"
              type="button"
              onClick={() => esci('elimina')}
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
