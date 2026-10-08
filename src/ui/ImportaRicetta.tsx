import { useEffect, useState } from 'react'
import type { Lista, Ricetta } from '../domain/tipi'
import { ErroreImport, ErroreRete, type MotivoImport } from '../storage'
import { ScegliIngredienti } from './ScegliIngredienti'

interface Props {
  /** Il testo condiviso o incollato, col link dentro. */
  testo: string
  importa: (testo: string) => Promise<Ricetta>
  lista: Lista | null
  /** Gli ingredienti scelti vanno nella lista. */
  onAggiungi: (ricetta: Ricetta, testi: string[]) => void
  /** Ricetta salvata, niente in lista: si apre la sua scheda. */
  onSoloSalvata: (ricetta: Ricetta) => void
  onChiudi: () => void
}

type Stato =
  | { fase: 'scarico' }
  | { fase: 'errore'; motivo: MotivoImport | 'senza-rete' }
  | { fase: 'salvata'; ricetta: Ricetta }
  | { fase: 'scelta'; ricetta: Ricetta }

const MESSAGGI: Record<MotivoImport | 'senza-rete', string> = {
  'nessun-link': 'Nel testo condiviso non trovo un link.',
  'non-ricetta': 'In questa pagina non trovo una ricetta. Funziona coi siti che descrivono la ricetta per Google, come GialloZafferano o Fatto in casa da Benedetta.',
  'sito-irraggiungibile': 'Il sito non risponde. Riprova tra poco.',
  'non-autenticato': 'La sessione è scaduta: rientra con la passphrase e riprova.',
  'senza-rete': 'Senza rete non posso scaricare la ricetta. Riprova quando torna.',
  sconosciuto: 'Qualcosa è andato storto. Riprova tra poco.',
}

/**
 * L'import di una ricetta da un link (doc/14-piano-ricette.md): la scarica e la
 * salva, poi chiede se aggiungere gli ingredienti alla lista e quali.
 */
export function ImportaRicetta({ testo, importa, lista, onAggiungi, onSoloSalvata, onChiudi }: Props) {
  const [stato, setStato] = useState<Stato>({ fase: 'scarico' })
  const [tentativo, setTentativo] = useState(0)

  useEffect(() => {
    let vivo = true
    setStato({ fase: 'scarico' })
    importa(testo)
      .then((ricetta) => vivo && setStato({ fase: 'salvata', ricetta }))
      .catch((errore) => {
        if (!vivo) return
        if (!(errore instanceof ErroreImport)) console.error('Import non riuscito', errore)
        const motivo =
          errore instanceof ErroreRete ? 'senza-rete' : errore instanceof ErroreImport ? errore.motivo : 'sconosciuto'
        setStato({ fase: 'errore', motivo })
      })
    return () => {
      vivo = false
    }
  }, [testo, importa, tentativo])

  switch (stato.fase) {
    case 'scarico':
      return (
        <section className="importa" aria-live="polite">
          <p className="importa__attesa">Scarico la ricetta…</p>
        </section>
      )

    case 'errore':
      return (
        <section className="importa genera--conferma" role="alert">
          <h2 className="genera__titolo">Ricetta non importata</h2>
          <p className="importa__testo">{MESSAGGI[stato.motivo]}</p>
          <div className="genera__scelte">
            {stato.motivo !== 'nessun-link' && stato.motivo !== 'non-ricetta' && (
              <button className="bottone" type="button" onClick={() => setTentativo((t) => t + 1)}>
                Riprova
              </button>
            )}
            <button className="genera__annulla" type="button" onClick={onChiudi}>
              Chiudi
            </button>
          </div>
        </section>
      )

    case 'salvata':
      return (
        <section className="importa genera--conferma" aria-labelledby="importa-titolo">
          {stato.ricetta.immagine && (
            <img
              className="importa__foto"
              src={stato.ricetta.immagine}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
          <p className="importa__salvata">Ricetta salvata</p>
          <h2 className="genera__titolo" id="importa-titolo">
            {stato.ricetta.nome}
          </h2>
          <p className="importa__testo">
            Aggiungo gli ingredienti alla lista? Sono {stato.ricetta.ingredienti.length}: scegli
            tu quali.
          </p>
          <div className="genera__scelte">
            <button
              className="bottone"
              type="button"
              onClick={() => setStato({ fase: 'scelta', ricetta: stato.ricetta })}
            >
              Sì, scelgo gli ingredienti
            </button>
            <button className="bottone bottone--discreto" type="button" onClick={() => onSoloSalvata(stato.ricetta)}>
              No, solo salvata
            </button>
          </div>
        </section>
      )

    case 'scelta':
      return (
        <ScegliIngredienti
          ricetta={stato.ricetta}
          lista={lista}
          onAggiungi={(testi) => onAggiungi(stato.ricetta, testi)}
          onAnnulla={() => onSoloSalvata(stato.ricetta)}
        />
      )
  }
}
