import { useSyncExternalStore } from 'react'

/**
 * Installare l'app sulla schermata Home (Step 16). Chrome, Edge e Android
 * annunciano che si può con `beforeinstallprompt`: l'evento si tiene da parte
 * e il suo prompt lo apre la voce "Installa l'app" del menu. Il browser non
 * mostra più popup da solo (su desktop c'è solo un'icona nella barra degli
 * indirizzi, su iOS nulla), quindi senza la voce l'installazione non si trova.
 *
 * Dove l'evento non arriva (Safari, iOS, Firefox, o Chrome che non ha ancora
 * deciso) la voce apre invece le istruzioni per farlo a mano.
 *
 * L'ascolto parte quando il modulo viene caricato, prima che React monti:
 * l'evento può arrivare subito all'apertura, e dopo non si ripete.
 */

/** L'evento non standard di Chrome: non è nei tipi del DOM. */
interface EventoInstallazione extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * `installata`: l'app è già aperta dalla schermata Home.
 * `pronta`: il browser ha dato il suo prompt, basta un tocco.
 * `manuale`: si installa dal menu del browser, seguendo le istruzioni.
 */
export type StatoInstallazione = 'installata' | 'pronta' | 'manuale'

export type Piattaforma = 'ios' | 'android' | 'desktop'

/** Da quale sistema si arriva, per scegliere le istruzioni giuste. */
export function piattaforma(userAgent: string, puntiTocco = 0): Piattaforma {
  // iPadOS si presenta come un Mac: lo tradisce lo schermo touch.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && puntiTocco > 1)) {
    return 'ios'
  }
  if (/Android/.test(userAgent)) return 'android'
  return 'desktop'
}

let evento: EventoInstallazione | null = null
let installata = false
const ascoltatori = new Set<() => void>()
const avvisa = () => ascoltatori.forEach((ascolta) => ascolta())

if (typeof window !== 'undefined') {
  installata =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  window.addEventListener('beforeinstallprompt', (e) => {
    // Niente mini-barra di Chrome in basso: si installa dalla voce del menu.
    e.preventDefault()
    evento = e as EventoInstallazione
    avvisa()
  })
  window.addEventListener('appinstalled', () => {
    installata = true
    evento = null
    avvisa()
  })
}

function stato(): StatoInstallazione {
  if (installata) return 'installata'
  return evento ? 'pronta' : 'manuale'
}

function iscriviti(ascolta: () => void) {
  ascoltatori.add(ascolta)
  return () => ascoltatori.delete(ascolta)
}

export function useInstallazione(): StatoInstallazione {
  return useSyncExternalStore(iscriviti, stato, () => 'manuale')
}

/**
 * Apre il prompt del browser. Si può aprire una volta sola: se lo si rifiuta,
 * da lì in poi la voce mostra le istruzioni, finché Chrome non ne ridà uno.
 */
export async function installa(): Promise<void> {
  const e = evento
  if (!e) return
  evento = null
  avvisa()
  await e.prompt()
  await e.userChoice
}
