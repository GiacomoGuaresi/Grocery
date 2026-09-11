/**
 * Genera lo sfondo del contenuto principale: poche icone grandi a tema cucina,
 * bianche sul fondo panna, sparse a caso su un riquadro che si ripete senza
 * giunture (come i doodle dello sfondo di WhatsApp).
 *
 * Le icone sono quelle dell'app (src/ui/Icona.tsx), disegnate col componente
 * stesso: lo sfondo resta coerente col resto dell'interfaccia. Il seed è fisso,
 * quindi rilanciando lo script esce sempre lo stesso sfondo.
 *
 * Uso: npm run sfondo  →  src/ui/sfondo-cucina.svg
 */
import { writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Icona, type NomeIcona } from '../src/ui/Icona'

const USCITA = new URL('../src/ui/sfondo-cucina.svg', import.meta.url)

/** Solo le icone a tema cibo/cucina. */
const ICONE: NomeIcona[] = ['mela', 'carota', 'cesto', 'carrello']

const LATO = 480 // px del riquadro, mostrato in CSS a questa grandezza
const QUANTE = 12 // icone per riquadro: poche, per non affollare la lista
const DIMENSIONE = [64, 104] as const // px
const ROTAZIONE = [-25, 25] as const // gradi
const DISTANZA_MINIMA = 118 // px tra i centri, così le icone non si toccano
const TRATTO = 3 // px a schermo, uguale per le icone grandi e per le piccole
const COLORE = '#fff'
const SEED = 20260911

/** Generatore pseudo-casuale con seed (mulberry32): risultato riproducibile. */
function generatore(seed: number) {
  let stato = seed >>> 0
  return () => {
    stato = (stato + 0x6d2b79f5) >>> 0
    let t = stato
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const caso = generatore(SEED)
const tra = ([min, max]: readonly [number, number]) => min + caso() * (max - min)
const cifre = (n: number) => String(Math.round(n * 100) / 100)

/** Il contenuto dell'<svg> dell'icona: i tratti sulla griglia 24×24. */
function tratti(nome: NomeIcona) {
  return renderToStaticMarkup(createElement(Icona, { nome }))
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
}

/** Distanza sul riquadro che si ripete: il bordo destro tocca il sinistro. */
function distanza(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = Math.min(Math.abs(a.x - b.x), LATO - Math.abs(a.x - b.x))
  const dy = Math.min(Math.abs(a.y - b.y), LATO - Math.abs(a.y - b.y))
  return Math.hypot(dx, dy)
}

// Le posizioni: si scartano quelle troppo vicine a un'icona già messa.
const posti: { x: number; y: number }[] = []
for (let tentativi = 0; posti.length < QUANTE && tentativi < 10_000; tentativi++) {
  const posto = { x: caso() * LATO, y: caso() * LATO }
  if (posti.every((p) => distanza(p, posto) >= DISTANZA_MINIMA)) posti.push(posto)
}

const gruppi = posti.flatMap(({ x, y }, i) => {
  const nome = ICONE[i % ICONE.length]
  const lato = tra(DIMENSIONE)
  const scala = lato / 24
  const angolo = tra(ROTAZIONE)
  // Ruotata, l'icona occupa al massimo la diagonale del suo quadrato.
  const raggio = (lato * Math.SQRT2) / 2

  // L'icona e le sue copie oltre i bordi, per le ripetizioni senza giunture.
  const copie = []
  for (const dx of [-LATO, 0, LATO]) {
    for (const dy of [-LATO, 0, LATO]) {
      const cx = x + dx
      const cy = y + dy
      if (cx + raggio < 0 || cx - raggio > LATO || cy + raggio < 0 || cy - raggio > LATO) continue
      copie.push(
        `<g transform="translate(${cifre(cx)} ${cifre(cy)}) rotate(${cifre(angolo)}) ` +
          `scale(${cifre(scala)}) translate(-12 -12)" stroke-width="${cifre(TRATTO / scala)}">` +
          `${tratti(nome)}</g>`,
      )
    }
  }
  return copie
})

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LATO}" height="${LATO}" viewBox="0 0 ${LATO} ${LATO}">` +
  `<g fill="none" stroke="${COLORE}" stroke-linecap="round" stroke-linejoin="round">` +
  gruppi.join('') +
  `</g></svg>\n`

writeFileSync(USCITA, svg)
console.log(`Salvato ${USCITA.pathname}: ${posti.length} icone su ${LATO}×${LATO}px`)
