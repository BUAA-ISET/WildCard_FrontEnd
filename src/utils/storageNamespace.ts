const sessionId = import.meta.env.VITE_MOCK_SESSION_ID || 'default'

export function scopedStorageKey(key: string) {
  return `wildcard:${sessionId}:${key}`
}

export const USER_STORAGE_KEY = scopedStorageKey('user')
