import { useState } from 'react'
import { aggiungiVoce, nuovoId, voceGiaPresente } from '../domain/aggiunta'
import { contaVoce, impostaPresi } from '../domain/contatore'
import { raggruppaPerReparto, vociAttive, vociComprate } from '../domain/lista'
import { cambiaReparto, eliminaVoce, rinominaVoce } from '../domain/modifica'
import { despuntaVoce, spuntaVoce } from '../domain/spunta'
import type { IdReparto } from '../domain/tipi'
import { AggiungiVoce } from './AggiungiVoce'
import { GeneraLista } from './GeneraLista'
import { GiaPresi } from './GiaPresi'
import { GruppoReparto } from './GruppoReparto'
import { Icona } from './Icona'
import type { ListaPersistita } from './useLista'
import type { Arrivo } from './Voce'
import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa, raggruppata per reparto, con la
 * spunta e la sezione "Già presi" in fondo. In fondo, sempre raggiungibile,
 * il campo di aggiunta rapida; il ciclo nuovo si apre dal menu laterale. La
 * lista la tiene App (useLista), perché serve anche a "Genera lista": arriva
 * dallo storage e ogni modifica ci torna, così resta anche dopo un refresh.
 *
 * Tiene a mente l'ultima voce arrivata (aggiunta, spuntata o de-spuntata),
 * che entra nel suo posto nuovo con un'animazione.
 */
export function ListaSpesa({ stato, modifica, genera, inAttesa, senzaRete }: ListaPersistita) {
  const [arrivo, setArrivo] = useState<Arrivo | null>(null)

  if (stato.fase === 'caricamento') return <Caricamento />
  if (stato.fase === 'errore') return <Errore />

  const { lista } = stato

  // L'id della voce nuova si sceglie qui, per sapere quale riga far lampeggiare.
  // Se c'è già da prendere non arriva niente: la barra avvisa e basta.
  const aggiungi = (nome: string) => {
    const presente = voceGiaPresente(lista, nome)
    const id = presente?.id ?? nuovoId()
    if (!presente || presente.comprata) setArrivo({ id, tipo: 'aggiunta', comprata: false })
    modifica((corrente) => aggiungiVoce(corrente, nome, id))
  }
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

  const alterna = (id: string) => {
    const voce = lista.voci.find((v) => v.id === id)
    if (voce) setArrivo({ id, tipo: 'spostata', comprata: !voce.comprata })
    modifica((corrente) => {
      const voce = corrente.voci.find((v) => v.id === id)
      return voce?.comprata ? despuntaVoce(corrente, id) : spuntaVoce(corrente, id)
    })
  }

  // Il contatore: se il numero porta la voce tra i già presi, o la riporta
  // indietro, la voce arriva dall'altra parte come per la spunta.
  const conta = (id: string, presi: number) => {
    const voce = lista.voci.find((v) => v.id === id)
    const nuova = voce && contaVoce(voce, presi)
    if (voce && nuova && nuova.comprata !== voce.comprata)
      setArrivo({ id, tipo: 'spostata', comprata: nuova.comprata })
    modifica((corrente) => impostaPresi(corrente, id, presi))
  }

  const elimina = (id: string) => modifica((corrente) => eliminaVoce(corrente, id))

  const rinomina = (id: string, nome: string) =>
    modifica((corrente) => rinominaVoce(corrente, id, nome))

  const spostaInReparto = (id: string, reparto: IdReparto) =>
    modifica((corrente) => cambiaReparto(corrente, id, reparto))

  return (
    <div className="lista">
      {rete}
      {attive.length > 0 ? (
        attive.map((gruppo) => (
          <GruppoReparto
            key={gruppo.id}
            gruppo={gruppo}
            arrivo={arrivo}
            onAlterna={alterna}
            onConta={conta}
            onElimina={elimina}
            onRinomina={rinomina}
            onCambiaReparto={spostaInReparto}
          />
        ))
      ) : (
        <TuttoPreso />
      )}
      <GiaPresi
        voci={comprate}
        arrivo={arrivo}
        onAlterna={alterna}
        onConta={conta}
        onElimina={elimina}
        onRinomina={rinomina}
        onCambiaReparto={spostaInReparto}
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
      <Icona nome="carrello" className="lista__tutto-preso-icona" /> Preso tutto.
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
