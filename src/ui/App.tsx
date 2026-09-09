import './tema.css'
import './App.css'
import { ListaSpesa } from './ListaSpesa'

export function App() {
  return (
    <div className="app">
      <header className="app__intestazione">
        <h1 className="app__titolo">Grocery</h1>
        <p className="app__sottotitolo">Lista della spesa</p>
      </header>
      <main className="app__contenuto">
        <ListaSpesa />
      </main>
    </div>
  )
}
