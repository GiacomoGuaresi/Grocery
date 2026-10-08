import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { estraiRicetta, estraiUrl, formattaIngrediente } from './estraiRicetta'

/** Le pagine vere, ridotte a `<head>` e JSON-LD (senza procedimento né recensioni). */
function fixture(nome: string): string {
  return readFileSync(new URL(`./fixture/${nome}.html`, import.meta.url), 'utf-8')
}

function pagina(...blocchi: unknown[]): string {
  const script = blocchi
    .map((b) => `<script type="application/ld+json">${typeof b === 'string' ? b : JSON.stringify(b)}</script>`)
    .join('\n')
  return `<!doctype html><html><head>${script}</head><body></body></html>`
}

const ricettaMinima = {
  '@type': 'Recipe',
  name: 'Torta di mele',
  recipeIngredient: ['mele 4', 'zucchero 150 g'],
}

describe('estraiRicetta sulle pagine vere', () => {
  it('GialloZafferano: nome, canonical, foto, categoria e ingredienti col testo del sito', () => {
    const url = 'https://ricette.giallozafferano.it/Spaghetti-alla-Carbonara.html?utm_source=app'
    expect(estraiRicetta(fixture('giallozafferano'), url)).toEqual({
      nome: 'Spaghetti alla Carbonara',
      url: 'https://ricette.giallozafferano.it/Spaghetti-alla-Carbonara.html',
      immagine: 'https://www.giallozafferano.it/images/219-21928/Spaghetti-alla-Carbonara_650x433_wm.jpg',
      categorie: ['Primi piatti'],
      ingredienti: [
        'Spaghetti · 320 g',
        'Guanciale · 150 g',
        'Tuorli (di uova medie) · 6',
        'Pecorino Romano DOP · 50 g',
        'Pepe nero · q.b.',
      ],
    })
  })

  it('Fatto in casa da Benedetta: la ricetta dentro @graph, più categorie', () => {
    const url = 'https://www.fattoincasadabenedetta.it/ricetta/biscotti-al-caffe/'
    const ricetta = estraiRicetta(fixture('benedetta'), url)
    expect(ricetta).toMatchObject({
      nome: 'Biscotti al caffè',
      url,
      categorie: ['Biscotti', 'Dolci'],
    })
    expect(ricetta?.immagine).toMatch(/^https:\/\/www\.fattoincasadabenedetta\.it\//)
    expect(ricetta?.ingredienti).toEqual([
      'uova · 2',
      'caffè · 60 ml',
      'caffè solubile · 1 cucchiaino',
      'zucchero · 200 g',
      'amido di mais · 100 g',
      'burro fuso · 125 g',
      'lievito per dolci · 1 cucchiaino',
      'farina · 420 g',
      'gocce di cioccolato · 80 g',
    ])
  })
})

describe('estraiRicetta sulle forme dello JSON-LD', () => {
  const url = 'https://esempio.it/torta'

  it('senza canonical il link è quello da cui è arrivata la pagina', () => {
    expect(estraiRicetta(pagina(ricettaMinima), url)).toEqual({
      nome: 'Torta di mele',
      url,
      categorie: [],
      ingredienti: ['mele · 4', 'zucchero · 150 g'],
    })
  })

  it('@type come array, dentro un array di blocchi', () => {
    const html = pagina([{ '@type': 'WebSite' }, { ...ricettaMinima, '@type': ['Recipe', 'NewsArticle'] }])
    expect(estraiRicetta(html, url)?.nome).toBe('Torta di mele')
  })

  it('un blocco malformato non fa perdere gli altri', () => {
    expect(estraiRicetta(pagina('{ rotto', ricettaMinima), url)?.nome).toBe('Torta di mele')
  })

  it('la foto come ImageObject o come elenco', () => {
    const oggetto = { ...ricettaMinima, image: { '@type': 'ImageObject', url: 'https://esempio.it/a.jpg' } }
    const lista = { ...ricettaMinima, image: ['https://esempio.it/b.jpg', 'https://esempio.it/c.jpg'] }
    expect(estraiRicetta(pagina(oggetto), url)?.immagine).toBe('https://esempio.it/a.jpg')
    expect(estraiRicetta(pagina(lista), url)?.immagine).toBe('https://esempio.it/b.jpg')
  })

  it('le categorie separate da virgola diventano un elenco, senza doppioni', () => {
    const ricetta = { ...ricettaMinima, recipeCategory: ['Dolci, Torte', 'Dolci'] }
    expect(estraiRicetta(pagina(ricetta), url)?.categorie).toEqual(['Dolci', 'Torte'])
  })

  it('ingredienti puliti: entità sciolte, tag e spazi di troppo via, vuoti tolti', () => {
    const ricetta = {
      ...ricettaMinima,
      name: 'Torta dell&rsquo;orso',
      recipeIngredient: ['  burro&nbsp;100 g ', '<b>uova</b> 2', '', 'latte 1&frasl;2 l', 'pane &#232; raffermo'],
    }
    const estratta = estraiRicetta(pagina(ricetta), url)
    expect(estratta?.nome).toBe('Torta dell’orso')
    expect(estratta?.ingredienti).toEqual(['burro · 100 g', 'uova · 2', 'latte · 1/2 l', 'pane è raffermo'])
  })

  it('il canonical relativo si risolve sul link della pagina', () => {
    const html = pagina(ricettaMinima).replace('<head>', '<head><link href="/torta-di-mele" rel="canonical">')
    expect(estraiRicetta(html, url)?.url).toBe('https://esempio.it/torta-di-mele')
  })

  it('una pagina senza ricetta, o con una ricetta senza ingredienti, non dà niente', () => {
    expect(estraiRicetta('<html><head><title>Niente</title></head></html>', url)).toBeNull()
    expect(estraiRicetta(pagina({ '@type': 'Article', name: 'Notizia' }), url)).toBeNull()
    expect(estraiRicetta(pagina({ ...ricettaMinima, recipeIngredient: [] }), url)).toBeNull()
  })
})

describe('formattaIngrediente', () => {
  // Casi presi dalle pagine vere di GialloZafferano, Benedetta e Misya.
  it.each([
    ['Farina 00 100 g', 'Farina 00 · 100 g'],
    ['Pepe nero q.b.', 'Pepe nero · q.b.'],
    ['Sale fino quanto basta', 'Sale fino · q.b.'],
    ['Tuorli (di uova medie) 6', 'Tuorli (di uova medie) · 6'],
    ['Lievito di birra fresco (oppure 1,5 se secco) 4 g', 'Lievito di birra fresco (oppure 1,5 se secco) · 4 g'],
    ['caffè solubile 1 cucchiaino', 'caffè solubile · 1 cucchiaino'],
    ['cannella in polvere 0,5 cucchiaino', 'cannella in polvere · 0,5 cucchiaino'],
    ['Scorza di limone ½', 'Scorza di limone · ½'],
    ['Aglio 2 spicchi', 'Aglio · 2 spicchi'],
  ])('%s → %s', (testo, atteso) => {
    expect(formattaIngrediente(testo)).toBe(atteso)
  })

  it('quello che segue la quantità resta nel nome', () => {
    expect(formattaIngrediente('burro 125 g fuso')).toBe('burro fuso · 125 g')
    expect(formattaIngrediente('zucchero 80 g oppure eritritolo')).toBe('zucchero oppure eritritolo · 80 g')
  })

  it('i prodotti consigliati dal sito dopo la quantità se ne vanno', () => {
    expect(formattaIngrediente('zucca 200 g Zucca a cubetti surgelata Ortomio (solo da PENNY)')).toBe('zucca · 200 g')
    expect(formattaIngrediente('vanillina 3 g Vanillina PANEANGELI')).toBe('vanillina · 3 g')
  })

  it('con la quantità davanti, come su Misya, cade il "di"', () => {
    expect(formattaIngrediente('150 gr di ricotta salata')).toBe('ricotta salata · 150 gr')
    expect(formattaIngrediente('2 spicchi di aglio')).toBe('aglio · 2 spicchi')
    expect(formattaIngrediente('2 melanzane')).toBe('melanzane · 2')
  })

  it('senza quantità resta com’è', () => {
    expect(formattaIngrediente('olio extravergine di oliva')).toBe('olio extravergine di oliva')
    expect(formattaIngrediente('Farina 00')).toBe('Farina 00')
  })
})

describe('estraiUrl', () => {
  it('il link da solo, come lo condivide Chrome', () => {
    expect(estraiUrl('https://ricette.giallozafferano.it/Tiramisu.html')).toBe(
      'https://ricette.giallozafferano.it/Tiramisu.html',
    )
  })

  it('il link dentro il testo, come lo condivide l’app di GialloZafferano', () => {
    const testo = 'Guarda questa ricetta: Tiramisù https://ricette.giallozafferano.it/Tiramisu.html.'
    expect(estraiUrl(testo)).toBe('https://ricette.giallozafferano.it/Tiramisu.html')
  })

  it('un link di Google si scioglie nel sito a cui porta', () => {
    const google = 'https://www.google.com/url?q=https://ricette.giallozafferano.it/Tiramisu.html&sa=U'
    expect(estraiUrl(google)).toBe('https://ricette.giallozafferano.it/Tiramisu.html')
  })

  it('i link brevi restano com’erano: li segue la funzione', () => {
    expect(estraiUrl('https://share.google/AbCd123')).toBe('https://share.google/AbCd123')
  })

  it('senza link non c’è niente da importare', () => {
    expect(estraiUrl('Torta di mele della nonna')).toBeNull()
    expect(estraiUrl('')).toBeNull()
  })
})
