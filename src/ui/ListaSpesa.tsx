import { aggiungiVoce } from '../domain/aggiunta'
import { vociDaRiportare } from '../domain/ciclo'
import { raggruppaPerReparto, vociAttive, vociComprate } from '../domain/lista'
import { eliminaVoce, rinominaVoce } from '../domain/modifica'
import { alternaElemento, despuntaVoce, spuntaVoce } from '../domain/spunta'
import { AggiungiVoce } from './AggiungiVoce'
import { GeneraLista } from './GeneraLista'
import { GiaPresi } from './GiaPresi'
import { GruppoReparto } from './GruppoReparto'
import { useLista } from './useLista'
import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa, raggruppata per reparto, con la
 * spunta e la sezione "Già presi" in fondo. In fondo, sempre raggiungibile,
 * il campo di aggiunta rapida e l'azione che apre il ciclo nuovo. La lista
 * arriva dallo storage e ogni modifica ci torna: quello che si tocca resta
 * anche dopo un refresh.
 */
export function ListaSpesa() {
  const { stato, modifica, genera } = useLista()

  if (stato.fase === 'caricamento') return <Caricamento />
  if (stato.fase === 'errore') return <Errore />

  const { lista } = stato
  const aggiungi = (nome: string) => modifica((corrente) => aggiungiVoce(corrente, nome))

  if (lista.voci.length === 0) {
    return (
      <div className="lista">
        <ListaVuota onGenera={genera} />
        <AggiungiVoce onAggiungi={aggiungi} />
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

  const alternaUnElemento = (id: string, nome: string) =>
    modifica((corrente) => alternaElemento(corrente, id, nome))

  const elimina = (id: string) => modifica((corrente) => eliminaVoce(corrente, id))

  const rinomina = (id: string, nome: string) =>
    modifica((corrente) => rinominaVoce(corrente, id, nome))

  return (
    <div className="lista">
      {attive.length > 0 ? (
        attive.map((gruppo) => (
          <GruppoReparto
            key={gruppo.id}
            gruppo={gruppo}
            onAlterna={alterna}
            onAlternaElemento={alternaUnElemento}
            onElimina={elimina}
            onRinomina={rinomina}
          />
        ))
      ) : (
        <TuttoPreso />
      )}
      <GiaPresi
        voci={comprate}
        onAlterna={alterna}
        onAlternaElemento={alternaUnElemento}
        onElimina={elimina}
        onRinomina={rinomina}
      />
      <AggiungiVoce onAggiungi={aggiungi} />
      <GeneraLista rimaste={vociDaRiportare(lista)} onGenera={genera} />
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
      Non riesco ad aprire la lista salvata su questo dispositivo.
    </p>
  )
}

function TuttoPreso() {
  return (
    <p className="lista__tutto-preso">
      <span aria-hidden="true">🛒</span> Preso tutto.
    </p>
  )
}

function ListaVuota({ onGenera }: { onGenera: (portaAvanti: boolean) => void }) {
  return (
    <section className="lista-vuota">
      <p className="lista-vuota__icona" aria-hidden="true">
        🧺
      </p>
      <h2 className="lista-vuota__titolo">Nessuna lista</h2>
      <p className="lista-vuota__testo">
        Genera la lista del prossimo ciclo di due settimane, oppure aggiungi le
        cose a mano.
      </p>
      <GeneraLista rimaste={[]} onGenera={onGenera} variante="principale" />
    </section>
  )
}
