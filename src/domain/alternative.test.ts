import initSqlJs from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { PersistenzaMemoria } from '../storage/memoria'
import { apriStorageSqlite } from '../storage/sqlite'
import { alternativeVoce, sostituisciVoce, tutteLeAlternative } from './alternative'
import { categoria, diStagione, stagionalita } from './dati'
import { listaEsempio } from './listaEsempio'
import type { Lista, Rotazione, Voce } from './tipi'

/** Settembre: il mese della lista di esempio, con la sua stagionalità. */
const settembre = 9

function voce(lista: Lista, id: string): Voce {
  return lista.voci.find((v) => v.id === id)!
}

describe('alternativeVoce', () => {
  it('propone le altre tipologie della categoria, in un elenco solo', () => {
    const alternative = alternativeVoce(listaEsempio, voce(listaEsempio, 'pesce-2'))
    expect(alternative.consigliate).toContain('branzino')
    expect(alternative.consigliate.length).toBeGreaterThan(10)
    expect(alternative.fuoriStagione).toEqual([])
  })

  it('non ripropone la voce stessa né quello che è già in lista', () => {
    const alternative = tutteLeAlternative(alternativeVoce(listaEsempio, voce(listaEsempio, 'pesce-2')))
    expect(alternative).not.toContain('orata')
    expect(alternative).not.toContain('merluzzo')
    expect(alternative).not.toContain('gamberi')
  })

  it('niente per le uova, che una tipologia sola ce l’hanno', () => {
    expect(tutteLeAlternative(alternativeVoce(listaEsempio, voce(listaEsempio, 'uova-1')))).toEqual([])
  })

  it('niente per le voci manuali', () => {
    expect(tutteLeAlternative(alternativeVoce(listaEsempio, voce(listaEsempio, 'manuale-1')))).toEqual(
      [],
    )
  })
})

describe('alternativeVoce — frutta e verdura', () => {
  it('prima la frutta di stagione nel mese, poi quella fuori stagione', () => {
    const alternative = alternativeVoce(listaEsempio, voce(listaEsempio, 'frutta-1'), settembre)
    const diSettembre = diStagione('frutta', settembre)
    expect(alternative.consigliate.every((nome) => diSettembre.includes(nome))).toBe(true)
    expect(alternative.fuoriStagione.some((nome) => diSettembre.includes(nome))).toBe(false)
    expect(alternative.consigliate.length).toBeGreaterThan(0)
    expect(alternative.fuoriStagione.length).toBeGreaterThan(0)
  })

  it('propone tutta la frutta che non è già in lista', () => {
    const alternative = tutteLeAlternative(
      alternativeVoce(listaEsempio, voce(listaEsempio, 'frutta-1'), settembre),
    )
    const giaInLista = new Set(listaEsempio.voci.map((v) => v.nome))
    expect(alternative.sort()).toEqual(
      Object.keys(stagionalita.frutta)
        .filter((nome) => !giaInLista.has(nome))
        .sort(),
    )
  })

  it('a gennaio la stagione è quella di gennaio', () => {
    const alternative = alternativeVoce(listaEsempio, voce(listaEsempio, 'frutta-1'), 1)
    expect(alternative.consigliate.every((nome) => diStagione('frutta', 1).includes(nome))).toBe(true)
    expect(alternative.fuoriStagione.some((nome) => diStagione('frutta', 1).includes(nome))).toBe(
      false,
    )
  })

  it('non ripropone i tipi già in lista', () => {
    const alternative = tutteLeAlternative(
      alternativeVoce(listaEsempio, voce(listaEsempio, 'verdura-1'), settembre),
    )
    for (const gia of ['zucchine', 'melanzane', 'spinaci', 'peperoni']) {
      expect(alternative).not.toContain(gia)
    }
  })

  it('al posto di una verdura propone solo verdura', () => {
    const alternative = tutteLeAlternative(
      alternativeVoce(listaEsempio, voce(listaEsempio, 'verdura-1'), settembre),
    )
    expect(alternative.every((nome) => nome in stagionalita.verdura)).toBe(true)
  })
})

