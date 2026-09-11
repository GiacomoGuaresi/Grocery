// Il database in memoria dei test deve comportarsi come Supabase: passa lo
// stesso contratto, e questo gira sempre, anche senza Docker.

import { describe } from 'vitest'
import { verificaContratto } from './contratto'
import { StorageInMemoria } from './inMemoria'

describe('StorageInMemoria', () => {
  verificaContratto(async () => new StorageInMemoria())
})
