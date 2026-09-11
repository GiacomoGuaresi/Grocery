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

/** Vero per le categorie di verdura e frutta, che vengono dalla stagionalità. */
export function eGruppoFisso(categoria: string | undefined): categoria is GruppoFisso {
  return categoria === 'verdura' || categoria === 'frutta'
}

export interface Reparto {
  id: IdReparto
  nome: string
}

/** Una tipologia del catalogo di rotazione, col reparto in cui si compra. */
export interface Tipo {
  nome: string
  reparto: IdReparto
}

export interface Categoria {
  id: IdCategoria
  etichetta: string
  /** Le categorie fisse (uova) hanno un solo tipo e non ruotano. */
  fisso: boolean
  tipi: Tipo[]
}

export interface GiornoRoutine {
  /** 1 = lunedì ... 7 = domenica. */
  giorno: number
  nome: string
  categoria: IdCategoria
}

export interface ConfigGruppoFisso {
  tipiPerCiclo: number
  reparto: IdReparto
}

export interface Prodotto {
  nome: string
  reparto: IdReparto
}

/** Gli 8 reparti nell'ordine del percorso in corsia. */
export const reparti: Reparto[] = repartiJson.reparti as Reparto[]

/** Le categorie di rotazione, nell'ordine in cui compaiono nel catalogo. */
export const categorie: Categoria[] = Object.entries(catalogoJson.categorie).map(
  ([id, categoria]) => ({
    id: id as IdCategoria,
    etichetta: categoria.etichetta,
    fisso: 'fisso' in categoria && categoria.fisso === true,
    tipi: categoria.tipi as Tipo[],
  }),
)

/** Fonte proteica per giorno della settimana. */
export const giorniRoutine: GiornoRoutine[] = routineJson.giorni as GiornoRoutine[]

/** Verdura e frutta: quanti tipi per ciclo e in che reparto finiscono. */
export const gruppiFissi: Record<GruppoFisso, ConfigGruppoFisso> = {
  verdura: routineJson.gruppiFissi.verdura as ConfigGruppoFisso,
  frutta: routineJson.gruppiFissi.frutta as ConfigGruppoFisso,
}

/** Mesi di disponibilità per ogni verdura e ogni frutto, Nord Italia. */
export const stagionalita: Record<GruppoFisso, Record<string, Mese[]>> = {
  verdura: stagionalitaJson.verdura as Record<string, Mese[]>,
  frutta: stagionalitaJson.frutta as Record<string, Mese[]>,
}

/** Mappa prodotto → reparto per l'autocompletamento dell'inserimento manuale. */
export const prodotti: Prodotto[] = prodottiJson.prodotti as Prodotto[]

const repartiPerId = new Map(reparti.map((r) => [r.id, r]))
const categoriePerId = new Map(categorie.map((c) => [c.id, c]))

export function reparto(id: IdReparto): Reparto | undefined {
  return repartiPerId.get(id)
}

export function categoria(id: IdCategoria): Categoria | undefined {
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
