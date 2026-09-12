import { useEffect, useRef, useState } from 'react'
import type { Consigli, TipoConsigliato } from '../domain/consigli'
import type { Voce as VoceLista } from '../domain/tipi'
import { useUscita } from './animazioni'
import { Contatore } from './Contatore'
import { Icona } from './Icona'
import './AzioniVoce.css'
import './ConsigliVoce.css'

interface Props {
  voce: VoceLista & { quantita: number }
  /** I presi da mostrare: quelli della voce, o quelli in sospeso fino alla chiusura. */
  presi: number
  consigli: Consigli
  onConta: (presi: number) => void
  /** Il popup si è chiuso, in qualunque modo. */
  onChiudi: () => void
}

/**
 * Il popup dei consigli di una voce generata (F14): sale dal fondo come quello
 * delle azioni, con in cima lo stesso contatore della riga, perché si tiene
 * aperto nel reparto mentre si prende tutto. Sotto, i consigli in sola lettura.
 *
 * Arrivati al totale resta aperto: la voce va tra i "Già presi" solo quando si
 * chiude (lo decide Voce), così un tocco di troppo si corregge col −.
 */
export function ConsigliVoce({ voce, presi, consigli, onConta, onChiudi }: Props) {
  const finestra = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = finestra.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  const { uscita, esci, fine } = useUscita<'chiudi'>(() => finestra.current?.close())
  const chiudi = () => esci('chiudi')

  return (
    <dialog
      ref={finestra}
      className={uscita ? 'azioni-voce azioni-voce--chiude' : 'azioni-voce'}
      aria-labelledby={`consigli-${voce.id}`}
      onClose={onChiudi}
      onCancel={(evento) => {
        evento.preventDefault()
        chiudi()
      }}
      onAnimationEnd={(evento) => {
        if (evento.target === evento.currentTarget && evento.animationName === 'azioni-voce-scende')
          fine()
      }}
      onClick={(evento) => evento.target === evento.currentTarget && chiudi()}
    >
      <div className="azioni-voce__corpo consigli-voce">
        <div className="consigli-voce__testata">
          <h2 className="azioni-voce__titolo" id={`consigli-${voce.id}`}>
            {voce.nome}
          </h2>
          <Contatore nome={voce.nome} presi={presi} quantita={voce.quantita} onCambia={onConta} />
        </div>

        {consigli.tipo === 'elenco' ? (
          <section className="azioni-voce__campo">
            <h3 className="azioni-voce__etichetta">Cosa prendere</h3>
            <ul className="consigli-voce__elenco">
              {consigli.tipi.map((nome) => (
                <li key={nome} className="consigli-voce__tipo">
                  {nome}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            <Sezione id={`${voce.id}-di`} titolo="Di stagione" tipi={consigli.diStagione} aperta />
            <Sezione id={`${voce.id}-fuori`} titolo="Fuori stagione" tipi={consigli.fuoriStagione} />
          </>
        )}

        <button className="azioni-voce__chiudi" type="button" onClick={chiudi}>
          Chiudi
        </button>
      </div>
    </dialog>
  )
}

/** Una lista collassabile di tipi, a fisarmonica come i "Già presi". */
function Sezione({
  id,
  titolo,
  tipi,
  aperta: apertaAllInizio = false,
}: {
  id: string
  titolo: string
  tipi: TipoConsigliato[]
  aperta?: boolean
}) {
  const [aperta, setAperta] = useState(apertaAllInizio)
  if (tipi.length === 0) return null

  return (
    <section className="consigli-voce__sezione">
      <button
        className="consigli-voce__intestazione"
        type="button"
        aria-expanded={aperta}
        aria-controls={id}
        onClick={() => setAperta((era) => !era)}
      >
        <Icona nome="avanti" className="consigli-voce__freccia" />
        <span className="azioni-voce__etichetta">{titolo}</span>
        <span className="consigli-voce__quanti">{tipi.length}</span>
      </button>
      <div
        className={aperta ? 'consigli-voce__corpo consigli-voce__corpo--aperto' : 'consigli-voce__corpo'}
        id={id}
      >
        <ul className="consigli-voce__righe">
          {tipi.map((tipo) => (
            <li key={tipo.nome} className="consigli-voce__riga">
              <span>{tipo.nome}</span>
              {tipo.chip && (
                <span className={`consigli-voce__chip consigli-voce__chip--${tipo.chip.replace(/\W+/g, '-')}`}>
                  {tipo.chip}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
