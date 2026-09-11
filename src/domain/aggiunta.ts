// Inserimento manuale di una voce (Step 6 di doc/12-piano-sviluppo.md).
// Il confronto col catalogo prodotti è tollerante: chi scrive in corsia non
// bada a maiuscole, accenti o spazi di troppo. Il catalogo non impara: un
// prodotto che non c'è finisce nel reparto "altro" (doc/04-funzionalita.md).

import { prodotti, type Prodotto } from './dati'
import { despuntaVoce } from './spunta'
import type { Lista, Voce } from './tipi'

/**
 * La forma con cui si confrontano i nomi: minuscolo, senza accenti, senza
 * spazi ai bordi e con gli spazi interni ridotti a uno. Così "  Caffè " e
 * "caffe" sono lo stesso prodotto.
 */
export function normalizza(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const prodottiNormalizzati = prodotti.map((prodotto) => ({
  prodotto,
  chiave: normalizza(prodotto.nome),
}))

/** Il prodotto del catalogo con questo nome, se c'è. */
export function trovaProdotto(testo: string): Prodotto | undefined {
  const chiave = normalizza(testo)
  if (chiave === '') return undefined
  return prodottiNormalizzati.find((voce) => voce.chiave === chiave)?.prodotto
}

/**
 * I prodotti del catalogo da proporre mentre si scrive. Prima quelli che
 * iniziano col testo digitato, poi quelli che lo contengono più avanti nel
 * nome; dentro i due gruppi resta l'ordine del catalogo. A campo vuoto non
 * si propone niente.
 */
export function suggerimenti(testo: string, limite = 6): Prodotto[] {
  const chiave = normalizza(testo)
  if (chiave === '') return []

  const inizia: Prodotto[] = []
  const contiene: Prodotto[] = []
  for (const { prodotto, chiave: nome } of prodottiNormalizzati) {
    if (nome.startsWith(chiave)) inizia.push(prodotto)
    else if (nome.includes(chiave)) contiene.push(prodotto)
  }
  return [...inizia, ...contiene].slice(0, limite)
}

/**
 * Un id che non collide con quelli delle voci generate, tutti per categoria.
 * L'interfaccia lo sceglie prima di aggiungere, per sapere quale riga far
 * lampeggiare.
 */
export function nuovoId(): string {
  return `manuale-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * La voce da aggiungere alla lista. Se il nome è nel catalogo eredita il suo
 * reparto e la sua grafia; altrimenti resta com'è stato scritto e finisce in
 * "altro", senza scegliere il reparto al volo.
 */
export function creaVoceManuale(nome: string, id: string = nuovoId()): Voce {
  const prodotto = trovaProdotto(nome)
  return {
    id,
    nome: prodotto?.nome ?? nome.trim().replace(/\s+/g, ' '),
    reparto: prodotto?.reparto ?? 'altro',
    origine: 'manuale',
    comprata: false,
  }
}

/**
 * La voce della lista con questo nome, se c'è già: il confronto è quello
 * tollerante del catalogo, quindi "Uova " e "uova" sono la stessa voce.
 */
export function voceGiaPresente(lista: Lista, nome: string): Voce | undefined {
  const chiave = normalizza(nome)
  if (chiave === '') return undefined
  return lista.voci.find((voce) => normalizza(voce.nome) === chiave)
}

/**
 * Aggiunge la voce in fondo alla lista. Le voci non si ripetono mai: se è
 * già da prendere la lista resta com'è (l'interfaccia avvisa), se era già
 * presa torna da prendere. Un nome vuoto non aggiunge niente.
 */
export function aggiungiVoce(lista: Lista, nome: string, id?: string): Lista {
  if (normalizza(nome) === '') return lista
  const presente = voceGiaPresente(lista, nome)
  if (presente) return presente.comprata ? despuntaVoce(lista, presente.id) : lista
  return { ...lista, voci: [...lista.voci, creaVoceManuale(nome, id)] }
}
