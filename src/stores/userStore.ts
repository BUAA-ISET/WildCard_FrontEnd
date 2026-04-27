import { defineStore } from 'pinia'

type Credentials = {
  email: string
  password: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    email: '',
    isLoggedIn: false,
  }),
  actions: {
    async login({ email, password }: Credentials) {
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()

      if (!trimmedEmail || !trimmedPassword) {
        return false
      }

      this.email = trimmedEmail
      this.isLoggedIn = true
      return true
    },
    logout() {
      this.email = ''
      this.isLoggedIn = false
    },
  },
})
