import { useState } from 'react'
import { mesi, type GruppoFisso, type Mese } from '../domain/dati'
import { diStagioneNelPeriodo, meseDi, nomiMesi, stagioneDi, stagioni } from '../domain/stagioni'
import './DiStagione.css'

/** Le iniziali dei mesi per la striscia dell'anno, da gennaio a dicembre. */
const iniziali = mesi.map((m) => nomiMesi[m][0].toUpperCase())

/** Come si contano i tipi del gruppo: "1 frutto", "14 verdure". */
const conteggio: Record<GruppoFisso, [string, string]> = {
  frutta: ['frutto', 'frutti'],
  verdura: ['verdura', 'verdure'],
}

const maiuscola = (testo: string) => testo[0].toUpperCase() + testo.slice(1)

/**
 * Vista di consultazione della stagionalità di frutta o verdura: si apre sulla
 * stagione di adesso, e si può passare a un'altra stagione o restringere a un
 * suo mese. Ogni tipo ha la striscia dell'anno coi mesi in cui c'è, così si
 * vede se sta arrivando o se sta finendo. Quello che c'è tutto l'anno sta a
 * parte, in una riga sola.
 */
export function DiStagione({ gruppo }: { gruppo: GruppoFisso }) {
  const [stagione, setStagione] = useState(() => stagioneDi(meseDi()))
  /** Un mese della stagione, o nessuno per la stagione intera. */
  const [mese, setMese] = useState<Mese | null>(null)

  const periodo = mese ? [mese] : stagione.mesi
  const { diStagione, tuttoLAnno } = diStagioneNelPeriodo(gruppo, periodo)
  const titolo = mese ? maiuscola(nomiMesi[mese]) : stagione.etichetta
  const [uno, tanti] = conteggio[gruppo]

  return (
    <section className="stagione" aria-labelledby="stagione-titolo">
      <div className="stagione__stagioni" role="group" aria-label="Stagione">
        {stagioni.map((s) => (
          <button
            key={s.id}
            type="button"
            className="stagione__stagione"
            aria-pressed={s.id === stagione.id}
            onClick={() => {
              setStagione(s)
              setMese(null)
            }}
          >
            {s.etichetta}
          </button>
        ))}
      </div>

      <div className="stagione__mesi" role="group" aria-label="Periodo">
        <button
          type="button"
          className="stagione__mese"
          aria-pressed={mese === null}
          onClick={() => setMese(null)}
        >
          Tutta
        </button>
        {stagione.mesi.map((m) => (
          <button
            key={m}
            type="button"
            className="stagione__mese"
            aria-pressed={m === mese}
            onClick={() => setMese(m)}
          >
            {maiuscola(nomiMesi[m])}
          </button>
        ))}
      </div>

      <h2 className="stagione__titolo" id="stagione-titolo">
        {titolo}
        <span className="stagione__conteggio">
          {diStagione.length} {diStagione.length === 1 ? uno : tanti}
        </span>
      </h2>

      <ul className="stagione__voci">
        <li className="stagione__intestazione" aria-hidden="true">
          <span />
          <Iniziali oggi={meseDi()} />
        </li>
        {diStagione.map((tipo) => (
          <li className="stagione__voce" key={tipo.nome}>
            <span className="stagione__nome">{tipo.nome}</span>
            <Striscia accesi={tipo.mesi} periodo={periodo} />
            <span className="solo-lettori">, {elencoMesi(tipo.mesi)}</span>
          </li>
        ))}
      </ul>

      {tuttoLAnno.length > 0 && (
        <p className="stagione__sempre">
          <span className="stagione__sempre-titolo">Tutto l'anno</span>
          {tuttoLAnno.join(', ')}
        </p>
      )}
    </section>
  )
}

/** Le iniziali in testa alla colonna: in evidenza solo il mese di adesso. */
function Iniziali({ oggi }: { oggi: Mese }) {
  return (
    <span className="striscia striscia--lettere" aria-hidden="true">
      {mesi.map((m, i) => (
        <span
          key={m}
          className={m === oggi ? 'striscia__mese striscia__mese--oggi' : 'striscia__mese'}
          style={{ gridColumn: m }}
        >
          {iniziali[i]}
        </span>
      ))}
    </span>
  )
}

/**
 * I dodici mesi in fila: pieni quelli in cui il tipo c'è, e un bordo attorno
 * a quelli del periodo scelto. Solo disegno: il testo per chi legge con lo
 * screen reader è accanto.
 */
function Striscia({ accesi, periodo }: { accesi: readonly Mese[]; periodo: readonly Mese[] }) {
  return (
    <span className="striscia" aria-hidden="true">
      {mesi.map((m) => {
        const classi = ['striscia__mese']
        if (accesi.includes(m)) classi.push('striscia__mese--acceso')
        if (periodo.includes(m)) classi.push('striscia__mese--periodo')
        return <span key={m} className={classi.join(' ')} style={{ gridColumn: m }} />
      })}
      {tratti(periodo).map(([da, a]) => (
        <span key={da} className="striscia__cornice" style={{ gridColumn: `${da} / ${a + 1}` }} />
      ))}
    </span>
  )
}

/**
 * I tratti consecutivi del periodo nella striscia gennaio–dicembre, come
 * [primo, ultimo]. Di solito uno; l'inverno ne fa due: dicembre in fondo,
 * gennaio e febbraio in testa.
 */
function tratti(periodo: readonly Mese[]): [Mese, Mese][] {
  const risultato: [Mese, Mese][] = []
  for (const m of mesi) {
    if (!periodo.includes(m)) continue
    const ultimo = risultato[risultato.length - 1]
    if (ultimo && ultimo[1] === m - 1) ultimo[1] = m
    else risultato.push([m, m])
  }
  return risultato
}

/** "da settembre a novembre": i mesi di un tipo, detti a parole. */
function elencoMesi(mesiTipo: readonly Mese[]): string {
  const a = (m: Mese) => `${/^[aeiou]/.test(nomiMesi[m]) ? 'ad' : 'a'} ${nomiMesi[m]}`
  if (mesiTipo.length === 1) return `solo ${a(mesiTipo[0])}`
  return `da ${nomiMesi[mesiTipo[0]]} ${a(mesiTipo[mesiTipo.length - 1])}`
}
