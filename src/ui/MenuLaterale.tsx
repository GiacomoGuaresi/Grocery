import { useEffect, useRef } from 'react'
import './MenuLaterale.css'

export interface VoceMenu<Id extends string> {
  id: Id
  etichetta: string
  icona: string
}

interface Props<Id extends string> {
  aperto: boolean
  /** Le schermate dell'app. */
  sezioni: readonly VoceMenu<Id>[]
  /** Le azioni, sotto le sezioni e staccate da loro. */
  azioni: readonly VoceMenu<Id>[]
  corrente: Id
  onVai: (id: Id) => void
  onChiudi: () => void
}

/**
 * Il menu laterale a scomparsa: le sezioni dell'app e, sotto, le azioni
 * (doc/08-ui-ux.md). Resta sempre montato e scivola dentro da sinistra; si
 * chiude toccando fuori, con la X o con Esc. Da aperto la pagina sotto non
 * scorre, e alla chiusura il fuoco torna dov'era.
 */
export function MenuLaterale<Id extends string>({
  aperto,
  sezioni,
  azioni,
  corrente,
  onVai,
  onChiudi,
}: Props<Id>) {
  const pannello = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!aperto) return
    const prima = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const voci = pannello.current
    ;(
      voci?.querySelector<HTMLElement>('[aria-current="page"]') ??
      voci?.querySelector<HTMLElement>('.menu__voce')
    )?.focus()

    const esc = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onChiudi()
    }
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
      prima?.focus()
    }
  }, [aperto, onChiudi])

  const voce = (v: VoceMenu<Id>, azione = false) => (
    <li key={v.id}>
      <button
        className={azione ? 'menu__voce menu__voce--azione' : 'menu__voce'}
        type="button"
        aria-current={v.id === corrente ? 'page' : undefined}
        onClick={() => onVai(v.id)}
      >
        <span className="menu__icona" aria-hidden="true">
          {v.icona}
        </span>
        {v.etichetta}
      </button>
    </li>
  )

  return (
    <>
      <div
        className={aperto ? 'menu-velo menu-velo--aperto' : 'menu-velo'}
        aria-hidden="true"
        onClick={onChiudi}
      />
      <nav
        id="menu"
        ref={pannello}
        className={aperto ? 'menu menu--aperto' : 'menu'}
        aria-label="Menu"
      >
        <div className="menu__testata">
          <span className="menu__titolo">Grocery</span>
          <button
            className="menu__chiudi"
            type="button"
            aria-label="Chiudi il menu"
            onClick={onChiudi}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <ul className="menu__gruppo">{sezioni.map((v) => voce(v))}</ul>
        <hr className="menu__separatore" />
        <ul className="menu__gruppo">{azioni.map((v) => voce(v, true))}</ul>
      </nav>
    </>
  )
}
