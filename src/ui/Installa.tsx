import { piattaforma, type Piattaforma, type StatoInstallazione } from './installazione'
import './Installa.css'

/** Come si installa a mano, dove il browser non dà il suo prompt. */
const istruzioni: Record<Piattaforma, string[]> = {
  ios: [
    'Apri la pagina con Safari.',
    'Tocca il tasto Condividi, il quadrato con la freccia in su.',
    'Scorri e scegli “Aggiungi alla schermata Home”.',
    'Conferma con “Aggiungi”.',
  ],
  android: [
    'Apri la pagina con Chrome.',
    'Tocca il menu ⋮ in alto a destra.',
    'Scegli “Installa app” (o “Aggiungi a schermata Home”).',
    'Conferma con “Installa”.',
  ],
  desktop: [
    'Apri la pagina con Chrome o Edge.',
    'Clicca l’icona di installazione a destra nella barra degli indirizzi, oppure menu ⋮ → “Installa Grocery”.',
    'Su Safari per Mac: menu File → “Aggiungi al Dock”.',
  ],
}

/**
 * La schermata "Installa l'app": ci si arriva dal menu quando il browser non
 * può installare con un tocco (installazione.ts).
 */
export function Installa({ stato }: { stato: StatoInstallazione }) {
  if (stato === 'installata') {
    return (
      <section className="installa">
        <h2 className="installa__titolo">L'app è installata</h2>
        <p className="installa__testo">
          Aprila dalla schermata Home: parte a schermo intero e funziona anche senza rete.
        </p>
      </section>
    )
  }

  const passi = istruzioni[piattaforma(navigator.userAgent, navigator.maxTouchPoints)]
  return (
    <section className="installa">
      <h2 className="installa__titolo">Mettila sulla schermata Home</h2>
      <p className="installa__testo">
        Installata si apre a schermo intero, come un'app, e funziona anche senza rete.
      </p>
      <ol className="installa__passi">
        {passi.map((passo) => (
          <li key={passo}>{passo}</li>
        ))}
      </ol>
    </section>
  )
}
