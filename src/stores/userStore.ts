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
      if (!email.trim() || !password.trim()) {
        return false
      }

      this.email = email
      this.isLoggedIn = true
      return true
    },
    logout() {
      this.email = ''
      this.isLoggedIn = false
    },
  },
})
