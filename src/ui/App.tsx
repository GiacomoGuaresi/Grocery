import { useCallback, useState } from 'react'
import { vociDaRiportare } from '../domain/ciclo'
import './tema.css'
import './App.css'
import { Archivio } from './Archivio'
import { ConfermaGenera } from './GeneraLista'
import { ListaSpesa } from './ListaSpesa'
import { MenuLaterale } from './MenuLaterale'
import { PianoSettimanale } from './PianoSettimanale'
import { useLista } from './useLista'

/** Le sezioni raggiungibili dal menu laterale (doc/08-ui-ux.md). */
const sezioni = [
  { id: 'lista', etichetta: 'Lista', sottotitolo: 'Lista della spesa', icona: '🛒' },
  { id: 'piano', etichetta: 'Piano', sottotitolo: 'Piano settimanale', icona: '📅' },
  { id: 'archivio', etichetta: 'Archivio', sottotitolo: 'Spese passate', icona: '🗂️' },
] as const

/**
 * Le azioni del menu. "Genera lista" apre la sua conferma a schermo intero e,
 * fatta la scelta (o annullata), riporta alla lista.
 */
const azioni = [
  { id: 'genera', etichetta: 'Genera lista', sottotitolo: 'Nuova lista', icona: '✨' },
] as const

type IdSchermata = (typeof sezioni)[number]['id'] | (typeof azioni)[number]['id']

export function App() {
  const [schermata, setSchermata] = useState<IdSchermata>('lista')
  const [menuAperto, setMenuAperto] = useState(false)
  // La lista sta qui e non dentro la sua schermata: la usa anche "Genera lista".
  const lista = useLista()

  const corrente = [...sezioni, ...azioni].find((s) => s.id === schermata) ?? sezioni[0]
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])

  const vai = (id: IdSchermata) => {
    setSchermata(id)
    setMenuAperto(false)
  }

  return (
    <div className="app">
      <header className="app__intestazione">
        <button
          className="app__menu-apri"
          type="button"
          aria-label="Apri il menu"
          aria-expanded={menuAperto}
          aria-controls="menu"
          onClick={() => setMenuAperto(true)}
        >
          <span className="app__hamburger" aria-hidden="true" />
        </button>
        <div className="app__titoli">
          <h1 className="app__titolo">Grocery</h1>
          <p className="app__sottotitolo">{corrente.sottotitolo}</p>
        </div>
      </header>
      <MenuLaterale
        aperto={menuAperto}
        sezioni={sezioni}
        azioni={azioni}
        corrente={schermata}
        onVai={vai}
        onChiudi={chiudiMenu}
      />
      <main className="app__contenuto">
        {schermata === 'lista' && <ListaSpesa {...lista} />}
        {schermata === 'piano' && <PianoSettimanale />}
        {schermata === 'archivio' && <Archivio />}
        {schermata === 'genera' && lista.stato.fase === 'pronta' && (
          <ConfermaGenera
            rimaste={vociDaRiportare(lista.stato.lista)}
            onGenera={(portaAvanti) => {
              lista.genera(portaAvanti)
              vai('lista')
            }}
            onAnnulla={() => vai('lista')}
          />
        )}
      </main>
    </div>
  )
}
