import { aggiungiVoce, voceGiaPresente } from '../domain/aggiunta'
import { alternativeVoce, sostituisciVoce } from '../domain/alternative'
import { raggruppaPerReparto, vociAttive, vociComprate } from '../domain/lista'
import { eliminaVoce, rinominaVoce } from '../domain/modifica'
import { despuntaVoce, spuntaVoce } from '../domain/spunta'
import type { Voce as VoceLista } from '../domain/tipi'
import { AggiungiVoce } from './AggiungiVoce'
import { GeneraLista } from './GeneraLista'
import { GiaPresi } from './GiaPresi'
import { GruppoReparto } from './GruppoReparto'
import { Icona } from './Icona'
import type { ListaPersistita } from './useLista'
import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa, raggruppata per reparto, con la
 * spunta e la sezione "Già presi" in fondo. In fondo, sempre raggiungibile,
 * il campo di aggiunta rapida; il ciclo nuovo si apre dal menu laterale. La
 * lista la tiene App (useLista), perché serve anche a "Genera lista": arriva
 * dallo storage e ogni modifica ci torna, così resta anche dopo un refresh.
 */
export function ListaSpesa({ stato, modifica, genera, inAttesa, senzaRete }: ListaPersistita) {
  if (stato.fase === 'caricamento') return <Caricamento />
  if (stato.fase === 'errore') return <Errore />

  const { lista } = stato
  const aggiungi = (nome: string) => modifica((corrente) => aggiungiVoce(corrente, nome))
  const giaPresente = (nome: string) => voceGiaPresente(lista, nome)
  const rete = senzaRete && <SenzaRete inAttesa={inAttesa} />

  if (lista.voci.length === 0) {
    return (
      <div className="lista">
        {rete}
        <ListaVuota onGenera={genera} />
        <AggiungiVoce onAggiungi={aggiungi} giaPresente={giaPresente} />
      </div>
    )
  }

  const attive = raggruppaPerReparto(vociAttive(lista))
  const comprate = vociComprate(lista)

  const alterna = (id: string) =>
    modifica((corrente) => {
      const voce = corrente.voci.find((v) => v.id === id)
      return voce?.comprata ? despuntaVoce(corrente, id) : spuntaVoce(corrente, id)
    })

  const elimina = (id: string) => modifica((corrente) => eliminaVoce(corrente, id))

  const rinomina = (id: string, nome: string) =>
    modifica((corrente) => rinominaVoce(corrente, id, nome))

  // Le alternative si calcolano sulla lista di adesso: quello che è già dentro
  // non viene riproposto, e per frutta e verdura il mese corrente decide cosa
  // è di stagione e va in cima alla dropdown (F6).
  const sostituisci = (id: string, nome: string) =>
    modifica((corrente) => sostituisciVoce(corrente, id, nome))

  const alternative = (voce: VoceLista) => alternativeVoce(lista, voce)

  return (
    <div className="lista">
      {rete}
      {attive.length > 0 ? (
        attive.map((gruppo) => (
          <GruppoReparto
            key={gruppo.id}
            gruppo={gruppo}
            onAlterna={alterna}
            onElimina={elimina}
            onRinomina={rinomina}
            onSostituisci={sostituisci}
            alternative={alternative}
          />
        ))
      ) : (
        <TuttoPreso />
      )}
      <GiaPresi
        voci={comprate}
        onAlterna={alterna}
        onElimina={elimina}
        onRinomina={rinomina}
        onSostituisci={sostituisci}
        alternative={alternative}
      />
      <AggiungiVoce onAggiungi={aggiungi} giaPresente={giaPresente} />
    </div>
  )
}

function Caricamento() {
  return (
    <p className="lista__messaggio" role="status">
      Apro la lista…
    </p>
  )
}

function Errore() {
  return (
    <p className="lista__messaggio" role="alert">
      Non riesco ad aprire la lista. La prima volta, su questo dispositivo, serve la rete.
    </p>
  )
}

/**
 * Senza rete la lista funziona lo stesso (Step 16): lo si dice in una riga,
 * con quante modifiche aspettano di partire.
 */
function SenzaRete({ inAttesa }: { inAttesa: number }) {
  const coda =
    inAttesa === 0
      ? 'La lista è quella salvata qui.'
      : inAttesa === 1
        ? 'Una modifica parte appena torna.'
        : `${inAttesa} modifiche partono appena torna.`
  return (
    <p className="lista__rete" role="status">
      Senza rete. {coda}
    </p>
  )
}

function TuttoPreso() {
  return (
    <p className="lista__tutto-preso">
      <Icona nome="carrello" /> Preso tutto.
    </p>
  )
}

function ListaVuota({ onGenera }: { onGenera: (portaAvanti: boolean) => void }) {
  return (
    <section className="lista-vuota">
      <Icona nome="cesto" className="lista-vuota__icona" />
      <h2 className="lista-vuota__titolo">Nessuna lista</h2>
      <p className="lista-vuota__testo">
        Genera la lista del prossimo ciclo di due settimane, oppure aggiungi le
        cose a mano.
      </p>
      <GeneraLista rimaste={[]} onGenera={onGenera} />
    </section>
  )
}
