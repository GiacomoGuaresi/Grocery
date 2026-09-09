import './ListaSpesa.css'

/**
 * Schermata principale: la lista della spesa.
 * Allo Step 1 è solo lo stato vuoto; il raggruppamento per reparto arriva
 * allo Step 3 e la generazione allo Step 9 (doc/12-piano-sviluppo.md).
 */
export function ListaSpesa() {
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
