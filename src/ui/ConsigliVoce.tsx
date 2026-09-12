import { useEffect, useRef, useState } from 'react'
import type { Chip, Consigli, TipoConsigliato } from '../domain/consigli'
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
 * delle azioni. In cima, fermo, il contatore in grande con la barra dei pasti,
 * perché si tiene aperto nel reparto mentre si prende tutto. Sotto, i tipi da
 * guardare in sola lettura; in fondo, sempre allo stesso posto, il bottone per
 * chiudere, che a voce completa diventa "Fatto".
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

  const completa = presi >= voce.quantita
  const mancano = voce.quantita - presi

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
      <div className="consigli-voce">
        <div className="consigli-voce__testa">
          <h2 className="azioni-voce__titolo" id={`consigli-${voce.id}`}>
            {voce.nome}
          </h2>

          <div className={completa ? 'consigli-voce__conta consigli-voce__conta--completa' : 'consigli-voce__conta'}>
            <Contatore nome={voce.nome} presi={presi} quantita={voce.quantita} onCambia={onConta} grande />
            <div className="consigli-voce__barra" aria-hidden="true">
              {Array.from({ length: voce.quantita }, (_, indice) => (
                <span
                  key={indice}
                  className={indice < presi ? 'consigli-voce__tacca consigli-voce__tacca--presa' : 'consigli-voce__tacca'}
                />
              ))}
            </div>
            <p className="consigli-voce__stato" aria-live="polite">
              {completa ? (
                <>
                  <Icona nome="spunta" /> Tutto preso: chiudendo va tra i Già presi
                </>
              ) : mancano === 1 ? (
                'Manca 1 pasto'
              ) : (
                `Mancano ${mancano} pasti`
              )}
            </p>
          </div>
        </div>

        <div className="consigli-voce__scorre">
          {consigli.tipo === 'elenco' ? (
            <Gruppo titolo="Cosa prendere" tipi={consigli.tipi.map((nome) => ({ nome }))} />
          ) : (
            <Stagioni id={voce.id} diStagione={consigli.diStagione} fuoriStagione={consigli.fuoriStagione} />
          )}
        </div>

        <div className="consigli-voce__piede">
          <button
            className={
              completa ? 'azioni-voce__bottone azioni-voce__bottone--principale' : 'azioni-voce__bottone'
            }
            type="button"
            onClick={chiudi}
          >
            {completa ? 'Fatto' : 'Chiudi'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

type Scheda = 'di' | 'fuori'

/** I gruppi di ogni scheda, nell'ordine in cui guardarli: la chip decide dove va un tipo. */
const gruppi: Record<Scheda, { titolo: string; chip?: Chip }[]> = {
  di: [
    { titolo: 'Ultimi giorni', chip: 'in uscita' },
    { titolo: 'Nel pieno' },
    { titolo: "Tutto l'anno", chip: "tutto l'anno" },
  ],
  fuori: [{ titolo: 'In arrivo', chip: 'in arrivo' }, { titolo: 'Più avanti' }],
}

/** Verdura e frutta: due schede, e in ognuna i tipi divisi per gruppo. */
function Stagioni({
  id,
  diStagione,
  fuoriStagione,
}: {
  id: string
  diStagione: TipoConsigliato[]
  fuoriStagione: TipoConsigliato[]
}) {
  const [scheda, setScheda] = useState<Scheda>(diStagione.length > 0 ? 'di' : 'fuori')
  const tipi = scheda === 'di' ? diStagione : fuoriStagione

  const bottone = (chiave: Scheda, titolo: string, quanti: number) => (
    <button
      className="consigli-voce__scheda"
      type="button"
      aria-pressed={scheda === chiave}
      aria-controls={`${id}-tipi`}
      disabled={quanti === 0}
      onClick={() => setScheda(chiave)}
    >
      {titolo}
      <span className="consigli-voce__quanti">{quanti}</span>
    </button>
  )

  return (
    <>
      <div className="consigli-voce__schede" role="group" aria-label="Stagione">
        {bottone('di', 'Di stagione', diStagione.length)}
        {bottone('fuori', 'Fuori stagione', fuoriStagione.length)}
      </div>
      <div id={`${id}-tipi`} className="consigli-voce__gruppi">
        {gruppi[scheda].map(({ titolo, chip }) => (
          <Gruppo
            key={titolo}
            titolo={titolo}
            chip={chip}
            tipi={tipi.filter((tipo) => tipo.chip === chip)}
            delMese={scheda === 'di' && chip !== "tutto l'anno"}
          />
        ))}
      </div>
    </>
  )
}

/**
 * Un gruppo di tipi, come pillole da leggere. Vuoto, non si mostra. Quelli del
 * mese corrente sono in evidenza, gli altri tenui.
 */
function Gruppo({
  titolo,
  chip,
  tipi,
  delMese = false,
}: {
  titolo: string
  chip?: Chip
  tipi: TipoConsigliato[]
  delMese?: boolean
}) {
  if (tipi.length === 0) return null
  const segno = chip ? ` consigli-voce__gruppo--${chip.replace(/\W+/g, '-')}` : ''
  const evidenza = delMese ? ' consigli-voce__gruppo--del-mese' : ''

  return (
    <section className={`consigli-voce__gruppo${segno}${evidenza}`}>
      <h3 className="azioni-voce__etichetta consigli-voce__etichetta">{titolo}</h3>
      <ul className="consigli-voce__tipi">
        {tipi.map((tipo) => (
          <li key={tipo.nome} className="consigli-voce__tipo">
            {tipo.nome}
          </li>
        ))}
      </ul>
    </section>
  )
}
