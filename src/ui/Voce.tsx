import { useContext, useEffect, useRef, useState } from 'react'
import { consigliVoce } from '../domain/consigli'
import { contaVoce, haContatore } from '../domain/contatore'
import { rinominabile } from '../domain/modifica'
import { meseDi } from '../domain/stagioni'
import type { IdReparto, Voce as VoceLista } from '../domain/tipi'
import { movimentoRidotto, useUscita } from './animazioni'
import { AzioniVoce } from './AzioniVoce'
import { ConsigliVoce } from './ConsigliVoce'
import { Contatore } from './Contatore'
import { Icona } from './Icona'
import { usePressioneLunga } from './pressioneLunga'
import { useScorrimento } from './scorrimento'
import { RegistroUscite } from './useSalti'
import './Voce.css'

/**
 * La voce appena arrivata in un punto della lista, da far entrare con
 * un'animazione: aggiunta a mano, oppure spostata da una spunta, una
 * de-spunta o dal contatore. `comprata` dice dove arriva, così la riga che sta
 * uscendo dall'altra parte non la prende per sé. `ripresa` è una voce rimasta
 * al suo posto ma cambiata da annulla o ripristina: lampeggia e basta.
 */
export interface Arrivo {
  id: string
  tipo: 'aggiunta' | 'spostata' | 'ripresa'
  comprata: boolean
}

interface Props {
  voce: VoceLista
  /** Le ultime voci arrivate nella lista. */
  arrivi: Arrivo[]
  /** La riga se ne va per un annulla o un ripristina: la modifica arriva dopo. */
  esce?: boolean
  /** Tocco sulla casella: la spunta, o la de-spunta se è tra i già presi. */
  onAlterna: (id: string) => void
  /** Il contatore delle voci generate: il numero nuovo dei presi. */
  onConta: (id: string, presi: number) => void
  /** Toglie la voce dalla lista. */
  onElimina: (id: string) => void
  /** Corregge il nome: solo per le voci manuali sotto "Altro". */
  onRinomina: (id: string, nome: string) => void
  /** Sceglie il reparto: solo per le voci manuali sotto "Altro". */
  onCambiaReparto: (id: string, reparto: IdReparto) => void
}

/**
 * Una voce della lista. Le voci manuali, e le generate rimaste dalla v1, si
 * spuntano dalla casella: segnate comprate spariscono dalla lista attiva
 * (doc/08-ui-ux.md). Le generate v2 al posto della casella hanno il contatore
 * dei pasti (F15): arrivate al totale sono complete e vanno tra i "Già presi",
 * dove il − le riporta indietro.
 *
 * Il nome non spunta. Nelle voci manuali sotto "Altro" toccarlo lo rende
 * modificabile lì dove sta; nelle generate con consigli apre il popup dei
 * consigli (F14), col contatore in cima. Rinomina, scelta del reparto ed
 * elimina stanno nel popup
 * che si apre col ⋯ (AzioniVoce), o tenendo premuto il nome.
 *
 * Scorrendo la riga col dito verso destra si spunta (le voci col contatore si
 * completano; tra i "Già presi" invece tornano nella lista, a zero), verso
 * sinistra si elimina.
 *
 * Spunta, contatore completato ed eliminazione sono animati: la riga si
 * chiude, e solo dopo la modifica arriva alla lista. Una voce appena arrivata
 * invece si apre. Il contatore che non sposta la voce cambia subito.
 */
