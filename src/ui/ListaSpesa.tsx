import { useState } from 'react'
import { raggruppaPerReparto, vociAttive, vociComprate } from '../domain/lista'
import { listaEsempio } from '../domain/listaEsempio'
import { alternaElemento, despuntaVoce, spuntaVoce } from '../domain/spunta'
import type { Lista } from '../domain/tipi'
import { GiaPresi } from './GiaPresi'
import { GruppoReparto } from './GruppoReparto'
import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa, raggruppata per reparto, con la
 * spunta e la sezione "Già presi" in fondo. La lista parte da un esempio tenuto
 * in memoria: la persistenza arriva allo Step 5 e la generazione allo Step 9
 * (doc/12-piano-sviluppo.md).
 */
export function ListaSpesa() {
  const [lista, setLista] = useState<Lista | null>(listaEsempio)

  if (!lista || lista.voci.length === 0) return <ListaVuota />

  const attive = raggruppaPerReparto(vociAttive(lista))
  const comprate = vociComprate(lista)

  const alterna = (id: string) =>
    setLista((corrente) => {
      if (!corrente) return corrente
      const voce = corrente.voci.find((v) => v.id === id)
      return voce?.comprata ? despuntaVoce(corrente, id) : spuntaVoce(corrente, id)
    })

  const alternaUnElemento = (id: string, nome: string) =>
    setLista((corrente) => (corrente ? alternaElemento(corrente, id, nome) : corrente))

  return (
    <div className="lista">
      {attive.length > 0 ? (
        attive.map((gruppo) => (
          <GruppoReparto
            key={gruppo.id}
            gruppo={gruppo}
            onAlterna={alterna}
            onAlternaElemento={alternaUnElemento}
          />
        ))
      ) : (
        <TuttoPreso />
      )}
      <GiaPresi
        voci={comprate}
        onAlterna={alterna}
        onAlternaElemento={alternaUnElemento}
      />
    </div>
  )
}

function TuttoPreso() {
  return (
    <p className="lista__tutto-preso">
      <span aria-hidden="true">🛒</span> Preso tutto.
    </p>
  )
}

function ListaVuota() {
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
      <button className="bottone" type="button" disabled>
        Genera lista
      </button>
    </section>
  )
}
