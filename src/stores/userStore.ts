import { defineStore } from 'pinia'
import { userApi, type User } from '../api/user'

type Credentials = {
  email: string
  password: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '',
    email: '',
    username: '',
    avatar: '',
    isLoggedIn: false,
  }),
  actions: {
    applyUser(user: User | null) {
      if (!user) {
        this.id = ''
        this.email = ''
        this.username = ''
        this.avatar = ''
        this.isLoggedIn = false
        return
      }

      this.id = user.id
      this.email = user.email
      this.username = user.username
      this.avatar = user.avatar
      this.isLoggedIn = true
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
      const result = await userApi.getCurrentUser()
      if (result.success) {
        this.applyUser(result.data ?? null)
      } else {
        this.applyUser(null)
      }
      return result
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
