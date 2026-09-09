import { useRef, useState } from 'react'
import { suggerimenti } from '../domain/aggiunta'
import './AggiungiVoce.css'

interface Props {
  /** Aggiunge alla lista il prodotto scritto o scelto tra i suggerimenti. */
  onAggiungi: (nome: string) => void
}

const QUANTI_SUGGERIMENTI = 6

/**
 * Aggiunta rapida, sempre a portata di pollice in fondo alla schermata: serve
 * anche mentre si è in corsia (doc/08-ui-ux.md). Mentre si scrive compaiono i
 * prodotti del catalogo che combaciano, senza badare a maiuscole e accenti;
 * toccarne uno lo aggiunge subito, col suo reparto. Quello che non è in
 * catalogo si aggiunge lo stesso e finisce in "Altro".
 */
export function AggiungiVoce({ onAggiungi }: Props) {
  const [testo, setTesto] = useState('')
  const campo = useRef<HTMLInputElement>(null)
  const proposte = suggerimenti(testo, QUANTI_SUGGERIMENTI)

  const aggiungi = (nome: string) => {
    if (nome.trim() === '') return
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
          onChange={(evento) => setTesto(evento.target.value)}
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
