import { useRef, useState } from 'react'
import { suggerimenti } from '../domain/aggiunta'
import type { Voce } from '../domain/tipi'
import './AggiungiVoce.css'

interface Props {
  /** Aggiunge alla lista il prodotto scritto o scelto tra i suggerimenti. */
  onAggiungi: (nome: string) => void
  /** La voce della lista con questo nome, se c'è già. */
  giaPresente: (nome: string) => Voce | undefined
}

const QUANTI_SUGGERIMENTI = 6

/**
 * Aggiunta rapida, sempre a portata di pollice in fondo alla schermata: serve
 * anche mentre si è in corsia (doc/08-ui-ux.md). Mentre si scrive compaiono i
 * prodotti del catalogo che combaciano, senza badare a maiuscole e accenti;
 * toccarne uno lo aggiunge subito, col suo reparto. Quello che non è in
 * catalogo si aggiunge lo stesso e finisce in "Altro".
 *
 * Le voci non si ripetono: se quella scritta è già da prendere non si aggiunge
 * e compare un avviso; se era già presa torna da prendere.
 */
export function AggiungiVoce({ onAggiungi, giaPresente }: Props) {
  const [testo, setTesto] = useState('')
  const [avviso, setAvviso] = useState<string | null>(null)
  const campo = useRef<HTMLInputElement>(null)
  const proposte = suggerimenti(testo, QUANTI_SUGGERIMENTI)

  const aggiungi = (nome: string) => {
    if (nome.trim() === '') return
    const presente = giaPresente(nome)
    setAvviso(presente && !presente.comprata ? `“${presente.nome}” è già nella lista` : null)
    onAggiungi(nome)
    setTesto('')
    campo.current?.focus()
  }

  return (
    <div className="aggiungi">
      {proposte.length > 0 && (
        <ul className="aggiungi__proposte">
          {proposte.map((prodotto) => (
            <li key={prodotto.nome}>
              <button
                className="aggiungi__proposta"
                type="button"
                onClick={() => aggiungi(prodotto.nome)}
              >
                {prodotto.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
      {avviso && (
        <p className="aggiungi__avviso" role="status">
          {avviso}
        </p>
      )}
      <form
        className="aggiungi__riga"
        onSubmit={(evento) => {
          evento.preventDefault()
          aggiungi(testo)
        }}
      >
        <input
          className="aggiungi__campo"
          ref={campo}
          type="text"
          value={testo}
          onChange={(evento) => {
            setTesto(evento.target.value)
            setAvviso(null)
          }}
          placeholder="Aggiungi un prodotto"
          aria-label="Aggiungi un prodotto"
          autoComplete="off"
          enterKeyHint="done"
        />
        <button className="aggiungi__bottone" type="submit" disabled={testo.trim() === ''}>
          Aggiungi
        </button>
      </form>
    </div>
  )
}
