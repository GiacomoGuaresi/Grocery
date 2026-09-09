import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'

const radice = document.getElementById('root')
if (!radice) throw new Error('Manca #root in index.html')

createRoot(radice).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
