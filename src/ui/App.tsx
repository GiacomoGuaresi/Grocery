import { useCallback, useState } from 'react'
import { vociDaRiportare } from '../domain/ciclo'
import './tema.css'
import './App.css'
import { DiStagione } from './DiStagione'
import { ConfermaGenera } from './GeneraLista'
import { Icona } from './Icona'
import { Installa } from './Installa'
import { installa, useInstallazione } from './installazione'
import { ListaSpesa } from './ListaSpesa'
import { MenuLaterale } from './MenuLaterale'
import { PianoSettimanale } from './PianoSettimanale'
import { useLista } from './useLista'

/** Le sezioni raggiungibili dal menu laterale (doc/08-ui-ux.md). */
const sezioni = [
  { id: 'lista', etichetta: 'Lista', icona: 'carrello' },
  { id: 'piano', etichetta: 'Piano', icona: 'calendario' },
  { id: 'frutta', etichetta: 'Frutta', icona: 'mela' },
  { id: 'verdura', etichetta: 'Verdura', icona: 'carota' },
] as const

/**
 * Le azioni del menu. "Genera lista" apre la sua conferma a schermo intero e,
 * fatta la scelta (o annullata), riporta alla lista.
 */
const azioni = [
  { id: 'genera', etichetta: 'Genera lista', icona: 'scintille' },
] as const

/**
 * In fondo al menu, finché l'app non è installata. Se il browser ha il suo
 * prompt lo apre e basta; altrimenti porta alle istruzioni (installazione.ts).
 */
const installazione = {
  id: 'installa',
  etichetta: "Installa l'app",
  icona: 'scarica',
} as const

type IdSchermata =
  | (typeof sezioni)[number]['id']
  | (typeof azioni)[number]['id']
  | typeof installazione.id

export function App() {
  const [schermata, setSchermata] = useState<IdSchermata>('lista')
  const [menuAperto, setMenuAperto] = useState(false)
  // La lista sta qui e non dentro la sua schermata: la usa anche "Genera lista".
  const lista = useLista()
  const statoInstallazione = useInstallazione()

  const chiudiMenu = useCallback(() => setMenuAperto(false), [])

  const vai = (id: IdSchermata) => {
    setMenuAperto(false)
    if (id === 'installa' && statoInstallazione === 'pronta') {
      void installa()
      return
    }
    setSchermata(id)
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
          <Icona nome="menu" />
        </button>
        <div className="app__titoli">
          <Icona nome="cesto" className="app__logo" />
          <h1 className="app__titolo">Grocery</h1>
        </div>
      </header>
      <MenuLaterale
        aperto={menuAperto}
        sezioni={sezioni}
        azioni={azioni}
        piede={statoInstallazione === 'installata' ? [] : [installazione]}
        corrente={schermata}
        onVai={vai}
        onChiudi={chiudiMenu}
      />
      <main className="app__contenuto">
        {schermata === 'lista' && <ListaSpesa {...lista} />}
        {schermata === 'piano' && <PianoSettimanale />}
        {schermata === 'frutta' && <DiStagione gruppo="frutta" />}
        {schermata === 'verdura' && <DiStagione gruppo="verdura" />}
        {schermata === 'installa' && <Installa stato={statoInstallazione} />}
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
