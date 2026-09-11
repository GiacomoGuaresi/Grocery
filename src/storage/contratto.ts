// I test dell'interfaccia Storage: quello che il resto dell'app si aspetta da
// qualunque implementazione abbia sotto (doc/07-architettura-stack.md). Oggi li
// esegue supabase.test.ts.

import { describe, expect, it } from 'vitest'
import { listaEsempio } from '../domain/listaEsempio'
import { differenze } from '../domain/sincronia'
import { spuntaVoce } from '../domain/spunta'
import type { Lista, Rotazione, Voce } from '../domain/tipi'
import type { Storage } from './tipi'

export const lista: Lista = {
  id: 'lista-1',
  creataIl: '2026-09-07T08:00:00.000Z',
  stato: 'corrente',
  voci: [
    {
      id: 'verdura-1',
      nome: 'zucchine',
      reparto: 'ortofrutta',
      categoria: 'verdura',
      origine: 'generata',
      comprata: false,
      alternative: ['cavolfiore', 'finocchi'],
    },
    {
      id: 'pesce-1',
      nome: 'orata',
      reparto: 'pescheria',
      categoria: 'pesce',
      origine: 'generata',
      comprata: false,
    },
    {
      id: 'manuale-1',
      nome: 'caffè',
      reparto: 'dispensa',
      origine: 'manuale',
      comprata: true,
    },
  ],
}

/** L'ora di una modifica fatta il giorno della spesa, nella forma di `toISOString()`. */
export function alle(ora: string): string {
  return `2026-09-12T${ora}:00.000Z`
}

