// Annulla e ripristina contro il database (in memoria, con le regole di
// salva_voci): quello che torna a schermo deve restare anche dopo la
// rilettura, e arrivare all'altro dispositivo.

import { afterEach, describe, expect, it } from 'vitest'
import { impostaPresi } from '../domain/contatore'
import { Cronologia, type Verso } from '../domain/cronologia'
import { eliminaVoce } from '../domain/modifica'
import { spuntaVoce } from '../domain/spunta'
import type { Lista } from '../domain/tipi'
import { lista } from './contratto'
import { Collegamento, StorageInMemoria } from './inMemoria'
import { MemoriaLocale, type Scaffale } from './memoriaLocale'
import { Sincronizzatore } from './sincronizzatore'

function scaffale(): Scaffale {
  const dati = new Map<string, string>()
  return { getItem: (chiave) => dati.get(chiave) ?? null, setItem: (chiave, valore) => void dati.set(chiave, valore) }
}

const aperti: Sincronizzatore[] = []

afterEach(() => {
  for (const sincronizzatore of aperti.splice(0)) sincronizzatore.chiudi()
})

/** Un dispositivo con la sua cronologia, che modifica e salta come useLista. */
async function dispositivo(db: StorageInMemoria) {
  const rete = new Collegamento(db)
  let n = 0
  const cronologia = new Cronologia(() => `ripresa-${++n}`)
  const sincronizzatore = new Sincronizzatore({
    storage: async () => rete,
    memoria: new MemoriaLocale(scaffale()),
    pausa: 0,
  })
  aperti.push(sincronizzatore)
  await sincronizzatore.apri()

  const schermo = (): Lista => {
    const { stato } = sincronizzatore.leggi()
    if (stato.fase !== 'pronta') throw new Error(stato.fase)
    return stato.lista
  }
  return {
    schermo,
    cronologia,
    modifica(trasforma: (lista: Lista) => Lista) {
      sincronizzatore.modifica((prima) => {
        const dopo = trasforma(prima)
        cronologia.registra(prima, dopo)
        return dopo
      })
    },
    salta(verso: Verso) {
      const passo = cronologia.prossimo(verso)
      if (!passo) return
      sincronizzatore.modifica((prima) => cronologia.salta(prima, verso, passo)?.lista ?? prima)
    },
    /** Aspetta le scritture e rilegge dal database, come dopo il realtime. */
    async rileggi() {
      await sincronizzatore.finito()
      await sincronizzatore.aggiorna()
    },
  }
}

const nomi = (l: Lista) => l.voci.map((voce) => voce.nome).sort()

async function conLista() {
  const db = new StorageInMemoria()
  await db.salvaLista(lista)
  return db
}

describe('annulla e ripristina col database', () => {
  it("un'eliminazione annullata resta anche dopo la rilettura", async () => {
    const db = await conLista()
    const telefono = await dispositivo(db)

    telefono.modifica((l) => eliminaVoce(l, 'pesce-1'))
    await telefono.rileggi()
    telefono.salta('annulla')
    await telefono.rileggi()

    expect(nomi(telefono.schermo())).toEqual(nomi(lista))
    expect(nomi((await db.leggiListaCorrente())!)).toEqual(nomi(lista))
  })

  it('anche se si annulla prima che la scrittura sia partita', async () => {
    const db = await conLista()
    const telefono = await dispositivo(db)

    telefono.modifica((l) => eliminaVoce(l, 'pesce-1'))
    telefono.salta('annulla')
    await telefono.rileggi()

    expect(nomi(telefono.schermo())).toEqual(nomi(lista))
    expect(nomi((await db.leggiListaCorrente())!)).toEqual(nomi(lista))
  })

  it('tocchi veloci: elimina, annulla, ripristina, annulla, tutto prima di rileggere', async () => {
    const db = await conLista()
    const telefono = await dispositivo(db)

    telefono.modifica((l) => eliminaVoce(l, 'pesce-1'))
    telefono.salta('annulla')
    telefono.salta('ripristina')
    telefono.salta('annulla')
    await telefono.rileggi()

    const orate = telefono.schermo().voci.filter((voce) => voce.nome === 'orata')
    expect(orate).toHaveLength(1)
    expect(nomi((await db.leggiListaCorrente())!)).toEqual(nomi(lista))
  })

  it("arriva anche sull'altro dispositivo", async () => {
    const db = await conLista()
    const telefono = await dispositivo(db)
    const altro = await dispositivo(db)

    telefono.modifica((l) => eliminaVoce(l, 'pesce-1'))
    await telefono.rileggi()
    telefono.salta('annulla')
    await telefono.rileggi()
    await altro.rileggi()

    expect(nomi(altro.schermo())).toEqual(nomi(lista))
  })

  it('una serie di swipe annullata tutta torna alla lista di partenza', async () => {
    const db = await conLista()
    const telefono = await dispositivo(db)

    telefono.modifica((l) => impostaPresi(l, 'verdura-1', 14))
    telefono.modifica((l) => spuntaVoce(l, 'pesce-1'))
    telefono.modifica((l) => eliminaVoce(l, 'manuale-1'))
    await telefono.rileggi()
    telefono.salta('annulla')
    telefono.salta('annulla')
    await telefono.rileggi()
    telefono.salta('annulla')
    await telefono.rileggi()

    const schermo = telefono.schermo()
    const per = (nome: string) => schermo.voci.find((voce) => voce.nome === nome)
    expect(per('Verdura')).toMatchObject({ presi: 3, comprata: false })
    expect(per('orata')?.comprata).toBe(false)
    expect(per('caffè')?.comprata).toBe(true)
    expect(nomi((await db.leggiListaCorrente())!)).toEqual(nomi(lista))
    expect(telefono.cronologia.puoAnnullare).toBe(false)

    // E rifatta tutta, torna come dopo gli swipe.
    telefono.salta('ripristina')
    telefono.salta('ripristina')
    telefono.salta('ripristina')
    await telefono.rileggi()
    expect(nomi(telefono.schermo())).toEqual(['Verdura', 'orata'])
    expect(nomi((await db.leggiListaCorrente())!)).toEqual(['Verdura', 'orata'])
  })
})
