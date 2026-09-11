# 05 — Dati statici

Tutte le configurazioni (cataloghi alimenti, categorie, stagionalità, routine)
vivono come **file JSON versionati nel repository**, non nel DB: un commit
è sufficiente per rilasciare un aggiornamento dei dati.

Posizione prevista: `src/data/*.json`.

| File | Contenuto |
|---|---|
| `routine.json` | Fonte proteica per giorno della settimana |
| `catalogo.json` | Tipologie per categoria, con il relativo reparto |
| `stagionalita.json` | Verdura e frutta per mese (Nord Italia) |
| `reparti.json` | Reparti del supermercato e loro ordine in corsia |
| `prodotti.json` | Catalogo `prodotto → reparto` per l'autocompletamento manuale |

L'**ordine** degli elenchi è indifferente: le tipologie si pescano a caso
([03](03-algoritmo-generazione.md), R2), non c'è niente da mettere in cima.

---

## Reparti (ordine in corsia)
1. **Ortofrutta**
2. **Macelleria**
3. **Pescheria** — pesce fresco e surgelato
4. **Salumi** — banco frigo, **preconfezionati** (non il banco gastronomia)
5. **Latticini, formaggi e uova**
6. **Dispensa**
7. **Casa e igiene**
8. **Altro** — prodotti manuali non presenti in `prodotti.json`

Ordine **fissato nel JSON**, non riordinabile dall'app.

Formaggi e affettati si comprano **preconfezionati**, non a un banco servito. Gli
affettati stanno in *Salumi*; i formaggi stanno coi latticini, in *Latticini,
formaggi e uova*.

