import { useCallback, useState } from 'react'
import { vociDaRiportare } from '../domain/generazione'
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
import { Ricette, type VistaRicette } from './Ricette'
import { useLista } from './useLista'
import { useRicette } from './useRicette'

/** Le sezioni raggiungibili dal menu laterale (doc/08-ui-ux.md). */
const sezioni = [
  { id: 'lista', etichetta: 'Lista', icona: 'carrello' },
  { id: 'piano', etichetta: 'Piano', icona: 'calendario' },
  { id: 'ricette', etichetta: 'Ricette', icona: 'libro' },
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

/**
 * Il link condiviso verso l'app (doc/14): con la PWA installata su Android il
 * menu "Condividi" la apre con il link nei parametri dell'URL (`share_target`
 * nel manifest, vite.config.ts). Si legge una volta sola, all'avvio, e si toglie
 * dall'URL, così un refresh non lo importa di nuovo. Se serve la passphrase,
 * aspetta qui che si entri.
 */
const condivisa = leggiCondivisione()

function leggiCondivisione(): string | null {
  if (typeof window === 'undefined') return null
  const parametri = new URLSearchParams(window.location.search)
  const testo = ['titolo', 'testo', 'link']
    .map((nome) => parametri.get(nome)?.trim() ?? '')
    .filter((parte) => parte !== '')
    .join(' ')
  if (parametri.has('titolo') || parametri.has('testo') || parametri.has('link'))
    window.history.replaceState(null, '', window.location.pathname)
  return testo === '' ? null : testo
}

type IdSchermata =
  | (typeof sezioni)[number]['id']
  | (typeof azioni)[number]['id']
  | typeof installazione.id

export function App() {
  const [schermata, setSchermata] = useState<IdSchermata>(condivisa ? 'ricette' : 'lista')
  const [vistaRicette, setVistaRicette] = useState<VistaRicette>(
    condivisa ? { vista: 'importa', testo: condivisa } : { vista: 'elenco' },
  )
  const [menuAperto, setMenuAperto] = useState(false)
  // La lista sta qui e non dentro la sua schermata: la usano anche "Genera
  // lista" e le Ricette, che ci aggiungono gli ingredienti.
  const lista = useLista()
  const ricette = useRicette()
  const statoInstallazione = useInstallazione()

  const chiudiMenu = useCallback(() => setMenuAperto(false), [])

  const vai = (id: IdSchermata) => {
    setMenuAperto(false)
    if (id === 'installa' && statoInstallazione === 'pronta') {
      void installa()
      return
    }
    // Dal menu le Ricette si aprono sempre sull'elenco.
    if (id === 'ricette') setVistaRicette({ vista: 'elenco' })
    setSchermata(id)
  }

  const apriRicetta = (id: string) => {
    setVistaRicette({ vista: 'scheda', id })
    setSchermata('ricette')
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
        {schermata === 'lista' && <ListaSpesa {...lista} onApriRicetta={apriRicetta} />}
        {schermata === 'piano' && <PianoSettimanale />}
        {schermata === 'frutta' && <DiStagione gruppo="frutta" />}
        {schermata === 'verdura' && <DiStagione gruppo="verdura" />}
        {schermata === 'ricette' && (
          <Ricette
            ricette={ricette}
            lista={lista}
            vista={vistaRicette}
            onVista={setVistaRicette}
            onAggiunti={() => {
              setVistaRicette({ vista: 'elenco' })
              setSchermata('lista')
            }}
          />
        )}
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
