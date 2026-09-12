import type { ReactNode } from 'react'
import './Icona.css'

/**
 * I disegni delle icone: tratti su una griglia 24×24, ripresi da Lucide
 * (licenza ISC). Stanno qui dentro invece che in una libreria perché ne
 * servono poche, e così l'app non si porta dietro un pacchetto in più.
 */
const disegni = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  chiudi: <path d="M18 6 6 18M6 6l12 12" />,
  carrello: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  calendario: (
    <>
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  archivio: (
    <>
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
    </>
  ),
  scintille: (
    <>
      <path d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </>
  ),
  mela: (
    <>
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </>
  ),
  carota: (
    <>
      <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46" />
      <path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z" />
      <path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z" />
    </>
  ),
  cesto: (
    <path d="m15 11-1 9M19 11l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9" />
  ),
  altro: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  avanti: <path d="m9 18 6-6-6-6" />,
  indietro: <path d="m15 18-6-6 6-6" />,
  giu: <path d="m6 9 6 6 6-6" />,
  matita: (
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>
  ),
  spunta: <path d="M20 6 9 17l-5-5" />,
  meno: <path d="M5 12h14" />,
  piu: <path d="M5 12h14M12 5v14" />,
  scarica: <path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" />,
} satisfies Record<string, ReactNode>

export type NomeIcona = keyof typeof disegni

/**
 * Un'icona dell'app. È sempre decorativa: il significato lo porta il testo
 * accanto o l'aria-label del bottone che la contiene. Prende il colore dal
 * testo (currentColor) ed è grande quanto il suo font-size (1em), così la si
 * regola dal CSS di chi la usa, come fosse una lettera.
 */
export function Icona({ nome, className }: { nome: NomeIcona; className?: string }) {
  return (
    <svg
      className={className ? `icona ${className}` : 'icona'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {disegni[nome]}
    </svg>
  )
}
