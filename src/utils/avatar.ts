import { API_CONFIG } from '../api/config'
import defaultAvatarUrl from '../assets/default-avatar.svg'

export function resolveAvatarUrl(raw: string | null | undefined): string {
  if (!raw) return defaultAvatarUrl
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw
  }
  return `${API_CONFIG.BASE_URL}${raw}`
}
