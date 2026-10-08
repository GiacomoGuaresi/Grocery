import { useState } from 'react'
import { aggiungiIngredienti, categorieRicette, filtraRicette } from '../domain/ricette'
import type { Ricetta } from '../domain/tipi'
import { AzioniRicetta } from './AzioniRicetta'
import { Icona } from './Icona'
import { ImportaRicetta } from './ImportaRicetta'
import { usePressioneLunga } from './pressioneLunga'
import { ScegliIngredienti } from './ScegliIngredienti'
import { SchedaRicetta } from './SchedaRicetta'
import type { ListaPersistita } from './useLista'
import type { RicettePersistite } from './useRicette'
import './Ricette.css'

/**
 * Dove si è nella sezione: l'elenco, una ricetta, la scelta dei suoi
 * ingredienti (aperta dalla scheda o dall'elenco, dove si torna annullando), o
 * l'import di un link.
 */
export type VistaRicette =
  | { vista: 'elenco' }
  | { vista: 'scheda'; id: string }
  | { vista: 'scelta'; id: string; da: 'elenco' | 'scheda' }
  | { vista: 'importa'; testo: string }

interface Props {
  ricette: RicettePersistite
  lista: ListaPersistita
  vista: VistaRicette
  onVista: (vista: VistaRicette) => void
  /** Gli ingredienti sono entrati nella lista: si torna lì. */
  onAggiunti: () => void
}

/**
 * La sezione Ricette (doc/14-piano-ricette.md): le ricette importate da un link,
 * condiviso verso l'app da Android o incollato qui. Da una ricetta gli
 * ingredienti scelti vanno nella lista, sotto il suo nome.
 */
export function Ricette({ ricette, lista, vista, onVista, onAggiunti }: Props) {
  const listaPronta = lista.stato.fase === 'pronta' ? lista.stato.lista : null

  const aggiungi = (ricetta: Ricetta, testi: string[]) => {
    lista.modifica((corrente) => aggiungiIngredienti(corrente, ricetta, testi))
    onAggiunti()
  }

  if (vista.vista === 'importa') {
    return (
      <ImportaRicetta
        testo={vista.testo}
        importa={ricette.importa}
        lista={listaPronta}
        onAggiungi={aggiungi}
        onSoloSalvata={(ricetta) => onVista({ vista: 'scheda', id: ricetta.id })}
        onChiudi={() => onVista({ vista: 'elenco' })}
      />
    )
  }

  if (vista.vista === 'scheda' || vista.vista === 'scelta') {
    const ricetta = ricette.ricette.find((r) => r.id === vista.id)
    if (ricetta && vista.vista === 'scelta') {
      return (
        <ScegliIngredienti
          key={ricetta.id}
          ricetta={ricetta}
          lista={listaPronta}
          onAggiungi={(testi) => aggiungi(ricetta, testi)}
          onAnnulla={() =>
            onVista(vista.da === 'scheda' ? { vista: 'scheda', id: ricetta.id } : { vista: 'elenco' })
          }
        />
      )
    }
    if (ricetta) {
      return (
        <SchedaRicetta
          key={ricetta.id}
          ricetta={ricetta}
          onScegli={() => onVista({ vista: 'scelta', id: ricetta.id, da: 'scheda' })}
          elimina={ricette.elimina}
          onIndietro={() => onVista({ vista: 'elenco' })}
        />
      )
    }
    // Eliminata, o non ancora arrivata dal database: si resta sull'elenco.
    if (!ricette.inLettura) {
      return <Elenco ricette={ricette} onVista={onVista} avviso="Questa ricetta non c’è più." />
    }
  }

  return <Elenco ricette={ricette} onVista={onVista} />
}

