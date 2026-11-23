import { describe, expect, it } from 'vitest'
import { testoVersione, versioneNuova } from './versione'

describe('versioneNuova', () => {
  it('vede un commit diverso', () => {
    expect(versioneNuova('b2c3d4e', 'a1b2c3d')).toBe(true)
  })

  it('tace con lo stesso commit', () => {
    expect(versioneNuova('a1b2c3d', 'a1b2c3d')).toBe(false)
  })

  it('tace senza un commit pubblicato o in sviluppo', () => {
    expect(versioneNuova(undefined, 'a1b2c3d')).toBe(false)
    expect(versioneNuova('', 'a1b2c3d')).toBe(false)
    expect(versioneNuova('a1b2c3d', 'sviluppo')).toBe(false)
    expect(versioneNuova('sviluppo', 'a1b2c3d')).toBe(false)
  })
})

describe('testoVersione', () => {
  it('mette insieme commit e data', () => {
    const testo = testoVersione('a1b2c3d', '2026-11-23T09:42:00Z')
    expect(testo).toMatch(/^Versione a1b2c3d · /)
    expect(testo).toContain('2026')
  })

  it('senza una data valida resta il commit', () => {
    expect(testoVersione('a1b2c3d', 'boh')).toBe('Versione a1b2c3d')
  })
})