export function Voce({
  voce,
  arrivi,
  esce = false,
  onAlterna,
  onConta,
  onElimina,
  onRinomina,
  onCambiaReparto,
}: Props) {
  const [azioniAperte, setAzioniAperte] = useState(false)
  const [consigliAperti, setConsigliAperti] = useState(false)
  // Non nullo solo mentre si sta scrivendo il nome nuovo direttamente nella riga.
  const [nomeInCorso, setNomeInCorso] = useState<string | null>(null)
  // Il numero che porta la voce dall'altra parte, mostrato mentre la riga esce.
  const [presiInUscita, setPresiInUscita] = useState<number | null>(null)
  // Dal popup dei consigli: il numero che sposterebbe la voce, tenuto fino alla chiusura.
  const [presiInSospeso, setPresiInSospeso] = useState<number | null>(null)
  const riga = useRef<HTMLLIElement>(null)
  const pressioneLunga = usePressioneLunga(() => {
    if (nomeInCorso === null) setAzioniAperte(true)
  })

  // Mentre la riga esce, annulla e ripristina aspettano la sua modifica (useSalti).
  const registro = useContext(RegistroUscite)
  const finisciUscita = useRef<(() => void) | null>(null)
  useEffect(() => () => finisciUscita.current?.(), [])

  const { uscita, esci: esciSubito, fine } = useUscita<'spunta' | 'conta' | 'elimina'>((motivo) => {
    if (motivo === 'elimina') onElimina(voce.id)
    else if (motivo === 'conta') onConta(voce.id, presiInUscita ?? voce.presi ?? 0)
    else onAlterna(voce.id)
    finisciUscita.current?.()
    finisciUscita.current = null
  })
  const esci = (motivo: 'spunta' | 'conta' | 'elimina') => {
    if (uscita || finisciUscita.current) return
    finisciUscita.current = registro.inizia()
    esciSubito(motivo)
  }
  // Riaperta senza che la voce si sia spostata: il numero torna quello vero.
  useEffect(() => {
    if (uscita === null) setPresiInUscita(null)
  }, [uscita])
  // Mentre la riga esce per la spunta o il contatore, si mostra già lo stato nuovo.
  const spuntata = uscita === 'spunta' || uscita === 'conta' ? !voce.comprata : voce.comprata

  const arrivo = arrivi.find((a) => a.id === voce.id && a.comprata === voce.comprata) ?? null
  // L'arrivo già animato: uno nuovo per la stessa riga (annulla, poi ripristina) si rivede.
  const [arrivata, setArrivata] = useState<Arrivo | null>(null)
  const arriva = arrivo && arrivo !== arrivata ? arrivo.tipo : null
  const lampeggia = arriva === 'aggiunta' || arriva === 'ripresa'

  // Quella aggiunta a mano, o riportata da annulla e ripristina, può essere
  // fuori schermo: la si porta in vista.
  useEffect(() => {
    if (!lampeggia) return
    riga.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: movimentoRidotto() ? 'auto' : 'smooth',
    })
  }, [lampeggia, arrivo])

  const contatore = haContatore(voce)
  const consigli = consigliVoce(voce, meseDi())
  const presi = presiInUscita ?? presiInSospeso ?? voce.presi ?? 0

  const scorrimento = useScorrimento({
    attivo: !uscita && !esce && nomeInCorso === null && !azioniAperte && !consigliAperti,
    onDestra: () => {
      if (!contatore) esci('spunta')
      else conta(voce.comprata ? 0 : (voce.quantita ?? 0))
    },
    onSinistra: () => esci('elimina'),
  })
  const spostamento = scorrimento.spostamento

  const classi = ['voce']
  if (contatore && spuntata) classi.push('voce--completa')
  if (arriva === 'ripresa') classi.push('voce--ripresa')
  else if (arriva) classi.push('voce--arriva', `voce--arriva-${arriva}`)
  if (uscita || esce) classi.push('voce--esce')
  if (spostamento !== 0) classi.push('voce--scorre')
  if ((uscita === 'spunta' || uscita === 'conta') && spuntata) classi.push('voce--si-spunta')

  // Se il numero nuovo sposta la voce tra lista e "Già presi" la riga esce
  // prima; altrimenti cambia subito.
  const conta = (numero: number) => {
    const nuova = contaVoce(voce, numero)
    if (nuova === voce) return
    if (nuova.comprata === voce.comprata) return onConta(voce.id, nuova.presi ?? 0)
    setPresiInUscita(nuova.presi ?? 0)
    esci('conta')
  }

  // Dal popup: il numero che non sposta la voce va subito alla lista; quello
  // che la sposterebbe aspetta la chiusura, così il popup resta aperto.
  const contaNelPopup = (numero: number) => {
    const nuova = contaVoce(voce, numero)
    if (nuova.comprata !== voce.comprata) return setPresiInSospeso(nuova.presi ?? 0)
    setPresiInSospeso(null)
    if (nuova !== voce) onConta(voce.id, nuova.presi ?? 0)
  }

  const chiudiConsigli = () => {
    setConsigliAperti(false)
    if (presiInSospeso === null) return
    setPresiInSospeso(null)
    conta(presiInSospeso)
  }

  // Invio o tocco fuori salvano; un nome vuoto o uguale lascia tutto com'era.
  const salvaNome = () => {
    const nome = nomeInCorso?.trim() ?? ''
    if (nome !== '' && nome !== voce.nome) onRinomina(voce.id, nome)
    setNomeInCorso(null)
  }

  return (
    <li
      ref={riga}
      className={classi.join(' ')}
      {...scorrimento.gestori}
      onAnimationEnd={(evento) => {
        // Solo le animazioni della riga, non quelle del segno dentro.
        if (evento.target !== evento.currentTarget) return
        if (evento.animationName === 'voce-esce') fine()
        // L'arrivo finisce con la sua ultima animazione: il lampo, se c'è.
        else if (evento.animationName === (lampeggia ? 'voce-lampo' : 'voce-arriva'))
          setArrivata(arrivo)
      }}
    >
      {spostamento !== 0 && (
        <div
          className={[
            'voce__sotto',
            spostamento > 0 ? 'voce__sotto--destra' : 'voce__sotto--sinistra',
            scorrimento.oltre ? 'voce__sotto--pronto' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          <Icona
            nome={spostamento < 0 ? 'cestino' : voce.comprata ? 'annulla' : 'spunta'}
            className="voce__sotto-icona"
          />
        </div>
      )}
      <div
        className={scorrimento.rientra ? 'voce__testata voce__testata--rientra' : 'voce__testata'}
        style={spostamento !== 0 ? { transform: `translateX(${spostamento}px)` } : undefined}
      >
        {!contatore && (
          <button
            className="voce__spunta"
            type="button"
            aria-pressed={spuntata}
            aria-label={`Spunta ${voce.nome}`}
            onClick={() => esci('spunta')}
          >
            <span className="voce__segno" aria-hidden="true">
              <Icona nome="spunta" className="voce__segno-spunta" />
            </span>
          </button>
        )}
        {contatore && (
          <Contatore nome={voce.nome} presi={presi} quantita={voce.quantita} onCambia={conta} />
        )}
        {nomeInCorso !== null ? (
          <input
            className="voce__campo"
            type="text"
            value={nomeInCorso}
            onChange={(evento) => setNomeInCorso(evento.target.value)}
            onBlur={salvaNome}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') evento.currentTarget.blur()
              if (evento.key === 'Escape') setNomeInCorso(null)
            }}
            aria-label={`Nuovo nome per ${voce.nome}`}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
          />
        ) : rinominabile(voce) ? (
          <button
            className="voce__nome voce__nome--tocco voce__nome--rinomina"
            type="button"
            aria-label={`Rinomina ${voce.nome}`}
            onClick={() => setNomeInCorso(voce.nome)}
            {...pressioneLunga}
          >
            {voce.nome}
            <Icona nome="matita" className="voce__nome-icona" />
          </button>
        ) : consigli ? (
          <button
            className="voce__nome voce__nome--tocco voce__nome--consigli"
            type="button"
            aria-haspopup="dialog"
            aria-label={`Consigli per ${voce.nome}`}
            onClick={() => setConsigliAperti(true)}
            {...pressioneLunga}
          >
            {voce.nome}
            <Icona nome="avanti" className="voce__nome-icona" />
          </button>
        ) : (
          <span className="voce__nome voce__nome--premi" {...pressioneLunga}>
            {voce.nome}
          </span>
        )}
        <button
          className="voce__azioni-apri"
          type="button"
          aria-haspopup="dialog"
          aria-label={`Azioni per ${voce.nome}`}
          onClick={() => setAzioniAperte(true)}
        >
          <Icona nome="altro" />
        </button>
      </div>

      {azioniAperte && (
        <AzioniVoce
          voce={voce}
          onElimina={() => esci('elimina')}
          onRinomina={(nome) => onRinomina(voce.id, nome)}
          onCambiaReparto={(reparto) => onCambiaReparto(voce.id, reparto)}
          onChiudi={() => setAzioniAperte(false)}
        />
      )}

      {consigliAperti && contatore && consigli && (
        <ConsigliVoce
          voce={voce}
          presi={presi}
          consigli={consigli}
          onConta={contaNelPopup}
          onChiudi={chiudiConsigli}
        />
      )}
    </li>
  )
}