function Elenco({
  ricette: { ricette, inLettura, nonAggiornate, elimina },
  onVista,
  avviso,
}: {
  ricette: RicettePersistite
  onVista: (vista: VistaRicette) => void
  avviso?: string
}) {
  const [cercato, setCercato] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [link, setLink] = useState('')
  // La ricetta di cui è aperto il popup delle azioni.
  const [azioniDi, setAzioniDi] = useState<string | null>(null)
  const ricettaAzioni = ricette.find((r) => r.id === azioniDi) ?? null

  const categorie = categorieRicette(ricette)
  const trovate = filtraRicette(ricette, cercato, categoria)

  return (
    <section className="ricette" aria-label="Ricette">
      <form
        className="ricette__incolla"
        onSubmit={(evento) => {
          evento.preventDefault()
          if (link.trim() === '') return
          onVista({ vista: 'importa', testo: link.trim() })
          setLink('')
        }}
      >
        <label className="ricette__etichetta" htmlFor="ricette-link">
          Importa da un link
        </label>
        <div className="aggiungi__riga">
          <input
            id="ricette-link"
            className="aggiungi__campo"
            type="url"
            inputMode="url"
            placeholder="Incolla il link della ricetta"
            value={link}
            onChange={(evento) => setLink(evento.target.value)}
            autoComplete="off"
            enterKeyHint="go"
          />
          <button className="aggiungi__bottone" type="submit" disabled={link.trim() === ''}>
            Importa
          </button>
        </div>
        <p className="ricette__suggerimento">
          Oppure dal sito o dall’app della ricetta: Condividi → Grocery.
        </p>
      </form>

      {avviso && (
        <p className="ricette__avviso" role="status">
          {avviso}
        </p>
      )}
      {nonAggiornate && (
        <p className="lista__rete" role="status">
          Senza rete. Le ricette sono quelle salvate qui.
        </p>
      )}

      {ricette.length > 0 && (
        <>
          <div className="ricette__cerca">
            <Icona nome="cerca" className="ricette__cerca-icona" />
            <input
              className="aggiungi__campo ricette__cerca-campo"
              type="search"
              placeholder="Cerca una ricetta"
              aria-label="Cerca una ricetta"
              value={cercato}
              onChange={(evento) => setCercato(evento.target.value)}
              autoComplete="off"
            />
          </div>

          {categorie.length > 1 && (
            <div className="ricette__categorie" role="group" aria-label="Categoria">
              <button
                type="button"
                className="stagione__mese"
                aria-pressed={categoria === null}
                onClick={() => setCategoria(null)}
              >
                Tutte
              </button>
              {categorie.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="stagione__mese"
                  aria-pressed={categoria === c}
                  onClick={() => setCategoria(categoria === c ? null : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {ricette.length === 0 ? (
        <p className="ricette__vuoto">
          {inLettura ? 'Apro le ricette…' : 'Nessuna ricetta salvata. Condividi un link per iniziare.'}
        </p>
      ) : trovate.length === 0 ? (
        <p className="ricette__vuoto">Nessuna ricetta trovata.</p>
      ) : (
        <ul className="ricette__elenco">
          {trovate.map((ricetta) => (
            <CardRicetta
              key={ricetta.id}
              ricetta={ricetta}
              onApri={() => onVista({ vista: 'scheda', id: ricetta.id })}
              onAzioni={() => setAzioniDi(ricetta.id)}
            />
          ))}
        </ul>
      )}

      {ricettaAzioni && (
        <AzioniRicetta
          ricetta={ricettaAzioni}
          elimina={elimina}
          onAggiungi={() => onVista({ vista: 'scelta', id: ricettaAzioni.id, da: 'elenco' })}
          onEliminata={() => {}}
          onChiudi={() => setAzioniDi(null)}
        />
      )}
    </section>
  )
}

/**
 * Una card dell'elenco: il tocco apre la scheda; il ⋯ a lato, o la pressione
 * lunga sulla card, il popup delle azioni, come per le voci della lista.
 * Niente swipe: eliminare una ricetta non si annulla.
 */
function CardRicetta({
  ricetta,
  onApri,
  onAzioni,
}: {
  ricetta: Ricetta
  onApri: () => void
  onAzioni: () => void
}) {
  const pressioneLunga = usePressioneLunga(onAzioni)

  return (
    <li className="ricetta">
      <button className="ricetta__apri" type="button" onClick={onApri} {...pressioneLunga}>
        {ricetta.immagine ? (
          <img
            className="ricetta__foto"
            src={ricetta.immagine}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="ricetta__foto ricetta__foto--vuota" aria-hidden="true">
            <Icona nome="libro" />
          </span>
        )}
        <span className="ricetta__testo">
          <span className="ricetta__nome">{ricetta.nome}</span>
          <span className="ricetta__dettagli">
            {[...ricetta.categorie.slice(0, 2), `${ricetta.ingredienti.length} ingredienti`].join(' · ')}
          </span>
        </span>
      </button>
      <button
        className="ricetta__azioni-apri"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Azioni per ${ricetta.nome}`}
        onClick={onAzioni}
      >
        <Icona nome="altro" />
      </button>
    </li>
  )
}
