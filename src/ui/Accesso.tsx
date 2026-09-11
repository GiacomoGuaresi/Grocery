import { useState, type FormEvent } from 'react'
import type { EsitoAccesso } from '../storage'
import { Icona } from './Icona'
import './tema.css'
import './Accesso.css'

const avvisi: Record<Exclude<EsitoAccesso, 'dentro'>, string> = {
  'passphrase-sbagliata': 'Passphrase sbagliata.',
  errore: 'Non riesco a entrare: controlla la connessione e riprova.',
}

interface Props {
  onEntra: (passphrase: string) => Promise<EsitoAccesso>
}

/**
 * La schermata d'accesso (doc/08, §1): il solo campo passphrase. Si vede una
 * volta per dispositivo, poi la sessione resta nei cookie.
 */
export function Accesso({ onEntra }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState<string | null>(null)

  const invia = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!passphrase || inCorso) return
    setInCorso(true)
    setAvviso(null)
    const esito = await onEntra(passphrase)
    // Se si è entrati questa schermata sparisce: non c'è altro da fare.
    if (esito === 'dentro') return
    setAvviso(avvisi[esito])
    setInCorso(false)
  }

  return (
    <main className="accesso">
      <form className="accesso__modulo" onSubmit={invia}>
        <Icona nome="cesto" className="accesso__icona" />
        <h1 className="accesso__titolo">Grocery</h1>
        <label className="accesso__etichetta" htmlFor="passphrase">
          Passphrase
        </label>
        <input
          id="passphrase"
          className="accesso__campo"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={passphrase}
          onChange={(evento) => {
            setPassphrase(evento.target.value)
            setAvviso(null)
          }}
        />
        {avviso && (
          <p className="accesso__avviso" role="alert">
            {avviso}
          </p>
        )}
        <button className="bottone" type="submit" disabled={!passphrase || inCorso}>
          {inCorso ? 'Entro…' : 'Entra'}
        </button>
      </form>
    </main>
  )
}

/** Quando non si riesce nemmeno a chiedere la passphrase (configurazione mancante). */
export function AccessoImpossibile() {
  return (
    <main className="accesso">
      <p className="accesso__messaggio" role="alert">
        Non riesco a collegarmi al database condiviso.
      </p>
    </main>
  )
}
