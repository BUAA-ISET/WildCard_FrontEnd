import { defineStore } from 'pinia'
import { userApi, type User } from '../api/user'
import { USER_STORAGE_KEY } from '../utils/storageNamespace'

type Credentials = {
  email: string
  password: string
}

function loadUserFromStorage(): User | null {
  try {
    const stored = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load user from storage:', e)
  }
  return null
}

function saveUserToStorage(user: User | null): void {
  try {
    if (user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to save user to storage:', e)
  }
}

export const useUserStore = defineStore('user', {
  state: () => {
    const storedUser = loadUserFromStorage()
    return {
      id: storedUser?.id ?? '',
      email: storedUser?.email ?? '',
      username: storedUser?.username ?? '',
      avatar: storedUser?.avatar ?? '',
      isLoggedIn: storedUser !== null,
    }
  },
  actions: {
    applyUser(user: User | null) {
      if (!user) {
        this.id = ''
        this.email = ''
        this.username = ''
        this.avatar = ''
        this.isLoggedIn = false
        saveUserToStorage(null)
        return
      }

      this.id = user.id
      this.email = user.email
      this.username = user.username
      this.avatar = user.avatar
      this.isLoggedIn = true
      saveUserToStorage(user)
    },
    async login({ email, password }: Credentials) {
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()

      if (!trimmedEmail || !trimmedPassword) {
        return { success: false, message: '请输入邮箱和密码' }
      }

      const result = await userApi.login({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (result.success && result.data) {
        this.applyUser(result.data)
      }

      return result
    },
    async register(user: { email: string; password: string; username: string; verificationCode: string }) {
      const result = await userApi.register(user)

      if (result.success && result.data) {
        this.applyUser(result.data)
      }

      return result
    },
    async fetchCurrentUser() {
      try {
        const result = await userApi.getCurrentUser()
        if (result.success) {
          this.applyUser(result.data ?? null)
        } else {
          this.applyUser(null)
        }
        return result
      } catch {
        this.applyUser(null)
        return { success: false, message: 'Failed to fetch current user' }
      }
    },
    setUser(user: User | null) {
      this.applyUser(user)
    },
    async logout() {
      await userApi.logout()
      this.applyUser(null)
    },
  },
})
