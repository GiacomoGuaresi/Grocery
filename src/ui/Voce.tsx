import { useEffect, useRef, useState } from 'react'
import { tutteLeAlternative, type Alternative } from '../domain/alternative'
import { rinominabile } from '../domain/modifica'
import type { Voce as VoceLista } from '../domain/tipi'
import { movimentoRidotto, useUscita } from './animazioni'
import { AzioniVoce, SceltaAlternativa } from './AzioniVoce'
import { Icona } from './Icona'
import './Voce.css'

/**
 * La voce appena arrivata in un punto della lista, da far entrare con
 * un'animazione: aggiunta a mano, oppure spostata da una spunta o una
 * de-spunta. `comprata` dice dove arriva, così la riga che sta uscendo
 * dall'altra parte non la prende per sé.
 */
export interface Arrivo {
  id: string
  tipo: 'aggiunta' | 'spostata'
  comprata: boolean
}

interface Props {
  voce: VoceLista
  /** Le tipologie con cui si può sostituire la voce (F6); per frutta e verdura, prima quelle di stagione. */
  alternative: Alternative
  /** L'ultima voce arrivata nella lista, se c'è. */
  arrivo: Arrivo | null
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
 * "Altro" toccare il nome lo rende modificabile lì dove sta; nelle voci che
 * hanno alternative (frutta, verdura, carne, pesce…) apre subito la dropdown
 * per sostituirle. Tutto il resto — rinomina, elimina, e di nuovo le
 * alternative — sta nel popup che si apre col ⋯ (AzioniVoce).
 *
 * Spunta ed eliminazione sono animate: la riga si chiude, e solo dopo la
 * modifica arriva alla lista. Una voce appena arrivata invece si apre.
 */
export function Voce({
  voce,
  alternative,
  arrivo,
  onAlterna,
  onElimina,
  onRinomina,
  onSostituisci,
}: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)
  // Non nullo solo mentre si sta scrivendo il nome nuovo direttamente nella riga.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)
  const riga = useRef<HTMLLIElement>(null)

  const { uscita, esci, fine } = useUscita<'spunta' | 'elimina'>((motivo) =>
    motivo === 'elimina' ? onElimina(voce.id) : onAlterna(voce.id),
  )
  // Mentre la riga esce per la spunta, la casella mostra già lo stato nuovo.
  const spuntata = uscita === 'spunta' ? !voce.comprata : voce.comprata

  const arriva =
    arrivo && arrivo.id === voce.id && arrivo.comprata === voce.comprata ? arrivo.tipo : null
  const [arrivata, setArrivata] = useState(false)

  // Quella aggiunta a mano può finire in un reparto fuori schermo: la si porta in vista.
  useEffect(() => {
    if (arriva !== 'aggiunta') return
    riga.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: movimentoRidotto() ? 'auto' : 'smooth',
    })
  }, [arriva])

  const classi = ['voce']
  if (arriva && !arrivata) classi.push('voce--arriva', `voce--arriva-${arriva}`)
  if (uscita) classi.push('voce--esce')
  if (uscita === 'spunta' && spuntata) classi.push('voce--si-spunta')

  // Invio o tocco fuori salvano; un nome vuoto o uguale lascia tutto com'era.
  const salvaNome = () => {
    const nome = nomeInCorso?.trim() ?? ''
    if (nome !== '' && nome !== voce.nome) onRinomina(voce.id, nome)
    setNomeInCorso(null)
  }

  return (
    <li
      ref={riga}
      className={classi.join(' ')}
      onAnimationEnd={(evento) => {
        // Solo le animazioni della riga, non quelle del segno dentro.
        if (evento.target !== evento.currentTarget) return
        if (evento.animationName === 'voce-esce') fine()
        // L'arrivo finisce con la sua ultima animazione: il lampo, per le aggiunte.
        else if (evento.animationName === (arriva === 'aggiunta' ? 'voce-lampo' : 'voce-arriva'))
          setArrivata(true)
      }}
    >
      <div className="voce__testata">
        <button
          className="voce__spunta"
          type="button"
          aria-pressed={spuntata}
          aria-label={`Spunta ${voce.nome}`}
          onClick={() => esci('spunta')}
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
            <Icona nome="matita" className="voce__nome-icona" />
          </button>
        ) : tutteLeAlternative(alternative).length > 0 ? (
          // La select è trasparente e copre il nome: il tocco sul testo apre la
          // ruota nativa. Il nome resta uno span, così la barra dei già presi c'è.
          <span className="voce__nome voce__nome--sostituisci">
            {voce.nome}
            <Icona nome="giu" className="voce__nome-icona" />
            <SceltaAlternativa
              className="voce__scelta"
              etichetta={`Sostituisci ${voce.nome}`}
              testo={voce.nome}
              alternative={alternative}
              onScegli={(nome) => onSostituisci(voce.id, nome)}
            />
          </span>
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
          onElimina={() => esci('elimina')}
          onRinomina={(nome) => onRinomina(voce.id, nome)}
          onSostituisci={(nome) => onSostituisci(voce.id, nome)}
          onChiudi={() => setAzioniAperte(false)}
        />
      )}
    </li>
  )
}
