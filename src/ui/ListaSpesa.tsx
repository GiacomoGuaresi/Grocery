import { useState } from 'react'
import { raggruppaPerReparto, vociAttive } from '../domain/lista'
import { listaEsempio } from '../domain/listaEsempio'
import type { Lista } from '../domain/tipi'
import { GruppoReparto } from './GruppoReparto'
import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa, raggruppata per reparto.
 * Allo Step 3 è in sola lettura e parte da una lista di esempio tenuta in
 * memoria; la spunta arriva allo Step 4 e la generazione allo Step 9
 * (doc/12-piano-sviluppo.md).
 */
export function ListaSpesa() {
  const [lista] = useState<Lista | null>(listaEsempio)

  const gruppi = lista ? raggruppaPerReparto(vociAttive(lista)) : []

  if (gruppi.length === 0) return <ListaVuota />

  return (
    <div className="lista">
      {gruppi.map((gruppo) => (
        <GruppoReparto key={gruppo.id} gruppo={gruppo} />
      ))}
    </div>
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
