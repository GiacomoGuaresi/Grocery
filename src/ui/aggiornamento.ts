import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { COMMIT, versioneNuova } from './versione'

/** Ogni quanto si ricontrolla con l'app aperta; in più, a ogni ritorno sulla scheda. */
const OGNI_MS = 30 * 60 * 1000

/** Il commit pubblicato adesso, letto da versione.json scavalcando ogni cache. */
async function commitPubblicato(): Promise<string | undefined> {
  try {
    const risposta = await fetch(`${import.meta.env.BASE_URL}versione.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!risposta.ok) return undefined
    const dati: unknown = await risposta.json()
    const commit = (dati as { commit?: unknown } | null)?.commit
    return typeof commit === 'string' ? commit : undefined
  } catch {
    return undefined
  }
}

/**
 * Ricarica senza cache: via il service worker e le sue copie, la pagina
 * riletta dalla rete. Serve quando versione.json dice che c'è di nuovo ma il
 * service worker non l'ha ancora visto.
 */
async function ricaricaSenzaCache(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrazioni = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrazioni.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const nomi = await caches.keys()
      await Promise.all(nomi.map((nome) => caches.delete(nome)))
    }
    // Anche la cache HTTP del browser: l'index.html si rilegge dal server.
    await fetch(location.href, { cache: 'reload' })
  } catch {
    // Si ricarica comunque.
  } finally {
    location.reload()
  }
}

/**
 * Se è uscita una versione nuova dell'app: lo dice il service worker (una
 * nuova shell in attesa) o versione.json (un altro commit). `aggiorna` passa
 * alla nuova, `rimanda` tace fino alla versione dopo.
 */
export function useAggiornamento() {
  const registrazione = useRef<ServiceWorkerRegistration | undefined>(undefined)
  const [pubblicato, setPubblicato] = useState<string>()
  const [rimandata, setRimandata] = useState<string>()

  const {
    needRefresh: [inAttesa],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      registrazione.current = r
    },
  })

  useEffect(() => {
    if (import.meta.env.DEV) return
    const controlla = () => {
      registrazione.current?.update().catch(() => {})
      void commitPubblicato().then((commit) => {
        if (commit) setPubblicato(commit)
      })
    }
    const tornata = () => {
      if (document.visibilityState === 'visible') controlla()
    }
    controlla()
    const ogni = setInterval(controlla, OGNI_MS)
    document.addEventListener('visibilitychange', tornata)
    return () => {
      clearInterval(ogni)
      document.removeEventListener('visibilitychange', tornata)
    }
  }, [])

  const nuova = inAttesa || versioneNuova(pubblicato, COMMIT)
  const quale = pubblicato ?? 'service-worker'

  const aggiorna = useCallback(() => {
    if (inAttesa) void updateServiceWorker(true)
    else void ricaricaSenzaCache()
  }, [inAttesa, updateServiceWorker])

  const rimanda = useCallback(() => setRimandata(quale), [quale])

  return { disponibile: nuova && rimandata !== quale, aggiorna, rimanda }
}
