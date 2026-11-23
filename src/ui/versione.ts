// La versione in esecuzione: commit e ora della build, scritti da vite.config.ts
// (`define`) e pubblicati accanto all'app in versione.json.

/** Il commit di chi è in esecuzione, come "a1b2c3d"; "sviluppo" con `npm run dev` fuori da git. */
export const COMMIT = __COMMIT__

/** "Versione a1b2c3d · 23 nov 2026, 10:42": la riga in fondo al menu. */
export function testoVersione(commit: string = __COMMIT__, costruita: string = __COSTRUITA__): string {
  const quando = new Date(costruita)
  if (Number.isNaN(quando.getTime())) return `Versione ${commit}`
  const data = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(quando)
  return `Versione ${commit} · ${data}`
}

/**
 * Se il commit pubblicato è un altro rispetto a quello in esecuzione. Senza un
 * commit pubblicato (rete assente, file mancante) o in sviluppo, no: meglio un
 * avviso in meno che uno a vuoto.
 */
export function versioneNuova(pubblicato: string | undefined, inEsecuzione: string): boolean {
  if (!pubblicato || pubblicato === 'sviluppo' || inEsecuzione === 'sviluppo') return false
  return pubblicato !== inEsecuzione
}
