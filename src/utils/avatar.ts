import { API_CONFIG } from '../api/config'
import defaultAvatarUrl from '../assets/default-avatar.svg'

export function resolveAvatarUrl(raw: string | null | undefined): string {
  const avatar = raw?.trim()
  if (!avatar) return defaultAvatarUrl
  if (
    avatar === defaultAvatarUrl
    || avatar.startsWith('http://')
    || avatar.startsWith('https://')
    || avatar.startsWith('data:')
    || avatar.startsWith('blob:')
  ) {
    return avatar
  }
  if (avatar.startsWith('//')) {
    return `${typeof window === 'undefined' ? 'https:' : window.location.protocol}${avatar}`
  }
  try {
    return new URL(avatar, `${API_CONFIG.BASE_URL.replace(/\/+$/, '')}/`).toString()
  } catch {
    return defaultAvatarUrl
  }
}
