import { describe, expect, it } from 'vitest'
import { mesi, stagionalita, type GruppoFisso, type Mese } from './dati'
import { diStagioneNelPeriodo, meseDi, stagioneDi, stagioni } from './stagioni'

describe('stagioni', () => {
  it('coprono i dodici mesi, ognuno una volta sola', () => {
    const tutti = stagioni.flatMap((s) => s.mesi)
    expect([...tutti].sort((a, b) => a - b)).toEqual(mesi)
  })

  it('l\'inverno comprende dicembre, settembre è già autunno', () => {
    expect(stagioneDi(12).id).toBe('inverno')
    expect(stagioneDi(1).id).toBe('inverno')
    expect(stagioneDi(9).id).toBe('autunno')
    expect(stagioneDi(6).id).toBe('estate')
    expect(stagioneDi(3).id).toBe('primavera')
  })
})

describe('meseDi', () => {
  it('conta da gennaio (1) a dicembre (12)', () => {
    expect(meseDi(new Date(2026, 0, 15))).toBe(1)
    expect(meseDi(new Date(2026, 8, 11))).toBe(9)
    expect(meseDi(new Date(2026, 11, 31))).toBe(12)
  })
})

const autunno = stagioni.find((s) => s.id === 'autunno')!
const nomi = (gruppo: GruppoFisso, periodo: readonly Mese[]) =>
  diStagioneNelPeriodo(gruppo, periodo).diStagione.map((t) => t.nome)

describe('diStagioneNelPeriodo', () => {
  it('in un mese dà solo quello che c\'è quel mese', () => {
    expect(nomi('frutta', [9])).toContain('fichi')
    expect(nomi('frutta', [9])).toContain('uva')
    expect(nomi('frutta', [9])).not.toContain('ciliegie')
    expect(nomi('frutta', [9])).not.toContain('cachi')
    expect(nomi('verdura', [9])).toContain('funghi porcini')
    expect(nomi('verdura', [9])).not.toContain('asparagi')
  })

  it('in una stagione basta un mese: i fichi di settembre sono frutta d\'autunno', () => {
    expect(nomi('frutta', autunno.mesi)).toContain('fichi')
    expect(nomi('frutta', autunno.mesi)).toContain('cachi')
    expect(nomi('frutta', autunno.mesi)).not.toContain('ciliegie')
    expect(nomi('verdura', autunno.mesi)).toContain('cardi')
    expect(nomi('verdura', autunno.mesi)).not.toContain('agretti')
  })

  it('non mescola i gruppi', () => {
    expect(nomi('frutta', mesi)).not.toContain('zucca')
    expect(nomi('verdura', mesi)).not.toContain('fichi')
  })

  it('tiene a parte quello che c\'è tutto l\'anno', () => {
    const frutta = diStagioneNelPeriodo('frutta', [7])
    expect(frutta.tuttoLAnno).toEqual(['ananas', 'banane', 'limoni', 'mele'])
    const verdura = diStagioneNelPeriodo('verdura', [7])
    expect(verdura.tuttoLAnno).toEqual(['carote', 'cipolle', 'funghi coltivati', 'patate', 'songino'])
    for (const { diStagione, tuttoLAnno } of [frutta, verdura]) {
      for (const nome of tuttoLAnno) {
        expect(diStagione.map((t) => t.nome)).not.toContain(nome)
      }
    }
  })

  it('porta con sé tutti i mesi del tipo, non solo quelli del periodo', () => {
    const fichi = diStagioneNelPeriodo('frutta', [9]).diStagione.find((t) => t.nome === 'fichi')
    expect(fichi?.mesi).toEqual(stagionalita.frutta.fichi)
  })

  it.each(['frutta', 'verdura'] as const)('%s: è in ordine alfabetico', (gruppo) => {
    const elenco = nomi(gruppo, mesi)
    expect(elenco).toEqual([...elenco].sort((a, b) => a.localeCompare(b, 'it')))
  })

  it.each(['frutta', 'verdura'] as const)(
    '%s: su tutto l\'anno non perde né duplica nessun tipo',
    (gruppo) => {
      const { diStagione, tuttoLAnno } = diStagioneNelPeriodo(gruppo, mesi)
      const tutti = [...diStagione.map((t) => t.nome), ...tuttoLAnno]
      expect(new Set(tutti).size).toBe(tutti.length)
      expect([...tutti].sort()).toEqual(Object.keys(stagionalita[gruppo]).sort())
    },
  )
})
