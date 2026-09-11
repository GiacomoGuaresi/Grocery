import { describe, expect, it } from 'vitest'
import reparti from '../data/reparti.json'

// Test di smoke: se questo passa, catena di build e test è in piedi.
describe('fondamenta', () => {
  it('carica i reparti dal JSON', () => {
    expect(Array.isArray(reparti.reparti)).toBe(true)
    expect(reparti.reparti.length).toBe(8)
  })
})
