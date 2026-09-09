# 02 — Routine alimentare

Lo schema settimanale seguito dagli utenti. È la sorgente di verità da cui
l'algoritmo deriva cosa comprare.

| | LUN | MAR | MER | GIO | VEN | SAB | DOM |
|---|---|---|---|---|---|---|---|
| **COLAZIONE** | — | — | — | — | — | — | — |
| **SPUNTINO** | frutta / yogurt / salato | idem | idem | idem | idem | idem | idem |
| **PRANZO** | primo + frutta, secondo + contorno, frutta | idem | idem | idem | idem | idem | idem |
| **SPUNTINO** | frutta / yogurt / salato | idem | idem | idem | idem | idem | idem |
| **CENA** | carne rossa | formaggio | pesce | uova | carne bianca | pesce | affettati |

## Cosa entra nella lista

L'app si occupa della **cena** (fonte proteica + contorno) e della **frutta**.

| Pasto | Gestito dall'app | Motivo |
|---|---|---|
| Colazione | ❌ No | Esclusa; se servono biscotti o simili si aggiungono a mano |
| Spuntini | ❌ No | Esclusi come pasto (ma la frutta si compra, vedi sotto) |
| Pranzo | ❌ No | Si pranza tipicamente a lavoro |
| **Cena** | ✅ Sì | Fonte proteica + contorno |
| **Frutta** | ✅ Sì | Consumo trasversale, 2 volte al giorno |

### Frutta
Pur non gestendo pranzo e spuntini, la frutta **entra nella lista della spesa**: se ne
consumano **2 porzioni al giorno**, tutti i giorni. L'algoritmo propone **4 tipi di
frutta di stagione** per ciclo.

## Struttura della cena
Ogni cena è composta da **fonte proteica + contorno + pane**.

- **Fonte proteica** — fissa per giorno della settimana (vedi tabella sotto), la
  *tipologia* specifica ruota.
- **Contorno** — sempre **verdura**, al massimo **patate**. **Mai legumi.**
- **Pane** — comprato a parte e congelato: **NON entra nella lista della spesa**.

## Frequenze settimanali derivate

| Fonte proteica | Giorno | Volte/settimana | Volte per ciclo (2 sett.) |
|---|---|---|---|
| Carne rossa | lunedì | 1 | 2 |
| Formaggio | martedì | 1 | 2 |
| Pesce | mercoledì, sabato | 2 | 4 |
| Uova | giovedì | 1 | 2 |
| Carne bianca | venerdì | 1 | 2 |
| Affettati | domenica | 1 | 2 |

Totale: **14 cene** per ciclo.

## Assunzioni correnti
- Si cena **sempre a casa**, tutte le sere: nessun pasto viene saltato.
  La gestione dei pasti saltati (cene fuori) è uno **sviluppo futuro**, vedi
  [09 — Roadmap](09-roadmap.md).
- La routine vale per **entrambi gli utenti**, ma l'app **non gestisce quantità né
  grammature**: propone solo cosa comprare.
- Interessa l'**ingrediente primario**, non la ricetta: la preparazione la decidono
  gli utenti.