**Non c'è un reparto Surgelati**: ogni surgelato sta nel reparto del prodotto
corrispondente. Il pesce si compra sia fresco sia surgelato, e sta sempre in
*Pescheria* (il salmone affumicato come l'orata); le verdure surgelate in
*Ortofrutta*, e così via.

---

## Cataloghi di rotazione

### Carne rossa — reparto: Macelleria
Manzo: fettine · macinato · hamburger · tagliata · controfiletto · costata ·
spezzatino · straccetti · bocconcini · arrosto · brasato (cappello del prete) ·
filetto · roast beef

Maiale: braciole · lonza · arista · filetto · salsiccia · spezzatino · costine ·
scaloppine · stinco

Vitello: fettine · nodino · ossobuco · arrosto · spezzatino · cotoletta · scaloppine

Altro: agnello (costolette) · agnello (cosciotto) · arrosticini · cavallo (fettine) ·
cavallo (tagliata)

### Carne bianca — reparto: Macelleria
Pollo: petto · fettine · cosce · sovracosce · alette · fusi · pollo intero ·
macinato · hamburger · straccetti · spiedini · cotoletta · bocconcini · arrosto

Tacchino: fesa · fettine · bocconcini · macinato · hamburger · fusi · arrosto ·
spiedini · cotoletta

Altro: coniglio (a pezzi) · coniglio (busto) · faraona

### Pesce — reparto: Pescheria (fresco e surgelato)
Pesce: salmone (filetto) · salmone (trancio) · orata · branzino · merluzzo ·
nasello · platessa · sogliola · pesce spada · tonno fresco · trota · trota salmonata ·
sgombro · alici · sardine · rana pescatrice · halibut · baccalà · persico ·
salmone affumicato

Molluschi e crostacei: gamberi · gamberoni · mazzancolle · calamari · totani ·
seppie · polpo · moscardini · cozze · vongole · capesante

### Formaggio — reparto: Latticini, formaggi e uova
Freschi: mozzarella · mozzarella di bufala · burrata · stracciatella · stracchino ·
crescenza · robiola · squacquerone · ricotta · primo sale · caprino · casatella ·
quartirolo · tomino · feta · formaggio spalmabile

Semi-stagionati e stagionati: scamorza · scamorza affumicata · provola · provolone ·
asiago · fontina · montasio · raschera · caciotta · pecorino · emmental · edamer ·
groviera

Erborinati e a pasta molle: gorgonzola dolce · gorgonzola piccante · taleggio ·
brie · camembert

### Affettati — reparto: Salumi
Prosciutto crudo · prosciutto crudo di Parma · prosciutto di San Daniele ·
prosciutto cotto · prosciutto cotto alle erbe · bresaola · speck · mortadella ·
salame Milano · salame Napoli · salame felino · spianata · coppa · capocollo ·
pancetta · lonzino · culatello · strolghino · porchetta · tacchino arrosto ·
petto di pollo arrosto · fesa di tacchino affumicata

### Uova — reparto: Latticini, formaggi e uova
Voce fissa, nessuna rotazione.

---

## Contorni

Solo **verdure**, incluse le **patate** (che entrano nella rotazione come le altre).
**Mai legumi.**

L'algoritmo propone **4 verdure diverse per ciclo di acquisti**, da usare come
contorno lungo tutti i giorni delle due settimane: non un contorno diverso per ogni
cena, ma quattro verdure che si ripetono. Sono scelte a caso tra quelle **di
stagione** nel mese di generazione; le patate sono disponibili tutto l'anno.

Si comprano **tutte insieme** in un'unica spesa: nessuna divisione tra prima e
seconda settimana.

## Frutta

La frutta **entra nella lista**: si consuma **2 volte al giorno**, ogni giorno.
Come per le verdure, l'algoritmo propone **4 tipi di frutta per ciclo**, scelti a
caso tra quelli **di stagione**.

Si compra **in un'unica volta**, senza divisione tra prima e seconda settimana:
l'app suggerisce solo *quali tipi* comprare, non le quantità né quando. Se serve
ricomprarne, se ne occupano gli utenti fuori dall'app.

---

## Stagionalità

- **Area:** Nord Italia.
- **Granularità:** mensile.
- **Fonte:** tabella **statica nel repo** — comoda, stabile, disponibile offline.

Forma prevista (numeri = mesi):

```json
{
  "verdura": { "zucchine": [4,5,6,7,8,9,10] },
  "frutta":  { "fragole":  [4,5,6,7] }
}
```

### Verdura — Nord Italia

| Verdura | Mesi |
|---|---|
| Agretti | 3-5 |
| Asparagi | 4-6 |
| Barbabietole | 6-11 |
| Bietole | 3-11 |
| Broccoli | 10-3 |
| Carciofi | 10-5 |
| Cardi | 10-1 |
| Carote | tutto l'anno |
| Catalogna | 10-3 |
| Cavolfiore | 9-3 |
| Cavolo cappuccio | 9-3 |
| Cavolo nero | 10-2 |
| Cavolo romanesco | 10-2 |
| Cavolini di Bruxelles | 10-2 |
| Cetrioli | 5-9 |
| Cicoria | 9-4 |
| Cime di rapa | 10-3 |
| Cipolle | tutto l'anno |
| Coste | 4-11 |
| Fagiolini | 6-9 |
| Finocchi | 10-4 |
| Funghi coltivati | tutto l'anno |
| Funghi porcini | 9-10 |
| Indivia | 9-3 |
| Lattuga | 3-11 |
| Melanzane | 6-10 |
| Peperoni | 6-10 |
| Pomodori | 5-10 |
| Porri | 9-4 |
| Patate | tutto l'anno |
| Puntarelle | 11-2 |
| Radicchio | 9-3 |
| Rape | 10-3 |
| Ravanelli | 3-10 |
| Rucola | 3-11 |
| Scarola | 9-3 |
| Sedano | 6-12 |
| Sedano rapa | 10-2 |
| Songino (valeriana) | tutto l'anno |
| Spinaci | 9-4 |
| Topinambur | 10-3 |
| Verza | 10-3 |
| Zucca | 9-1 |
| Zucchine | 4-10 |

### Frutta — Nord Italia

| Frutta | Mesi |
|---|---|
| Albicocche | 6-8 |
| Anguria | 6-8 |
| Arance | 12-4 |
| Cachi | 10-12 |
| Castagne | 9-11 |
| Ciliegie | 5-7 |
| Clementine | 11-2 |
| Fichi | 8-9 |
| Fragole | 4-7 |
| Kiwi | 10-5 |
| Lamponi | 6-9 |
| Limoni | tutto l'anno |
| Mandarini | 11-2 |
| Mele | tutto l'anno |
| Melone | 6-9 |
| Mirtilli | 6-9 |
| More | 7-9 |
| Nespole | 4-5 |
| Nettarine | 6-9 |
| Pere | 8-3 |
| Pesche | 6-9 |
| Pompelmo | 12-5 |
| Prugne (susine) | 7-9 |
| Ribes | 6-8 |
| Uva | 8-11 |
| Banane | tutto l'anno (importazione) |
| Ananas | tutto l'anno (importazione) |

---

## Quantità

L'app **non indica quantità né grammature**: propone solo *cosa* comprare. Le
quantità si decidono in corsia.

Le grammature indicative a persona sono un possibile **sviluppo futuro**, non
implementate ora.

---

## Catalogo prodotti per l'autocompletamento
`prodotti.json` mappa `prodotto → reparto` ed è usato dall'inserimento manuale (F4)
per suggerire il nome mentre si scrive e assegnare il reparto. Comprende anche
non-alimentari (detersivi, igiene, casa).

Il catalogo **non impara**: i prodotti nuovi digitati a mano non vi entrano
automaticamente. Se un prodotto ricorre spesso, viene aggiunto al JSON con un commit.

Si parte da un **elenco ridotto di prodotti base**, da espandere nel tempo con i
prodotti che effettivamente ricorrono.

### Ortofrutta
verdure surgelate · patatine surgelate

### Pescheria
pesce surgelato

### Dispensa
pasta · riso · farina · pane in cassetta · fette biscottate · biscotti · cereali ·
marmellata · miele · crema di nocciole · zucchero · sale · olio extravergine ·
olio di semi · aceto · pepe · spezie · dado · passata di pomodoro · pomodori pelati ·
tonno in scatola · mais · legumi in scatola · caffè · tè · tisane · acqua · succhi ·
vino · birra · cioccolato · patatine · crackers · taralli · frutta secca ·
pizza surgelata

### Latticini, formaggi e uova
latte · yogurt · panna da cucina · burro · parmigiano · grana · uova ·
formaggio spalmabile · gelato

### Casa e igiene
detersivo piatti · detersivo lavastoviglie · pastiglie lavastoviglie · brillantante ·
sale per lavastoviglie · detersivo lavatrice · ammorbidente · candeggina ·
sgrassatore · detergente pavimenti · anticalcare · spugne · panni · guanti ·
sacchi pattumiera · carta casa · carta igienica · fazzoletti · tovaglioli ·
pellicola · alluminio · carta forno · sapone mani · bagnoschiuma · shampoo ·
balsamo · dentifricio · spazzolino · filo interdentale · deodorante · rasoi ·
schiuma da barba · crema corpo · salviette · cotton fioc

---

**Fonti della ricerca sui prodotti più comuni:**
[Il Fatto Alimentare](https://ilfattoalimentare.it/mercato-pesce-italia.html) ·
[Cronache di Gusto — mercato ittico di Milano](https://www.cronachedigusto.it/cibo-e-dintorni/mercato-del-pesce-ittico-milano-operatori/) ·
[Food Affairs](https://www.foodaffairs.it/2024/07/09/cresce-in-italia-il-consumo-di-pesce-per-un-giro-daffari-di-quasi-90-milioni-di-euro-il-piu-venduto-e-il-salmone-segue-lorata-e-il-pesce-spada/) ·
[Bell Italia — salumi italiani](https://www.bell-italia.com/blog/alimentari/salumi-italiani) ·
[Carni Sostenibili](https://www.carnisostenibili.it/come-scegliere-la-carne-al-banco/)
