// Caricamento e tipizzazione dei dati statici di src/data — vedi doc/05-dati-statici.md.
// Unico punto in cui i JSON vengono importati: il resto del codice passa da qui e
// lavora solo su tipi, senza mai toccare la forma grezza dei file.

import catalogoJson from '../data/catalogo.json'
import prodottiJson from '../data/prodotti.json'
import repartiJson from '../data/reparti.json'
import routineJson from '../data/routine.json'
import stagionalitaJson from '../data/stagionalita.json'
import type { IdCategoria, IdGruppo, IdReparto } from './tipi'

/** 1 = gennaio ... 12 = dicembre. */
export type Mese = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type GruppoFisso = IdGruppo

/** Le categorie del catalogo: le fonti proteiche della routine più verdura e frutta. */
export type IdVoceCatalogo = IdCategoria | IdGruppo

/** Vero per le categorie di verdura e frutta, che vengono dalla stagionalità. */
export function eGruppoFisso(categoria: string | undefined): categoria is GruppoFisso {
  return categoria === 'verdura' || categoria === 'frutta'
}

export interface Reparto {
  id: IdReparto
  nome: string
}

export interface Categoria {
  id: IdVoceCatalogo
  etichetta: string
  /** Il reparto in cui finisce la voce generata. */
  reparto: IdReparto
  /**
   * I suggerimenti brevi del popup (F14), nell'ordine in cui leggerli. Per
   * verdura e frutta sono tutti i tipi della stagionalità; vuoto per le uova.
   */
  consigli: string[]
}

export interface GiornoRoutine {
  /** 1 = lunedì ... 7 = domenica. */
  giorno: number
  nome: string
  categoria: IdCategoria
}

export interface Prodotto {
  nome: string
  reparto: IdReparto
}

/** Come sta una categoria in catalogo.json, prima di risolvere i consigli. */
interface CategoriaJson {
  etichetta: string
  reparto: string
  consigli?: string[] | 'stagionalita'
}

/** Gli 8 reparti nell'ordine del percorso in corsia. */
export const reparti: Reparto[] = repartiJson.reparti as Reparto[]

/** Mesi di disponibilità per ogni verdura e ogni frutto, Nord Italia. */
export const stagionalita: Record<GruppoFisso, Record<string, Mese[]>> = {
  verdura: stagionalitaJson.verdura as Record<string, Mese[]>,
  frutta: stagionalitaJson.frutta as Record<string, Mese[]>,
}

/** Le categorie, nell'ordine in cui compaiono nel catalogo. */
export const categorie: Categoria[] = Object.entries(
  catalogoJson.categorie as Record<string, CategoriaJson>,
).map(([id, categoria]) => ({
  id: id as IdVoceCatalogo,
  etichetta: categoria.etichetta,
  reparto: categoria.reparto as IdReparto,
  consigli:
    categoria.consigli === 'stagionalita'
      ? eGruppoFisso(id)
        ? Object.keys(stagionalita[id])
        : []
      : (categoria.consigli ?? []),
}))

/** Fonte proteica per giorno della settimana. */
export const giorniRoutine: GiornoRoutine[] = routineJson.giorni as GiornoRoutine[]

/** Verdura e frutta: quanti pasti al giorno ne servono (doc/03, R2). */
export const pastiPerGiorno: Record<GruppoFisso, number> = routineJson.pastiPerGiorno

/** Mappa prodotto → reparto per l'autocompletamento dell'inserimento manuale. */
export const prodotti: Prodotto[] = prodottiJson.prodotti as Prodotto[]

const repartiPerId = new Map(reparti.map((r) => [r.id, r]))
const categoriePerId = new Map(categorie.map((c) => [c.id, c]))

export function reparto(id: IdReparto): Reparto | undefined {
  return repartiPerId.get(id)
}

export function categoria(id: IdVoceCatalogo): Categoria | undefined {
  return categoriePerId.get(id)
}

/** Posizione del reparto nel percorso in corsia: serve a ordinare i gruppi della lista. */
export function ordineReparto(id: IdReparto): number {
  return reparti.findIndex((r) => r.id === id)
}

/** I nomi del gruppo disponibili nel mese, nell'ordine del JSON. */
export function diStagione(gruppo: GruppoFisso, mese: Mese): string[] {
  return Object.entries(stagionalita[gruppo])
    .filter(([, mesi]) => mesi.includes(mese))
    .map(([nome]) => nome)
}

export const mesi: Mese[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
