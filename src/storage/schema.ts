// Schema SQL dello stato — le entità di doc/06-modello-dati.md.
// È scritto in SQL standard perché lo stesso schema deve reggere su Postgres
// quando arriverà Supabase (Step 13).

/**
 * La memoria della rotazione era una posizione nel catalogo; da quando la
 * scelta è casuale (doc/03, R2) è l'elenco delle tipologie dell'ultimo ciclo.
 * Sui database già creati in sviluppo la tabella vecchia si butta: è memoria
 * di comodo, si ricostruisce alla prima generazione.
 */
export const MIGRAZIONE_ROTAZIONI = `DROP TABLE IF EXISTS rotazioni;`

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS liste (
  id         TEXT PRIMARY KEY,
  creata_il  TEXT NOT NULL,
  stato      TEXT NOT NULL CHECK (stato IN ('corrente', 'archiviata'))
);

CREATE TABLE IF NOT EXISTS voci (
  lista_id     TEXT NOT NULL REFERENCES liste(id) ON DELETE CASCADE,
  id           TEXT NOT NULL,
  posizione    INTEGER NOT NULL,
  nome         TEXT NOT NULL,
  reparto      TEXT NOT NULL,
  categoria    TEXT,
  origine      TEXT NOT NULL CHECK (origine IN ('generata', 'manuale')),
  comprata     INTEGER NOT NULL CHECK (comprata IN (0, 1)),
  alternative  TEXT,
  PRIMARY KEY (lista_id, id)
);

CREATE TABLE IF NOT EXISTS elementi (
  lista_id   TEXT NOT NULL,
  voce_id    TEXT NOT NULL,
  posizione  INTEGER NOT NULL,
  nome       TEXT NOT NULL,
  comprato   INTEGER NOT NULL CHECK (comprato IN (0, 1)),
  PRIMARY KEY (lista_id, voce_id, nome),
  FOREIGN KEY (lista_id, voce_id) REFERENCES voci(lista_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rotazioni (
  categoria  TEXT PRIMARY KEY,
  ultimi     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS liste_stato ON liste(stato);
`
