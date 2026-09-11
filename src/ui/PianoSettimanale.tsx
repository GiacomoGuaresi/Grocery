import { giornoDellaSettimana, pianoSettimanale } from '../domain/piano'
import './PianoSettimanale.css'

/**
 * Vista di consultazione: la tabella delle cene, un giorno per riga, col giorno
 * corrente evidenziato. Solo la categoria, mai la tipologia (doc/08-ui-ux.md):
 * quale pesce si mangi mercoledì lo si decide con quello che c'è in casa.
 */
export function PianoSettimanale() {
  const piano = pianoSettimanale()
  const oggi = giornoDellaSettimana()

  return (
    <section className="piano" aria-labelledby="piano-titolo">
      <h2 className="piano__titolo" id="piano-titolo">
        Le cene della settimana
      </h2>
      <ul className="piano__giorni">
        {piano.map((giorno) => {
          const eOggi = giorno.giorno === oggi
          return (
            <li
              key={giorno.giorno}
              className={`piano__giorno${eOggi ? ' piano__giorno--oggi' : ''}`}
              aria-current={eOggi ? 'date' : undefined}
            >
              <span className="piano__nome">{giorno.etichetta}</span>
              <span className="piano__categoria">{giorno.etichettaCategoria}</span>
            </li>
          )
        })}
      </ul>
      <p className="piano__nota">
        Ogni cena è fonte proteica, verdura e pane. La tipologia la scegli tu tra
        quello che hai in casa.
      </p>
    </section>
  )
}
