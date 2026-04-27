import { describe, expect, it } from 'vitest'
import { buildRoomCode, normalizeRoomName } from '../helpers'

describe('helpers', () => {
  it('normalizes repeated whitespace in room names', () => {
    expect(normalizeRoomName('  Alpha   Room  ')).toBe('Alpha Room')
  })

  it('builds an uppercase room code', () => {
    expect(buildRoomCode('alpha')).toBe('ALPH')
    expect(buildRoomCode('go')).toBe('GOXX')
  })
})