/** `apriVuoto` dà uno storage senza niente dentro, uno nuovo a ogni test. */
export function verificaContratto(apriVuoto: () => Promise<Storage>): void {
  describe('lettura e scrittura della lista', () => {
    it('su un database vuoto non c e nessuna lista corrente', async () => {
      const storage = await apriVuoto()
      expect(await storage.leggiListaCorrente()).toBeNull()
    })

    it('rilegge la lista esattamente com era', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      expect(await storage.leggiListaCorrente()).toEqual(lista)
    })

    it('tiene l ordine delle voci', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(listaEsempio)
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci.map((v) => v.id)).toEqual(listaEsempio.voci.map((v) => v.id))
    })

    it('non inventa i campi opzionali assenti', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const [, pesce, manuale] = (await storage.leggiListaCorrente())!.voci
      expect(pesce).not.toHaveProperty('alternative')
      expect(pesce.categoria).toBe('pesce')
      expect(manuale).not.toHaveProperty('categoria')
    })

    it('salvando di nuovo aggiorna invece di duplicare', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaLista(spuntaVoce(lista, 'pesce-1'))
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci).toHaveLength(lista.voci.length)
      expect(riletta?.voci.find((v) => v.id === 'pesce-1')?.comprata).toBe(true)
    })

    it('le voci tolte dalla lista spariscono', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaLista({ ...lista, voci: [lista.voci[1]] })
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci.map((v) => v.id)).toEqual(['pesce-1'])
    })

    it('le voci riordinate si rileggono nel nuovo ordine', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const rovesciata = { ...lista, voci: [...lista.voci].reverse() }
      await storage.salvaLista(rovesciata)
      expect(await storage.leggiListaCorrente()).toEqual(rovesciata)
    })

    it('tiene una sola lista corrente: la precedente viene archiviata', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
      await storage.salvaLista(nuova)
      expect((await storage.leggiListaCorrente())?.id).toBe('lista-2')
    })
  })

  describe('scrittura delle sole voci toccate', () => {
    it('una voce toccata cambia, le altre restano', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const spuntata = spuntaVoce(lista, 'pesce-1')
      await storage.salvaVoci(lista.id, differenze(lista, spuntata), alle('10:00'))
      expect(await storage.leggiListaCorrente()).toEqual(spuntata)
    })

    it('due dispositivi che spuntano voci diverse tengono entrambe le spunte', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      // Tutti e due partono dalla stessa lista, nessuno vede la spunta dell'altro.
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'pesce-1')), alle('10:00'))
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'verdura-1')), alle('10:01'))
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci.map((v) => v.comprata)).toEqual([true, true, true])
    })

    it('sulla stessa voce vince la modifica più recente', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'pesce-1')), alle('10:00'))
      await storage.salvaVoci(lista.id, { voci: [lista.voci[1]], eliminate: [] }, alle('10:05'))
      expect((await storage.leggiListaCorrente())?.voci[1].comprata).toBe(false)
    })

    // Step 16: una modifica fatta senza rete arriva quando torna, magari dopo
    // una più nuova fatta dall'altro dispositivo. Non deve coprirla.
    it('una modifica più vecchia arrivata dopo non copre quella più recente', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'pesce-1')), alle('10:05'))
      await storage.salvaVoci(lista.id, { voci: [lista.voci[1]], eliminate: [] }, alle('10:00'))
      expect((await storage.leggiListaCorrente())?.voci[1].comprata).toBe(true)
    })

    it('una voce eliminata non torna per una modifica rimasta indietro', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaVoci(lista.id, { voci: [], eliminate: ['pesce-1'] }, alle('10:00'))
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'pesce-1')), alle('10:05'))
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci.map((v) => v.id)).toEqual(['verdura-1', 'manuale-1'])
    })

    it('le voci nuove vanno in fondo, le tolte spariscono', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const nuova: Voce = { id: 'manuale-2', nome: 'sale', reparto: 'dispensa', origine: 'manuale', comprata: false }
      await storage.salvaVoci(lista.id, { voci: [nuova], eliminate: ['verdura-1'] }, alle('10:00'))
      const riletta = await storage.leggiListaCorrente()
      expect(riletta?.voci.map((v) => v.id)).toEqual(['pesce-1', 'manuale-1', 'manuale-2'])
      expect(riletta?.voci[2]).toEqual(nuova)
    })

    it('una lista archiviata non si tocca', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaLista({ ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' })
      await storage.salvaVoci(lista.id, { voci: [], eliminate: ['pesce-1'] }, alle('10:00'))
      expect((await storage.leggiLista(lista.id))?.voci).toHaveLength(lista.voci.length)
    })
  })

  describe('archivio', () => {
    /** Due generazioni di seguito: la prima lista finisce archiviata (F11). */
    async function conDueSpese() {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
      await storage.salvaLista(nuova)
      return storage
    }

    it('su un database senza liste passate e vuoto', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      expect(await storage.leggiArchivio()).toEqual([])
    })

    it('elenca le liste archiviate, non quella corrente', async () => {
      const storage = await conDueSpese()
      expect(await storage.leggiArchivio()).toEqual([
        {
          id: 'lista-1',
          creataIl: '2026-09-07T08:00:00.000Z',
          quanteVoci: 3,
          quanteComprate: 1,
        },
      ])
    })

    it('mette per prima la spesa più recente', async () => {
      const storage = await apriVuoto()
      for (const [id, creataIl] of [
        ['lista-1', '2026-08-10T08:00:00.000Z'],
        ['lista-2', '2026-08-24T08:00:00.000Z'],
        ['lista-3', '2026-09-07T08:00:00.000Z'],
      ]) {
        await storage.salvaLista({ ...lista, id, creataIl })
      }
      expect((await storage.leggiArchivio()).map((s) => s.id)).toEqual(['lista-2', 'lista-1'])
    })

    it('una lista archiviata si riapre intera, com era', async () => {
      const storage = await conDueSpese()
      expect(await storage.leggiLista('lista-1')).toEqual({ ...lista, stato: 'archiviata' })
    })

    it('per un id che non esiste non restituisce niente', async () => {
      const storage = await conDueSpese()
      expect(await storage.leggiLista('lista-mai-vista')).toBeNull()
    })
  })

  describe('rotazioni', () => {
    const rotazioni: Rotazione[] = [
      { categoria: 'pesce', ultimi: ['orata', 'branzino', 'cozze', 'polpo'] },
      { categoria: 'carne_rossa', ultimi: ['salsiccia', 'ossobuco di vitello'] },
      { categoria: 'frutta', ultimi: ['mele', 'pere', 'uva', 'fichi'] },
    ]

    it('parte vuota', async () => {
      const storage = await apriVuoto()
      expect(await storage.leggiRotazioni()).toEqual([])
    })

    it('rilegge quello che ha salvato', async () => {
      const storage = await apriVuoto()
      await storage.salvaRotazioni(rotazioni)
      expect(await storage.leggiRotazioni()).toEqual(
        [...rotazioni].sort((a, b) => a.categoria.localeCompare(b.categoria)),
      )
    })

    it('sostituisce la memoria precedente invece di accumularla', async () => {
      const storage = await apriVuoto()
      await storage.salvaRotazioni(rotazioni)
      await storage.salvaRotazioni([{ categoria: 'pesce', ultimi: ['sgombro'] }])
      expect(await storage.leggiRotazioni()).toEqual([{ categoria: 'pesce', ultimi: ['sgombro'] }])
    })

    it('una memoria vuota resta un elenco vuoto', async () => {
      const storage = await apriVuoto()
      await storage.salvaRotazioni([{ categoria: 'uova', ultimi: [] }])
      expect(await storage.leggiRotazioni()).toEqual([{ categoria: 'uova', ultimi: [] }])
    })

    // Scegliere un'alternativa salva solo la lista: la memoria del ciclo resta
    // quella della generazione (R7).
    it('salvare la lista non tocca le rotazioni', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(listaEsempio)
      await storage.salvaRotazioni(rotazioni)
      await storage.salvaLista({ ...listaEsempio, voci: listaEsempio.voci.slice(1) })
      expect(await storage.leggiRotazioni()).toEqual(
        [...rotazioni].sort((a, b) => a.categoria.localeCompare(b.categoria)),
      )
    })
  })
}
