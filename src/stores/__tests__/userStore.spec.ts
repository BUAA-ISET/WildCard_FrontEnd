import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../userStore'

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in successfully with valid credentials', async () => {
    const store = useUserStore()

    const result = await store.login({
      email: 'test@test.com',
      password: 'password',
    })

    expect(result).toBe(true)
    expect(store.isLoggedIn).toBe(true)
    expect(store.email).toBe('test@test.com')
  })

  it('resets state on logout', async () => {
    const store = useUserStore()

    await store.login({
      email: 'test@test.com',
      password: 'password',
    })
    store.logout()

    expect(store.isLoggedIn).toBe(false)
    expect(store.email).toBe('')
  })
})
