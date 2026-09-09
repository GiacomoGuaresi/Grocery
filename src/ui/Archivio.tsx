import { etichettaData, riepilogo, sintesi } from '../domain/archivio'
import { raggruppaPerReparto } from '../domain/lista'
import { eRaggruppata } from '../domain/spunta'
import type { Lista, Voce } from '../domain/tipi'
import { useArchivio } from './useArchivio'
import './Archivio.css'

/**
 * Le spese passate, in sola lettura (F11): un elenco dalla più recente alla
 * più vecchia, e la lista aperta com'era il giorno in cui è stata archiviata.
 * Qui non si spunta e non si modifica niente: quel ciclo è chiuso.
 */
export function Archivio() {
  const { stato, apertura, apri, chiudi } = useArchivio()

  if (apertura.fase === 'aperta') return <ListaArchiviata lista={apertura.lista} onChiudi={chiudi} />
  if (apertura.fase === 'apertura') return <Messaggio testo="Apro la spesa…" />
  if (apertura.fase === 'errore')
    return <Messaggio testo="Non riesco ad aprire questa spesa." errore onChiudi={chiudi} />

  if (stato.fase === 'caricamento') return <Messaggio testo="Apro l'archivio…" />
  if (stato.fase === 'errore') return <Messaggio testo="Non riesco a leggere l'archivio." errore />
  if (stato.liste.length === 0) return <ArchivioVuoto />

  return (
    <section className="archivio" aria-labelledby="archivio-titolo">
      <h2 className="archivio__titolo" id="archivio-titolo">
        Le spese passate
      </h2>
      <ul className="archivio__liste">
        {stato.liste.map((passata) => (
          <li key={passata.id}>
            <button type="button" className="archivio__riga" onClick={() => apri(passata.id)}>
              <span className="archivio__data">{etichettaData(passata.creataIl)}</span>
              <span className="archivio__riepilogo">{riepilogo(passata)}</span>
              <span className="archivio__freccia" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Una spesa passata aperta: le stesse voci per reparto, senza niente da toccare. */
function ListaArchiviata({ lista, onChiudi }: { lista: Lista; onChiudi: () => void }) {
  const gruppi = raggruppaPerReparto(lista.voci)

  return (
    <section className="passata" aria-labelledby="passata-titolo">
      <button type="button" className="passata__indietro" onClick={onChiudi}>
        <span className="passata__freccia" aria-hidden="true" />
        Archivio
      </button>
      <h2 className="passata__titolo" id="passata-titolo">
        {etichettaData(lista.creataIl)}
      </h2>
      <p className="passata__riepilogo">{riepilogo(sintesi(lista))}</p>
      {gruppi.map((gruppo) => (
        <section className="passata__reparto" key={gruppo.id} aria-labelledby={`passata-${gruppo.id}`}>
          <h3 className="passata__reparto-titolo" id={`passata-${gruppo.id}`}>
            {gruppo.nome}
          </h3>
          <ul className="passata__voci">
            {gruppo.voci.map((voce) => (
              <VoceArchiviata key={voce.id} voce={voce} />
            ))}
          </ul>
        </section>
      ))}
      {lista.voci.length === 0 && <p className="archivio__vuoto-testo">Questa spesa è vuota.</p>}
    </section>
  )
}

/** Una voce com'era rimasta: presa o no, coi suoi tipi se è raggruppata. */
function VoceArchiviata({ voce }: { voce: Voce }) {
  return (
    <li className={`passata__voce${voce.comprata ? ' passata__voce--presa' : ''}`}>
      <span className="passata__nome">{voce.nome}</span>
      {eRaggruppata(voce) && (
        <ul className="passata__elementi">
          {voce.elementi.map((elemento) => (
            <li
              key={elemento.nome}
              className={`passata__elemento${elemento.comprato ? ' passata__elemento--preso' : ''}`}
            >
              {elemento.nome}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function ArchivioVuoto() {
  return (
    <section className="archivio-vuoto">
      <p className="archivio-vuoto__icona" aria-hidden="true">
        📚
      </p>
      <h2 className="archivio-vuoto__titolo">Nessuna spesa passata</h2>
      <p className="archivio-vuoto__testo">
        Le liste finiscono qui quando ne generi una nuova: quella di adesso resta
        nella schermata Lista.
      </p>
    </section>
  )
}

function Messaggio({
  testo,
  errore,
  onChiudi,
}: {
  testo: string
  errore?: boolean
  onChiudi?: () => void
}) {
  return (
    <div className="archivio">
      <p className="archivio__messaggio" role={errore ? 'alert' : 'status'}>
        {testo}
      </p>
      {onChiudi && (
        <button type="button" className="passata__indietro" onClick={onChiudi}>
          <span className="passata__freccia" aria-hidden="true" />
          Archivio
        </button>
      )}
    </div>
  )
}
