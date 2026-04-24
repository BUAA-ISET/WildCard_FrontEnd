export function normalizeRoomName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function buildRoomCode(seed: string) {
  return normalizeRoomName(seed).slice(0, 4).toUpperCase().padEnd(4, 'X')
}
