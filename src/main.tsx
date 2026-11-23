import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { ConAccesso } from './ui/ConAccesso'
import { PopupAggiornamento } from './ui/PopupAggiornamento'

const radice = document.getElementById('root')
if (!radice) throw new Error('Manca #root in index.html')

createRoot(radice).render(
  <StrictMode>
    {/* Fuori dall'accesso: una versione nuova si offre anche dalla schermata d'ingresso. */}
    <PopupAggiornamento />
    <ConAccesso>
      <App />
    </ConAccesso>
  </StrictMode>,
)
