import { describe, expect, it } from 'vitest'
import { piattaforma } from './installazione'

const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const mac =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
const android =
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
const windows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'

describe('piattaforma', () => {
  it("riconosce l'iPhone", () => {
    expect(piattaforma(iphone, 5)).toBe('ios')
  })

  it("riconosce l'iPad, che si spaccia per un Mac ma ha il touch", () => {
    expect(piattaforma(mac, 5)).toBe('ios')
  })

  it('un Mac senza touch resta desktop', () => {
    expect(piattaforma(mac, 0)).toBe('desktop')
  })

  it('riconosce Android', () => {
    expect(piattaforma(android, 5)).toBe('android')
  })

  it('il resto è desktop', () => {
    expect(piattaforma(windows)).toBe('desktop')
  })
})