describe('sostituisciVoce', () => {
  it('mette al posto della voce la tipologia scelta', () => {
    const dopo = sostituisciVoce(listaEsempio, 'carne_rossa-1', 'spezzatino di manzo')
    expect(voce(dopo, 'carne_rossa-1').nome).toBe('spezzatino di manzo')
    expect(dopo.voci).toHaveLength(listaEsempio.voci.length)
  })

  it('il reparto segue la tipologia nuova: è un dato del catalogo', () => {
    const surgelato = categoria('pesce')!.tipi.find((t) => t.reparto === 'surgelati')!
    const dopo = sostituisciVoce(listaEsempio, 'pesce-1', surgelato.nome)
    expect(voce(dopo, 'pesce-1').reparto).toBe('surgelati')
  })

  it('un nome fuori dalle alternative non cambia niente', () => {
    expect(sostituisciVoce(listaEsempio, 'carne_rossa-1', 'orata')).toBe(listaEsempio)
    expect(sostituisciVoce(listaEsempio, 'manuale-1', 'caffè in grani')).toBe(listaEsempio)
    expect(sostituisciVoce(listaEsempio, 'non-esiste', 'orata')).toBe(listaEsempio)
  })

  it('lascia intatta la lista di partenza', () => {
    sostituisciVoce(listaEsempio, 'carne_rossa-1', 'spezzatino di manzo')
    expect(voce(listaEsempio, 'carne_rossa-1').nome).toBe('manzo (fettine)')
  })

  it('scambia un tipo di verdura con uno di stagione, lasciando gli altri', () => {
    const nuovo = alternativeVoce(listaEsempio, voce(listaEsempio, 'verdura-1'), settembre)
      .consigliate[0]
    const dopo = sostituisciVoce(listaEsempio, 'verdura-1', nuovo)
    expect(dopo.voci.filter((v) => v.categoria === 'verdura').map((v) => v.nome)).toEqual([
      nuovo,
      'melanzane',
      'spinaci',
      'peperoni',
    ])
    expect(voce(dopo, 'verdura-1').reparto).toBe('ortofrutta')
  })

  it('si può scegliere anche un tipo fuori stagione', () => {
    const fuoriStagione = alternativeVoce(listaEsempio, voce(listaEsempio, 'frutta-1'), settembre)
      .fuoriStagione[0]
    const dopo = sostituisciVoce(listaEsempio, 'frutta-1', fuoriStagione)
    expect(voce(dopo, 'frutta-1').nome).toBe(fuoriStagione)
    expect(voce(dopo, 'frutta-1').reparto).toBe('ortofrutta')
  })

  it('al posto di una frutta non entra una verdura', () => {
    const verdura = Object.keys(stagionalita.verdura).find(
      (nome) => !listaEsempio.voci.some((v) => v.nome === nome),
    )!
    expect(sostituisciVoce(listaEsempio, 'frutta-1', verdura)).toBe(listaEsempio)
  })
})

describe('la sostituzione non tocca la memoria della rotazione (R7)', () => {
  let SQL: Awaited<ReturnType<typeof initSqlJs>>

  beforeAll(async () => {
    SQL = await initSqlJs()
  })

  it('le rotazioni salvate restano quelle del ciclo generato', async () => {
    const storage = await apriStorageSqlite(SQL, new PersistenzaMemoria())
    const rotazioni: Rotazione[] = [
      { categoria: 'pesce', ultimi: ['orata', 'merluzzo'] },
      { categoria: 'frutta', ultimi: ['uva', 'pere', 'fichi', 'mele'] },
    ]
    await storage.salvaLista(listaEsempio)
    await storage.salvaRotazioni(rotazioni)

    // Quello che fa l'interfaccia quando si sceglie un'alternativa: cambia la
    // lista e salva solo quella.
    const dopo = sostituisciVoce(listaEsempio, 'pesce-2', 'branzino')
    const nuovaFrutta = alternativeVoce(dopo, voce(dopo, 'frutta-1'), settembre).consigliate[0]
    await storage.salvaLista(sostituisciVoce(dopo, 'frutta-1', nuovaFrutta))

    // Lo storage non promette un ordine: conta che le righe siano quelle.
    expect(await storage.leggiRotazioni()).toEqual(expect.arrayContaining(rotazioni))
    expect(await storage.leggiRotazioni()).toHaveLength(rotazioni.length)
  })
})
