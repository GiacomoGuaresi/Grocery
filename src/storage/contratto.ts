// I test dell'interfaccia Storage: quello che il resto dell'app si aspetta da
// qualunque implementazione abbia sotto (doc/07-architettura-stack.md). Oggi li
// esegue supabase.test.ts.

import { describe, expect, it } from 'vitest'
import { listaEsempio } from '../domain/listaEsempio'
import { differenze } from '../domain/sincronia'
import { spuntaVoce } from '../domain/spunta'
import type { Lista, Voce } from '../domain/tipi'
import type { Storage } from './tipi'

export const lista: Lista = {
  id: 'lista-1',
  creataIl: '2026-09-07T08:00:00.000Z',
  voci: [
    {
      id: 'verdura-1',
      nome: 'Verdura',
      reparto: 'ortofrutta',
      categoria: 'verdura',
      origine: 'generata',
      comprata: false,
      quantita: 14,
      presi: 3,
    },
    // Una voce generata dalla v1, rimasta nella lista al passaggio: niente contatore.
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

/** La lista con `presi` cambiato sulla voce: come farà il contatore (Step V4). */
export function conPresi(l: Lista, id: string, presi: number): Lista {
  return { ...l, voci: l.voci.map((voce) => (voce.id === id ? { ...voce, presi } : voce)) }
}

/** `apriVuoto` dà uno storage senza niente dentro, uno nuovo a ogni test. */
export function verificaContratto(apriVuoto: () => Promise<Storage>): void {
  describe('lettura e scrittura della lista', () => {
    it('su un database vuoto non c e nessuna lista', async () => {
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
      const [verdura, pesce, manuale] = (await storage.leggiListaCorrente())!.voci
      expect(verdura).toMatchObject({ quantita: 14, presi: 3 })
      expect(pesce).not.toHaveProperty('quantita')
      expect(pesce).not.toHaveProperty('presi')
      expect(pesce.categoria).toBe('pesce')
      expect(manuale).not.toHaveProperty('categoria')
      expect(manuale).not.toHaveProperty('quantita')
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

    it('tiene una sola lista: salvarne una nuova cancella la precedente', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
      await storage.salvaLista(nuova)
      expect(await storage.leggiListaCorrente()).toEqual(nuova)
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

    it('presi segue la stessa regola: sulla stessa voce vince il numero più recente', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaVoci(lista.id, differenze(lista, conPresi(lista, 'verdura-1', 5)), alle('10:05'))
      await storage.salvaVoci(lista.id, differenze(lista, conPresi(lista, 'verdura-1', 4)), alle('10:00'))
      expect((await storage.leggiListaCorrente())?.voci[0].presi).toBe(5)
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

    it('le scritture per una lista già sostituita non toccano quella nuova', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
      await storage.salvaLista(nuova)
      await storage.salvaVoci(lista.id, differenze(lista, spuntaVoce(lista, 'pesce-1')), alle('10:00'))
      await storage.salvaVoci(lista.id, { voci: [], eliminate: ['manuale-1'] }, alle('10:00'))
      expect(await storage.leggiListaCorrente()).toEqual(nuova)
    })

    it('le eliminate della lista vecchia non valgono per quella nuova', async () => {
      const storage = await apriVuoto()
      await storage.salvaLista(lista)
      await storage.salvaVoci(lista.id, { voci: [], eliminate: ['pesce-1'] }, alle('10:00'))
      const nuova: Lista = { ...lista, id: 'lista-2', creataIl: '2026-09-21T08:00:00.000Z' }
      await storage.salvaLista(nuova)
      await storage.salvaVoci(nuova.id, differenze(nuova, spuntaVoce(nuova, 'pesce-1')), alle('10:05'))
      expect((await storage.leggiListaCorrente())?.voci[1].comprata).toBe(true)
    })
  })
}
