import { useState } from 'react'
import './tema.css'
import './App.css'
import { Archivio } from './Archivio'
import { ListaSpesa } from './ListaSpesa'
import { PianoSettimanale } from './PianoSettimanale'

/** Le schermate raggiungibili dalla barra in alto (doc/08-ui-ux.md). */
const schermate = [
  { id: 'lista', etichetta: 'Lista', sottotitolo: 'Lista della spesa' },
  { id: 'piano', etichetta: 'Piano', sottotitolo: 'Piano settimanale' },
  { id: 'archivio', etichetta: 'Archivio', sottotitolo: 'Spese passate' },
] as const

type IdSchermata = (typeof schermate)[number]['id']

export function App() {
  const [schermata, setSchermata] = useState<IdSchermata>('lista')
  const corrente = schermate.find((s) => s.id === schermata) ?? schermate[0]

  return (
    <div className="app">
      <div className="app__testata">
        <header className="app__intestazione">
          <h1 className="app__titolo">Grocery</h1>
          <p className="app__sottotitolo">{corrente.sottotitolo}</p>
        </header>
        <nav className="app__navigazione" aria-label="Schermate">
          {schermate.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`app__scheda${s.id === schermata ? ' app__scheda--attiva' : ''}`}
              aria-current={s.id === schermata ? 'page' : undefined}
              onClick={() => setSchermata(s.id)}
            >
              {s.etichetta}
            </button>
          ))}
        </nav>
      </div>
      <main className="app__contenuto">
        {schermata === 'lista' && <ListaSpesa />}
        {schermata === 'piano' && <PianoSettimanale />}
        {schermata === 'archivio' && <Archivio />}
      </main>
    </div>
  )
}
