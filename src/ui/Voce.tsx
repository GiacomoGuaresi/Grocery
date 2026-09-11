import { useState } from 'react'
import type { Alternative } from '../domain/alternative'
import { rinominabile } from '../domain/modifica'
import type { Voce as VoceLista } from '../domain/tipi'
import { AzioniVoce } from './AzioniVoce'
import { Icona } from './Icona'
import './Voce.css'

interface Props {
  voce: VoceLista
  /** Le tipologie con cui si può sostituire la voce (F6); per frutta e verdura, prima quelle di stagione. */
  alternative: Alternative
  /** Tocco sulla casella: la spunta, o la de-spunta se è tra i già presi. */
  onAlterna: (id: string) => void
  /** Toglie la voce dalla lista. */
  onElimina: (id: string) => void
  /** Corregge il nome: solo per le voci manuali sotto "Altro". */
  onRinomina: (id: string, nome: string) => void
  /** Mette al posto della voce un'altra tipologia della sua categoria. */
  onSostituisci: (id: string, nome: string) => void
}

/**
 * Una voce della lista. Toccare la sua casella la segna comprata e la fa
 * sparire dalla lista attiva (doc/08-ui-ux.md). Ogni tipo di frutta e verdura
 * è una voce a sé, come tutte le altre.
 *
 * Si spunta solo dalla casella: il nome non spunta. Nelle voci manuali sotto
 * "Altro" toccare il nome lo rende modificabile lì dove sta. Tutto il resto —
 * alternative, rinomina, elimina — sta nel popup che si apre col ⋯ (AzioniVoce).
 */
export function Voce({ voce, alternative, onAlterna, onElimina, onRinomina, onSostituisci }: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)
  // Non nullo solo mentre si sta scrivendo il nome nuovo direttamente nella riga.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)

  // Invio o tocco fuori salvano; un nome vuoto o uguale lascia tutto com'era.
  const salvaNome = () => {
    const nome = nomeInCorso?.trim() ?? ''
    if (nome !== '' && nome !== voce.nome) onRinomina(voce.id, nome)
    setNomeInCorso(null)
  }

  return (
    <li className="voce">
      <div className="voce__testata">
        <button
          className="voce__spunta"
          type="button"
          aria-pressed={voce.comprata}
          aria-label={`Spunta ${voce.nome}`}
          onClick={() => onAlterna(voce.id)}
        >
          <span className="voce__segno" aria-hidden="true">
            <Icona nome="spunta" className="voce__segno-spunta" />
          </span>
        </button>
        {nomeInCorso !== null ? (
          <input
            className="voce__campo"
            type="text"
            value={nomeInCorso}
            onChange={(evento) => setNomeInCorso(evento.target.value)}
            onBlur={salvaNome}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') evento.currentTarget.blur()
              if (evento.key === 'Escape') setNomeInCorso(null)
            }}
            aria-label={`Nuovo nome per ${voce.nome}`}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
          />
        ) : rinominabile(voce) ? (
          <button
            className="voce__nome voce__nome--rinomina"
            type="button"
            aria-label={`Rinomina ${voce.nome}`}
            onClick={() => setNomeInCorso(voce.nome)}
          >
            {voce.nome}
          </button>
        ) : (
          <span className="voce__nome">{voce.nome}</span>
        )}
        <button
          className="voce__azioni-apri"
          type="button"
          aria-haspopup="dialog"
          aria-label={`Azioni per ${voce.nome}`}
          onClick={() => setAzioniAperte(true)}
        >
          <Icona nome="altro" />
        </button>
      </div>

      {azioniAperte && (
        <AzioniVoce
          voce={voce}
          alternative={alternative}
          onElimina={() => onElimina(voce.id)}
          onRinomina={(nome) => onRinomina(voce.id, nome)}
          onSostituisci={(nome) => onSostituisci(voce.id, nome)}
          onChiudi={() => setAzioniAperte(false)}
        />
      )}
    </li>
  )
}
